// src/types.ts

import { ethers } from 'ethers';

// --- General Bot Configuration ---
export interface BotConfig {
    walletAddress: string;
    authSignerKey: string;
    minEthBalance: number;
    minProfitThreshold: number;
    mevHelperContractAddress: string;
    flashbotsUrl: string;
}

// --- Worker Task Data Types (Input) ---
export interface WorkerTaskData {
    txHash: string;
    pendingTx: { hash: string, data: string, to: string, from: string, value: string, nonce: number };
    fees: { maxFeePerGas: string, maxPriorityFeePerGas: string };
    mevHelperContractAddress: string; 
}

// --- Worker Result (Output) ---
export interface WorkerResult {
    netProfit: string; // The calculated profit in Wei
    strategyId: string;
    signedTransaction: string; // The raw, RLP-encoded, signed transaction
}

// --- Worker Pool Management Types ---
export type TaskResolver = (result: WorkerResult | null) => void;

export interface WorkerTaskWrapper {
    task: WorkerTaskData;
    resolve: TaskResolver;
}

export interface WorkerStats {
    totalWorkers: number;
    busyWorkers: number;
    idleWorkers: number;
    pendingTasks: number;
    activeTasks: number;
}
