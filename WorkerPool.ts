// src/WorkerPool.ts

import { Worker, isMainThread } from 'node:worker_threads';
import * as os from 'os';
import * as path from 'path';
import { logger } from './logger.js';
import { WorkerTaskData, WorkerResult, WorkerTaskWrapper, WorkerStats, TaskResolver } from './types.js';

const NUM_WORKERS = Math.max(2, os.cpus().length - 1); 

class WorkerPool {
    private workers: Worker[] = [];
    private freeWorkers: Worker[] = [];
    private taskQueue: WorkerTaskWrapper[] = [];
    private nextTaskId: number = 0;
    private activeTaskMap: Map<number, TaskResolver> = new Map();

    constructor() {
        logger.info(`[POOL] Initializing Worker Pool with ${NUM_WORKERS} threads...`);
        for (let i = 0; i < NUM_WORKERS; i++) {
            this.createWorker(i);
        }
    }

    private createWorker(id: number): void {
        const workerPath = path.resolve(process.cwd(), 'dist/ExecutionWorker.js'); 
        const worker = new Worker(workerPath, {
            workerData: { id: id },
        });

        worker.on('message', (message: { result: WorkerResult | null, taskId: number }) => {
            const resolver = this.activeTaskMap.get(message.taskId);
            if (resolver) {
                resolver(message.result);
                this.activeTaskMap.delete(message.taskId);
            }
            
            this.freeWorkers.push(worker);
            this.processQueue();
        });

        worker.on('error', (err) => {
            logger.error(`[WORKER:${id}] Thread Error:`, err);
        });

        worker.on('exit', (code) => {
            if (code !== 0) {
                logger.error(`[WORKER:${id}] Worker stopped with exit code ${code}. Replacing...`);
            }
            this.workers = this.workers.filter(w => w !== worker);
            this.freeWorkers = this.freeWorkers.filter(w => w !== worker);
            this.createWorker(id); 
        });

        this.workers.push(worker);
        this.freeWorkers.push(worker);
    }

    private processQueue(): void {
        while (this.taskQueue.length > 0 && this.freeWorkers.length > 0) {
            const worker = this.freeWorkers.pop();
            const taskWrapper = this.taskQueue.shift();

            if (worker && taskWrapper) {
                const taskId = this.nextTaskId++;
                this.activeTaskMap.set(taskId, taskWrapper.resolve);
                
                worker.postMessage({ type: 'task', data: taskWrapper.task, taskId });
            }
        }
    }

    public getStats(): WorkerStats {
        return {
            totalWorkers: this.workers.length,
            busyWorkers: this.workers.length - this.freeWorkers.length,
            idleWorkers: this.freeWorkers.length,
            pendingTasks: this.taskQueue.length,
            activeTasks: this.activeTaskMap.size,
        };
    }

    public executeTask(task: WorkerTaskData): Promise<WorkerResult | null> {
        return new Promise((resolve) => {
            const taskWrapper: WorkerTaskWrapper = { task, resolve };
            this.taskQueue.push(taskWrapper);
            this.processQueue();
        });
    }
}

const pool = isMainThread ? new WorkerPool() : undefined;

export function executeStrategyTask(task: WorkerTaskData): Promise<WorkerResult | null> {
    if (!pool) throw new Error("WorkerPool not initialized in Main Thread.");
    return pool.executeTask(task);
}

export function getStats(): WorkerStats {
    if (!pool) throw new Error("WorkerPool not initialized in Main Thread.");
    return pool.getStats();
}
