// types.ts

// ... existing types (Strategy, ChainConfig)

// FIX: TS2339 & TS2353 - Add missing fields for Worker execution
export interface WorkerTaskData {
    // Required by ExecutionWorker.ts (Line 28)
    txHash: string;
    pendingTx: any; // Use a proper transaction type if possible, or 'any' temporarily
    fees: number;
    mevHelperContractAddress: string;
    
    // Existing fields for the worker to process the bundle
    txs: string[];
    blockNumber: number;
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
    resolver: TaskResolver; // FIX: Name is 'resolver', not 'resolve'
    task: string; // FIX: TS2339/TS2353 - Used in WorkerPool.ts
}

export interface WorkerStats {
    workerId: number;
    tasksProcessed: number;
    uptimeSeconds: number;
    totalWorkers: number; // FIX: TS2353 - Used in WorkerPool.ts
}
