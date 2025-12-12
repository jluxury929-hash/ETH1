// src/APIServer.ts

import express from 'express';
import { logger } from './logger.js';
import { getStats } from './WorkerPool.js'; 
import { EVM_STRATEGY_POOL } from './evmStrategies.js'; // CORRECTED IMPORT PATH

const app = express();
const PORT = process.env.PORT || 8080;

export function startAPIServer() {
	app.get('/health', (req, res) => {
		res.status(200).json({ status: 'OK', engine: 'Running', time: new Date().toISOString() });
	});
    
    app.get('/metrics', (req, res) => {
        const poolStats = getStats();
        res.status(200).json({ 
            status: 'OK', 
            service: 'EVM MEV Bot',
            workers: poolStats,
            strategiesMonitored: EVM_STRATEGY_POOL.length,
            uptimeSeconds: process.uptime(),
        });
    });

	app.listen(PORT, () => {
		logger.info(`[API] Health/Metrics server running on http://localhost:${PORT}`);
	});
}
