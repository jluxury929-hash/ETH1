// src/MempoolMonitor.ts

import { providers, BigNumber } from 'ethers';
import { logger } from './logger.js';
import axios from 'axios';
import { NonceManager } from './NonceManager.js';
import { executeStrategyTask } from './WorkerPool.js';
import { FlashbotsMEVExecutor } from './FlashbotsMEVExecutor.js';
import { WorkerTaskData } from './types.js';

const RECONNECT_DELAY_MS = 5000; 
const CHAIN_ID = 1; 

export class MempoolMonitor {
    private wsProvider: providers.WebSocketProvider | undefined;
    private readonly httpProvider: providers.JsonRpcProvider;
    private readonly nonceManager: NonceManager;
    private readonly executor: FlashbotsMEVExecutor;
    private readonly mevHelperContractAddress: string;
    private readonly gasApiUrl: string;

    constructor(
        httpProvider: providers.JsonRpcProvider, 
        nonceManager: NonceManager,
        executor: FlashbotsMEVExecutor,
        mevHelperContractAddress: string,
        gasApiUrl: string
    ) {
        this.httpProvider = httpProvider;
        this.nonceManager = nonceManager;
        this.executor = executor;
        this.mevHelperContractAddress = mevHelperContractAddress;
        this.gasApiUrl = gasApiUrl;
        this.initializeWsProvider();
    }

    private initializeWsProvider(): void {
        const wssRpcUrl = process.env.ETHEREUM_WSS;
        if (!wssRpcUrl) return;

        if (this.wsProvider) {
            this.wsProvider.removeAllListeners();
            (this.wsProvider as any).destroy(); 
        }
        
        try {
            this.wsProvider = new providers.WebSocketProvider(wssRpcUrl);
            this.setupWsConnectionListeners();
        } catch (error) {
            logger.error("[WSS] WebSocket Provider failed to initialize.", error);
            this.wsProvider = undefined;
        }
    }

    private reconnectWsProvider(): void {
        if (!process.env.ETHEREUM_WSS) return;

        setTimeout(() => {
            logger.warn("[WSS] Retrying connection...");
            this.initializeWsProvider(); 
        }, RECONNECT_DELAY_MS);
    }

    private setupWsConnectionListeners(): void {
        if (!this.wsProvider) return;

        this.wsProvider.once('open', () => {
            logger.info("[WSS] Connection established successfully! Monitoring mempool...");
            this.wsProvider!.on('pending', this.handlePendingTransaction.bind(this));
        });

        this.wsProvider.on('error', (error: Error) => {
            logger.error(`[WSS] Provider Event Error: ${error.message}. Attempting reconnect...`);
            this.reconnectWsProvider();
        });

        this.wsProvider.on('close', (code: number, reason: string) => {
            this.wsProvider!.removeAllListeners('pending');
            logger.error(`[WSS] Connection Closed (Code: ${code}). Reason: ${reason}. Attempting reconnect...`);
            this.reconnectWsProvider();
        });
    }

    private async getCompetitiveFees(): Promise<{ maxFeePerGas: BigNumber, maxPriorityFeePerGas: BigNumber } | null> {
        if (!this.gasApiUrl) return null;

        try {
            const url = `${this.gasApiUrl}/networks/${CHAIN_ID}/suggestedGasFees`;
            const response = await axios.get(url);
            
            const highPriority = response.data.high;
            
            const maxPriorityFeePerGas = BigNumber.from(highPriority.suggestedMaxPriorityFeePerGas).mul(1e9); 
            const maxFeePerGas = BigNumber.from(highPriority.suggestedMaxFeePerGas).mul(1e9); 
            
            return { maxFeePerGas, maxPriorityFeePerGas };

        } catch (error) {
            logger.error(`[GAS API CRASH] Failed to fetch gas fees.`, error);
            return null;
        }
    }


    private async handlePendingTransaction(txHash: string): Promise<void> {
        try {
            const pendingTx = await this.httpProvider.getTransaction(txHash);
            const fees = await this.getCompetitiveFees();
            
            if (!pendingTx || !pendingTx.to || !pendingTx.data || !fees) return;

            logger.info(`[PENDING] Received hash: ${txHash.substring(0, 10)}... Submitting to worker pool...`);
            
            // --- Build Worker Task Data ---
            const taskData: WorkerTaskData = { 
                txHash, 
                pendingTx: { 
                    hash: pendingTx.hash, 
                    data: pendingTx.data, 
                    to: pendingTx.to, 
                    from: pendingTx.from, 
                    value: pendingTx.value ? pendingTx.value.toString() : '0', 
                    nonce: pendingTx.nonce 
                }, 
                fees: { 
                    maxFeePerGas: fees.maxFeePerGas.toString(), 
                    maxPriorityFeePerGas: fees.maxPriorityFeePerGas.toString() 
                },
                mevHelperContractAddress: this.mevHelperContractAddress
            };
            
            // Offload the 1500 parallel simulations to the worker pool
            const simulationResult = await executeStrategyTask(taskData);
            
            if (simulationResult && simulationResult.netProfit) {
                logger.info(`[PROFIT] Worker found profit! ${ethers.utils.formatEther(simulationResult.netProfit)} ETH via ${simulationResult.strategyId}`);

                const signedMevTx: string = simulationResult.signedTransaction as string; 
                
                // Build the bundle: [MEV Transaction, Target Transaction]
                const bundle = [
                    signedMevTx,
                    pendingTx.raw as string // The transaction we are frontrunning/sandwhiching
                ];

                // The nonce manager is NOT incremented here because the transaction only executes
                // if the bundle is successful. If it fails, the nonce remains the same.
                await this.executor.sendBundle(bundle, await this.httpProvider.getBlockNumber() + 1);
                logger.info(`[SUBMITTED] Bundle for ${txHash.substring(0, 10)}...`);
            }
            
        } catch (error) {
            logger.error(`[RUNTIME CRASH] Failed to process transaction ${txHash}`, error);
        }
    }

    public isMonitoring(): boolean {
        return !!this.wsProvider;
    }
}
