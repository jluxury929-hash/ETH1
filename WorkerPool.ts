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

export class WorkerPool {
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
        // FIX TS2532, TS2304, TS2345: Data is now correctly destructured and checked
        const task = this.tasks.get(data.id);
        
        // Check if task exists and if result is not null
        if (task && data.result) { 
            task.resolver(data.result); 
        } else if (task && !data.result) {
            // Worker returned a null result, treat as failure
            task.resolver({ success: false, message: "Worker failed to return a result." });
        }
        
        if (task) {
            this.tasks.delete(data.id);
            // Worker is now free to receive new tasks
        }
        // else: Log an error for a message from an unknown task ID
    }

    public getStats(): WorkerStats {
        // FIX TS2353: Now includes all required WorkerStats properties
        return {
            workerId: 0, // Placeholder
            tasksProcessed: 0, // Placeholder
            uptimeSeconds: 0, // Placeholder
            totalWorkers: this.workers.length // Correctly set
        };
    }

    public addTask(taskData: WorkerTaskData): Promise<WorkerResult> {
        return new Promise((resolve) => {
            // FIX TS2552, TS2304, TS2353: Variables are correctly defined and scoped
            const taskId = this.nextTaskId++; 
            const task: string = 'MEV_BUNDLE_EXECUTION'; // Fixed string for 'task' property

            const wrapper: WorkerTaskWrapper = {
                id: taskId,
                data: taskData,
                resolver: resolve as TaskResolver, // FIX TS2551: Property is named 'resolver'
                task: task // Correctly assign the 'task' property
            };

            this.tasks.set(taskId, wrapper);
            
            // Simple load balancing: send task to the next available worker
            const workerIndex = taskId % this.maxWorkers;
            this.workers[workerIndex].postMessage(wrapper);
        });
    }

    public terminate(): void {
        this.workers.forEach(worker => worker.terminate());
        logger.info("WorkerPool terminated.");
    }
}
