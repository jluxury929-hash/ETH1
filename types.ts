// types.ts

// FIX: TS2305 - Must export the Strategy interface
export interface Strategy {
    name: string;
    isActive: boolean;
    // Add any other properties your strategy objects require
}

export interface ChainConfig {
    chainId: number;
    name: string;
    httpUrl: string;
    wssUrl: string;
    flashbotsUrl: string;
}
