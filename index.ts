// src/index.ts

import * as dotenv from 'dotenv';
dotenv.config();

import { logger } from './logger.js'; 
import { ProductionMEVBot } from './ProductionMEVBot.js'; 
import { startAPIServer } from './APIServer.js'; 

// --- Main Application Entry Point ---
async function main() {
	logger.info(`[STEP 1] Initializing Node.js MEV Trading Engine...`);
	
    startAPIServer(); 
    
	logger.info(`[STEP 2] Initializing and Starting MEV Bot...`);
	
	try {
		const bot = new ProductionMEVBot();
		await bot.startMonitoring();
	} catch (error) {
		logger.error("FATAL: Unhandled exception during bot startup.", error); // FIXED: Changed fatal to error
		process.exit(1);
	}
}

main().catch((error) => {
	logger.error("FATAL: Main application crash.", error); // FIXED: Changed fatal to error
	process.exit(1);
});

// Graceful shutdown handling
process.on('SIGINT', () => {
	logger.warn("SIGINT received. Initiating graceful shutdown...");
	process.exit(0);
});
