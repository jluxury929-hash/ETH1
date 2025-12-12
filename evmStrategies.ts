// src/evmStrategies.ts

export interface StrategyDefinition {
    id: number;
    tokenPair: string;
    path: string[]; 
    targetContract: string; 
}

export const EVM_STRATEGY_POOL: StrategyDefinition[] = [];
const NUM_STRATEGIES = 1500;

for (let i = 1; i <= NUM_STRATEGIES; i++) {
    EVM_STRATEGY_POOL.push({
        id: i,
        tokenPair: `TOKEN_${i} / WETH`,
        path: [`DEX_${i % 5}`, `DEX_${(i + 1) % 5}`],
        targetContract: `0x${i.toString(16).padStart(64, '0')}`,
    });
}
