// MempoolMonitor.ts

import { ethers, providers } from 'ethers';
import { logger } from './logger.js'; // FIX: Added .js extension

export class MempoolMonitor {
    private provider: providers.WebSocketProvider;
    public isMonitoring: boolean = false; // FIX: Added property for TS2339

    constructor(wssUrl: string) {
        this.provider = new providers.WebSocketProvider(wssUrl);
    }
    
    public start(): void {
        this.isMonitoring = true;
        this.provider.removeAllListeners(); 
        this.setupListeners();
        logger.info("[MONITOR] Monitoring started.");
    }

    private setupListeners(): void {
        this.provider.on('pending', (txHash: string) => {
            logger.debug(`[MONITOR] Received pending transaction hash: ${txHash.substring(0, 10)}...`);
        });

        this.provider.on('error', (error) => {
            logger.error(`[MONITOR] Provider error: ${error.message}`);
        });

        this.provider.on('open', () => {
            logger.info("[MONITOR] WebSocket connection open.");
        });
    }

    public stop(): void {
        this.provider.removeAllListeners();
        if (typeof (this.provider as any).destroy === 'function') {
            (this.provider as any).destroy(); 
        }
        this.isMonitoring = false;
        logger.info("[MONITOR] Monitoring stopped.");
    }
}
