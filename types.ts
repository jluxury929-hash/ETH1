// types.ts

// The following types/interfaces are REQUIRED for the WorkerPool and ExecutionWorker:

// FIX: TS2305 - Exports for all missing worker members
export interface WorkerTaskData {
    // Define the data structure passed to a worker for execution
    txs: string[];
    blockNumber: number;
    // Add any other data needed for a worker (e.g., config, specific strategy parameters)
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
}

export interface WorkerStats {
    workerId: number;
    tasksProcessed: number;
    uptimeSeconds: number;
}

// Ensure the existing necessary types are also here:
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
