// src/FlashbotsMEVExecutor.ts

import { FlashbotsBundleProvider, FlashbotsBundleRawTransaction } from '@flashbots/ethers-provider-bundle'; // ADDED: FlashbotsBundleRawTransaction
import { ethers, Wallet, providers } from 'ethers';
import { logger } from './logger.js';

export class FlashbotsMEVExecutor {
    private constructor(
        private provider: providers.JsonRpcProvider,
        private flashbotsProvider: FlashbotsBundleProvider
    ) {}

    static async create(
        privateKey: string, 
        authSignerKey: string,
        rpcUrl: string,
        flashbotsUrl: string
    ): Promise<FlashbotsMEVExecutor> {
        const provider = new providers.JsonRpcProvider(rpcUrl);
        const authSigner = new Wallet(authSignerKey);

        const flashbotsProvider = await FlashbotsBundleProvider.create(
            provider,
            authSigner,
            flashbotsUrl
        );
        return new FlashbotsMEVExecutor(provider, flashbotsProvider);
    }

    async sendBundle(
        signedTxs: string[], 
        blockNumber: number
    ): Promise<void> {
        logger.info(`[Flashbots] Submitting bundle for block ${blockNumber}...`);
        
        // --- FIX: Map the raw signed string array to the required Flashbots type ---
        const flashbotsBundle: FlashbotsBundleRawTransaction[] = signedTxs.map(signedTx => ({ 
            signedTransaction: signedTx 
        }));
        
        try {
            const result = await this.flashbotsProvider.sendBundle(flashbotsBundle, blockNumber); // USED: flashbotsBundle

            if ('error' in result) {
                logger.error(`[Flashbots] Bundle submission failed: ${result.error.message}`);
                return;
            }

            logger.info(`[Flashbots] Bundle sent. Awaiting receipt...`);
            
            const waitResponse = await result.wait();
            
            if (waitResponse === 0) {
                logger.warn(`[Flashbots] Bundle was not included in block ${blockNumber}. (Tip too low/lost race)`);
            } else {
                logger.info(`[Flashbots] Bundle successfully included in block ${blockNumber}! PROFIT EXECUTION CONFIRMED.`);
            }

        } catch (error) {
            logger.error(`[Flashbots] Submission error.`, error);
        }
    }
}
