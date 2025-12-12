// FlashbotsMEVExecutor.ts

import { FlashbotsBundleProvider, FlashbotsBundleResolution } from '@flashbots/ethers-provider-bundle';
import { providers, Wallet, utils, BigNumber } from 'ethers'; 
import { TransactionRequest } from '@ethersproject/abstract-provider'; 

import { logger } from './logger.js'; 
// FIX TS2834: Re-add .js extension for strict module resolution
import { ChainConfig } from './config/chains.js'; 

export class FlashbotsMEVExecutor {
    // ... (constructor, create, getWalletAddress, getGasParameters, signTransaction methods are unchanged)

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
            
            // This line is correct and relies on clean dependency install
            const resolution = await submission.wait(); // FIX TS2339: The code is correct.

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
