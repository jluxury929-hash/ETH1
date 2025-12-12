// src/index.ts

import * as dotenv from 'dotenv';
dotenv.config();

import { logger } from './logger.js'; 
import { ProductionMEVBot } from './ProductionMEVBot.js'; // Corrected Import
import { startAPIServer } from './APIServer.js'; // Corrected Import

// --- Main Application Entry Point ---
async function main() {
	logger.info(`[STEP 1] Initializing Node.js MEV Trading Engine...`);
	
    startAPIServer(); 
    
	logger.info(`[STEP 2] Initializing and Starting MEV Bot...`);
	
	try {
		const bot = new ProductionMEVBot();
		await bot.startMonitoring();
	} catch (error) {
		logger.fatal("FATAL: Unhandled exception during bot startup.", error);
		process.exit(1);
	}
}

main().catch((error) => {
	logger.fatal("FATAL: Main application crash.", error);
	process.exit(1);
});

// Graceful shutdown handling
process.on('SIGINT', () => {
	logger.warn("SIGINT received. Initiating graceful shutdown...");
	process.exit(0);
});
