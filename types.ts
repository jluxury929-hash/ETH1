// types.ts

import { BigNumber } from 'ethers';

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

export interface WorkerTaskData {
    txHash: string;
    pendingTx: any;
    fees: number; 
    mevHelperContractAddress: string; 
    txs: string[];
    blockNumber: number;
    maxPriorityFeePerGas: BigNumber; 
    maxFeePerGas: BigNumber; 
}

export interface WorkerResult {
    success: boolean;
    message: string;
    blockNumber?: number;
}

export type TaskResolver = (result: WorkerResult) => void;

export interface WorkerTaskWrapper {
    id: number;
    data: WorkerTaskData;
    resolver: TaskResolver;
    task: string;
}

export interface WorkerStats {
    workerId: number;
    tasksProcessed: number;
    uptimeSeconds: number;
    totalWorkers: number;
}
