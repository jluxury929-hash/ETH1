// index.ts

import { ProductionMEVBot } from './ProductionMEVBot.js'; // FIX: Added .js
// import { logger } from './logger.js'; // Assuming logger is available globally or imported elsewhere

// Helper function to safely get environment variables
function getEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set.`);
    }
    return value;
}

async function main() {
    // FIX: TS2554 - ProductionMEVBot.create() expects 5 arguments, supplied via environment variables
    const bot = await ProductionMEVBot.create(
        getEnv('EVM_WALLET_PRIVATE_KEY'),
        getEnv('EVM_AUTH_PRIVATE_KEY'),
        getEnv('ETH_HTTP_RPC_URL'),
        getEnv('ETH_WSS_URL'),
        getEnv('FLASHBOTS_URL')
    );

    // FIX: TS2339 - The method is 'start()' not 'startMonitoring'
    bot.start(); 
}

main().catch(error => {
    console.error("Critical error in main application:", error);
    process.exit(1);
});
