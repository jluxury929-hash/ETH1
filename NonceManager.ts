// src/NonceManager.ts

import { logger } from './logger.js';
import { providers } from 'ethers';

// Manages the nonce for the bot's wallet to ensure transaction ordering
export class NonceManager {
    private nonce: number | undefined;
    private readonly walletAddress: string;
    private readonly provider: providers.JsonRpcProvider;

    constructor(walletAddress: string, provider: providers.JsonRpcProvider) {
        this.walletAddress = walletAddress;
        this.provider = provider;
        logger.info(`[NONCE] Manager initialized for ${walletAddress.substring(0, 10)}...`);
    }

    public async initialize(): Promise<void> {
        try {
            this.nonce = await this.provider.getTransactionCount(this.walletAddress, 'latest');
            logger.info(`[NONCE] Initial nonce set to: ${this.nonce}`);
        } catch (error) {
            logger.error("[NONCE] Failed to fetch initial nonce. Ensure RPC is working.", error);
            throw error;
        }
    }

    public getNonce(): number {
        if (this.nonce === undefined) {
            throw new Error("NonceManager not initialized. Call initialize() first.");
        }
        return this.nonce;
    }

    public incrementNonce(): void {
        if (this.nonce === undefined) {
             throw new Error("NonceManager not initialized.");
        }
        this.nonce++;
    }
    
    // Safety check: Re-sync nonce periodically
    public async reSyncNonce(): Promise<void> {
        try {
            const currentChainNonce = await this.provider.getTransactionCount(this.walletAddress, 'latest');
            if (this.nonce !== undefined && currentChainNonce > this.nonce) {
                logger.warn(`[NONCE] Nonce discrepancy detected. Local nonce (${this.nonce}) updated to chain nonce (${currentChainNonce}).`);
                this.nonce = currentChainNonce;
            } else if (this.nonce === undefined) {
                this.nonce = currentChainNonce;
            }
        } catch (error) {
            logger.error("[NONCE] Failed to re-sync nonce.", error);
        }
    }
}
