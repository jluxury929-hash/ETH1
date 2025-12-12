// ProductionMEVBot.ts

import { ethers, providers } from 'ethers';
import { BigNumber } from '@ethersproject/bignumber';

// FIX: TS2305 (Strategy export) and TS2835 (.js extension)
import { logger } from './logger.js';
import { Strategy } from './types.js'; 
import { FlashbotsMEVExecutor } from './FlashbotsMEVExecutor.js';
import { MempoolMonitor } from './MempoolMonitor.js'; 

export class ProductionMEVBot {
    private monitor: MempoolMonitor;
    private executor: FlashbotsMEVExecutor;
    private walletAddress: string;

    constructor(
        executor: FlashbotsMEVExecutor,
        monitor: MempoolMonitor,
        walletAddress: string
    ) {
        this.executor = executor;
        this.monitor = monitor;
        this.walletAddress = walletAddress;
    }

    static async create(
        walletPrivateKey: string,
        authPrivateKey: string,
        rpcUrl: string,
        wssUrl: string,
        flashbotsUrl: string
    ): Promise<ProductionMEVBot> {
        // 1. Initialize Executor
        const executor = await FlashbotsMEVExecutor.create(
            walletPrivateKey,
            authPrivateKey,
            rpcUrl,
            flashbotsUrl
        );
        const walletAddress = executor.getWalletAddress();

        // 2. Initialize Monitor
        const monitor = new MempoolMonitor(wssUrl);

        logger.info(`Bot initialized for wallet: ${walletAddress}`);
        return new ProductionMEVBot(executor, monitor, walletAddress);
    }

    public start(): void {
        logger.info("Starting MEV Bot...");
        // This method name resolves the TS2339 error in index.ts
        this.monitor.start(); 

        // Start main strategy loop
        this.runStrategyLoop();
    }

    private async runStrategyLoop(): Promise<void> {
        // Placeholder for the main logic. 
        if (this.monitor.isMonitoring) { 
            logger.debug("Mempool monitor is active. Ready to process transactions.");
        }
        // ...
    }

    public stop(): void {
        this.monitor.stop();
        logger.warn("MEV Bot gracefully stopped.");
    }
}
