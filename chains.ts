// chains.ts

// FINAL FIX TS2307: Path is relative to the new baseUrl (./src)
import { ChainConfig } from 'types.js'; 

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
];
