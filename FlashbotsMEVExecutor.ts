// FlashbotsMEVExecutor.ts

import { FlashbotsBundleProvider, FlashbotsBundleResolution } from '@flashbots/ethers-provider-bundle';
import { providers, Wallet, utils } from 'ethers';
import { TransactionRequest } from '@ethersproject/abstract-provider'; 
import { logger } from './logger.js'; 
import { ChainConfig } from './config/chains.js'; 

export class FlashbotsMEVExecutor {
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

    /**
     * Initializes the Flashbots Executor with the necessary signers and providers.
     */
    static async create(
        walletPrivateKey: string,
        authPrivateKey: string,
        rpcUrl: string,
        flashbotsUrl: string
    ): Promise<FlashbotsMEVExecutor> {
        const provider = new providers.JsonRpcProvider(rpcUrl);
        const walletSigner = new Wallet(walletPrivateKey, provider);
        const authSigner = new Wallet(authPrivateKey);

        const flashbotsProvider = await FlashbotsBundleProvider.create(
            provider,
            authSigner,
            flashbotsUrl
        );

        logger.info(`[EVM] Flashbots provider created and connected to ${flashbotsUrl}.`);
        return new FlashbotsMEVExecutor(provider, walletSigner, flashbotsProvider);
    }
    
    public getWalletAddress(): string {
        return this.walletSigner.address;
    }

    /**
     * Estimates gas parameters required for an EIP-1559 transaction.
     * This is useful for building transactions that offer a competitive maxFee and maxPriorityFee.
     */
    public async getGasParameters(): Promise<{ maxFeePerGas: utils.BigNumber, maxPriorityFeePerGas: utils.BigNumber }> {
        try {
            const block = await this.provider.getBlock('latest');
            const baseFeePerGas = block.baseFeePerGas || utils.parseUnits('1', 'gwei');
            
            // Define a competitive priority fee (e.g., 3 Gwei)
            const priorityFee = utils.parseUnits('3', 'gwei'); 
            
            // Max Fee = Base Fee * 2 + Max Priority Fee
            const maxFeePerGas = baseFeePerGas.mul(2).add(priorityFee);
            
            return {
                maxFeePerGas,
                maxPriorityFeePerGas: priorityFee,
            };
        } catch (error) {
            logger.error(`[EVM] Failed to get gas parameters:`, error);
            // Fallback to safe default values
            return {
                maxFeePerGas: utils.parseUnits('50', 'gwei'),
                maxPriorityFeePerGas: utils.parseUnits('3', 'gwei'),
            };
        }
    }

    /**
     * Signs a transaction request using the wallet signer.
     * @param transaction The transaction request object.
     * @returns The raw, signed transaction string.
     */
    public async signTransaction(transaction: TransactionRequest): Promise<string> {
        if (!transaction.nonce) {
            transaction.nonce = await this.provider.getTransactionCount(this.walletSigner.address, 'pending');
        }
        
        // Add gas parameters if not present
        if (!transaction.maxFeePerGas || !transaction.maxPriorityFeePerGas) {
            const gasParams = await this.getGasParameters();
            transaction.maxFeePerGas = gasParams.maxFeePerGas;
            transaction.maxPriorityFeePerGas = gasParams.maxPriorityFeePerGas;
        }

        try {
            return this.walletSigner.signTransaction(transaction);
        } catch (error) {
            logger.error(`[EVM] Failed to sign transaction:`, error);
            throw error;
        }
    }

    /**
     * Sends a signed bundle of transactions to the Flashbots relay.
     * @param signedTxs Array of raw signed transaction strings.
     * @param blockNumber The target block number for inclusion.
     */
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
            
            // FIX: TS2339 - The submission object requires .wait() to monitor resolution
            const resolution = await submission.wait(); 

            if (resolution === FlashbotsBundleResolution.BundleIncluded) {
                logger.info(`[Flashbots SUCCESS] Bundle included in block ${blockNumber}.`);
            } else if (resolution === FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
                logger.warn(`[Flashbots FAIL] Bundle was not included.`);
            }
        } catch (error) {
            logger.error(`[Flashbots] Bundle submission error.`, error);
            // Log the error details, often useful for debugging why the relay rejected it
            if (error && (error as any).body) {
                logger.error(`Relay response body:`, (error as any).body);
            }
        }
    }
}
