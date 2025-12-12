// FlashbotsMEVExecutor.ts

import { FlashbotsBundleProvider, FlashbotsBundleResolution } from '@flashbots/ethers-provider-bundle';
import { providers, Wallet, utils, BigNumber } from 'ethers'; 
import { TransactionRequest } from '@ethersproject/abstract-provider'; 

import { logger } from './logger.js'; 
// FIX TS2307: Correct path for module resolution (assuming config folder is sibling)
import { ChainConfig } from './config/chains.js'; 

export class FlashbotsMEVExecutor {
    // ... (constructor and create method remain unchanged)
    private provider: providers.JsonRpcProvider;
    private walletSigner: Wallet;
    private flashbotsProvider: FlashbotsBundleProvider;

    private constructor(
        provider: providers.JsonRpcProvider,
        walletSigner: Wallet,
        flashbotsProvider: FlashbotsBundleProvider
    ) {
        this.provider = provider;
        this.walletSigner = walletSigner;
        this.flashbotsProvider = flashbotsProvider;
    }
    
    static async create(...) { /* ... */ }
    public getWalletAddress(): string { /* ... */ return this.walletSigner.address; }
    public async getGasParameters(): Promise<{ maxFeePerGas: BigNumber, maxPriorityFeePerGas: BigNumber }> { /* ... */ }
    public async signTransaction(transaction: TransactionRequest): Promise<string> { /* ... */ }


    async sendBundle(
        signedTxs: string[], 
        blockNumber: number
    ): Promise<void> {
        logger.info(`[Flashbots] Submitting bundle of ${signedTxs.length} txs to block ${blockNumber}...`);

        try {
            const submission = await this.flashbotsProvider.sendRawBundle(
                signedTxs, 
                blockNumber
            );
            
            // FIX TS2339: The submission object requires .wait()
            const resolution = await submission.wait(); 

            if (resolution === FlashbotsBundleResolution.BundleIncluded) {
                logger.info(`[Flashbots SUCCESS] Bundle included in block ${blockNumber}.`);
            } else if (resolution === FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
                logger.warn(`[Flashbots FAIL] Bundle was not included.`);
            }
        } catch (error) {
            logger.error(`[Flashbots] Bundle submission error.`, error);
            if (error && (error as any).body) {
                logger.error(`Relay response body:`, (error as any).body);
            }
        }
    }
}
