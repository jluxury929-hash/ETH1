// config/chains.ts

// The interface for ChainConfig must be defined in types.ts and exported.
import { ChainConfig } from './types.js'; // FIX: Added .js extension

/**
 * Validates that an environment variable is set.
 * @param key The environment variable name.
 * @returns The value of the environment variable.
 */
function getEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        // NOTE: In a production Docker environment, these must be set!
        console.warn(`Environment variable ${key} is not set. Using placeholder.`);
        return `http://placeholder-for-${key}.local`; 
    }
    return value;
}

/**
 * Array of chain configurations used by the MEV executor.
 */
export const CHAINS: ChainConfig[] = [
    {
        chainId: 1, // Ethereum Mainnet
        name: 'Ethereum Mainnet',
        // FIX: Ensure all required environment variables are retrieved
        httpUrl: getEnv('ETH_HTTP_RPC_URL'),
        wssUrl: getEnv('ETH_WSS_URL'),
        flashbotsUrl: getEnv('FLASHBOTS_URL'),
    },
    // Add other chains here if your bot is multi-chain, e.g., Arbitrum, Optimism
    /*
    {
        chainId: 42161, // Arbitrum One
        name: 'Arbitrum',
        httpUrl: getEnv('ARB_HTTP_RPC_URL'),
        wssUrl: getEnv('ARB_WSS_URL'),
        // Note: L2s may use different MEV relays or direct RPC submission
        flashbotsUrl: getEnv('ARB_MEV_RELAY_URL'), 
    },
    */
];
