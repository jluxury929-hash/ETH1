// FlashbotsMEVExecutor.ts

import { FlashbotsBundleProvider, FlashbotsBundleResolution } from '@flashbots/ethers-provider-bundle';
import { providers, Wallet } from 'ethers';
import { TransactionRequest } from '@ethersproject/abstract-provider'; 

// FIX: Added .js extension
import { logger } from './logger.js'; 
// FIX: TS2307 - Ensure this path is correct and config/chains.ts exists
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
        // Standard Ethers provider for state reading and transactions
        const provider = new providers.JsonRpcProvider(rpcUrl);
        // The wallet that signs the actual transactions
        const walletSigner = new Wallet(walletPrivateKey, provider);
        // The separate wallet used to authenticate with the Flashbots relay
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
     * Sends a signed bundle of transactions to the Flashbots relay.
     * @param signedTxs Array of raw signed transaction strings.
     * @param blockNumber The target block number for inclusion.
     */
    async sendBundle(
        signedTxs: string[], 
        blockNumber: number
    ): Promise<void> {
        logger.info(`[Flashbots] Submitting bundle to block ${blockNumber}...`);

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
            // Handle specific relay errors vs. network errors
            logger.error(`[Flashbots] Bundle submission error.`, error);
        }
    }
    
    // Add other utility methods here (e.g., getting gas estimations, signing transactions)
}
