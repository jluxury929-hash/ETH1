// MempoolMonitor.ts

import { ethers, providers } from 'ethers';

// FIX: Added .js extension
import { logger } from './logger.js'; 

export class MempoolMonitor {
    private provider: providers.WebSocketProvider;
    public isMonitoring: boolean = false; // FIX: Added property for TS2339

    constructor(wssUrl: string) {
        this.provider = new providers.WebSocketProvider(wssUrl);
        // Do not set isMonitoring here, set it in start()
        this.setupListeners();
    }
    
    public start(): void {
        this.isMonitoring = true;
        this.provider.removeAllListeners(); // Clean slate if restarting
        this.setupListeners();
    }

    private setupListeners(): void {
        this.provider.on('pending', (txHash: string) => {
            logger.debug(`[MONITOR] Received pending transaction hash: ${txHash.substring(0, 10)}...`);
        });

        this.provider.on('error', (error) => {
            logger.error(`[MONITOR] Provider error: ${error.message}`);
        });

        this.provider.on('open', () => {
            logger.info("[MONITOR] WebSocket connection open and monitoring.");
        });
    }

    public stop(): void {
        this.provider.removeAllListeners();
        // Use destroy for clean socket termination
        if (typeof (this.provider as any).destroy === 'function') {
            (this.provider as any).destroy(); 
        }
        this.isMonitoring = false; // Set status on stop
        logger.info("[MONITOR] Monitoring stopped.");
    }
}
