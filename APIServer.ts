// APIServer.ts

import express from 'express';
import { logger } from './logger.js';
import { WorkerPool } from './WorkerPool.js'; 

export class APIServer {
    private app: express.Application;
    private port: number = 3000;
    private workerPool: WorkerPool;

    constructor(workerPool: WorkerPool, port: number = 3000) {
        this.app = express();
        this.workerPool = workerPool;
        this.port = port;
        this.setupRoutes();
    }

    private setupRoutes() {
        this.app.get('/stats', (req, res) => {
            const stats = this.workerPool.getStats(); 
            res.json(stats);
        });

        this.app.get('/ping', (req, res) => {
            res.status(200).send('Bot API is running.');
        });
    }

    public start(): void {
        this.app.listen(this.port, () => {
            logger.info(`API Server listening on port ${this.port}`);
        });
    }
}
