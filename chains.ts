// chains.ts
// Assumed location: /app/chains.ts

// FINAL FIX TS2304: Use 'import' to make ChainConfig available locally.
import { ChainConfig } from './types.js'; 

// FINAL FIX TS2459: Use a separate 'export' to make ChainConfig available to other modules (like FlashbotsMEVExecutor.ts).
export { ChainConfig } from './types.js'; // This satisfies the other module's import

function getEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        console.warn(`Environment variable ${key} is not set. Using placeholder.`);
        return `http://placeholder-for-${key}.local`; 
    }
    return value;
}

export const CHAINS: ChainConfig[] = [ // This line now works
    {
        chainId: 1, 
        name: 'Ethereum Mainnet',
        httpUrl: getEnv('ETH_HTTP_RPC_URL'),
        wssUrl: getEnv('ETH_WSS_URL'),
        flashbotsUrl: getEnv('FLASHBOTS_URL'),
    },
];
