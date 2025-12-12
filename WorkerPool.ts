// WorkerPool.ts

import { Worker } from 'worker_threads';
import { logger } from './logger.js';
import { 
    WorkerTaskData, 
    WorkerResult, 
    WorkerTaskWrapper, 
    WorkerStats, 
    TaskResolver 
} from './types.js';

export class WorkerPool { // Class must be exported for APIServer.ts to use it
    private workers: Worker[] = [];
    private tasks: Map<number, WorkerTaskWrapper> = new Map();
    private nextTaskId: number = 0;
    private maxWorkers: number;

    constructor(workerPath: string, maxWorkers: number = 4) {
        this.maxWorkers = maxWorkers;
        for (let i = 0; i < maxWorkers; i++) {
            const worker = new Worker(workerPath);
            worker.on('message', (message) => this.handleWorkerMessage(message));
            worker.on('error', (err) => logger.error(`Worker ${i} error:`, err));
            this.workers.push(worker);
        }
        logger.info(`Initialized WorkerPool with ${maxWorkers} workers.`);
    }

    private handleWorkerMessage(data: { id: number, result: WorkerResult | null }): void {
        const task = this.tasks.get(data.id);
        
        if (task && data.result) { 
            task.resolver(data.result); 
        } else if (task && !data.result) {
            task.resolver({ success: false, message: "Worker failed to return a result." });
        }
        
        if (task) {
            this.tasks.delete(data.id);
        }
    }

    // FIX TS2305: getStats MUST be public for APIServer.ts to access it
    public getStats(): WorkerStats {
        return {
            workerId: 0,
            tasksProcessed: 0, 
            uptimeSeconds: 0, 
            totalWorkers: this.workers.length
        };
    }

    public addTask(taskData: WorkerTaskData): Promise<WorkerResult> {
        return new Promise((resolve) => {
            const taskId = this.nextTaskId++; 
            const task: string = 'MEV_BUNDLE_EXECUTION'; 

            const wrapper: WorkerTaskWrapper = {
                id: taskId,
                data: taskData,
                resolver: resolve as TaskResolver, 
                task: task 
            };

            this.tasks.set(taskId, wrapper);
            
            const workerIndex = taskId % this.maxWorkers;
            this.workers[workerIndex].postMessage(wrapper);
        });
    }

    public terminate(): void {
        this.workers.forEach(worker => worker.terminate());
        logger.info("WorkerPool terminated.");
    }
}
