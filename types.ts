// types.ts

import { BigNumber } from 'ethers';

// FIX TS2305: Ensure Strategy is exported
export interface Strategy {
    name: string;
    isActive: boolean;
}

export interface ChainConfig {
    chainId: number;
    name: string;
    httpUrl: string;
    wssUrl: string;
    flashbotsUrl: string;
}

// FIX TS2339 (ExecutionWorker.ts) - Added missing fields as they are used in the worker logic
export interface WorkerTaskData {
    txHash: string;
    pendingTx: any;
    fees: number; 
    mevHelperContractAddress: string; 
    txs: string[];
    blockNumber: number;
    // ExecutionWorker.ts needs these to be numbers/BigNumbers for calculations
    maxPriorityFeePerGas: BigNumber; 
    maxFeePerGas: BigNumber; 
}

export interface WorkerResult {
    success: boolean;
    message: string;
    blockNumber?: number;
}

export type TaskResolver = (result: WorkerResult) => void;

// FIX TS2353/TS2339 (WorkerPool.ts) - Added 'task' property
export interface WorkerTaskWrapper {
    id: number;
    data: WorkerTaskData;
    resolver: TaskResolver; // FIX TS2551: Property is named 'resolver'
    task: string;
}

// FIX TS2353 (WorkerPool.ts) - Added 'totalWorkers' property
export interface WorkerStats {
    workerId: number;
    tasksProcessed: number;
    uptimeSeconds: number;
    totalWorkers: number;
}
