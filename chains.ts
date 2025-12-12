// chains.ts
// Located at: src/config/chains.ts

// FINAL CORRECT PATH: Using the relative path that worked in the last successful step
// This assumes 'types.js' resolves to 'src/types.ts' from 'src/config/'
import { ChainConfig } from '../types.js'; 

function getEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        console.warn(`Environment variable ${key} is not set. Using placeholder.`);
        return `http://placeholder-for-${key}.local`; 
    }
    return value;
}

export const CHAINS: ChainConfig[] = [
    {
        chainId: 1, 
        name: 'Ethereum Mainnet',
        httpUrl: getEnv('ETH_HTTP_RPC_URL'),
        wssUrl: getEnv('ETH_WSS_URL'),
        flashbotsUrl: getEnv('FLASHBOTS_URL'),
    },
    // Add other chain configurations as needed (e.g., Goerli, Sepolia, etc.)
];
