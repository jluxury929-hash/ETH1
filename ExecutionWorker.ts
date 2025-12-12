// src/ExecutionWorker.ts
// This worker performs the simulation of 1500 strategies against a single pending transaction.

import { parentPort } from 'node:worker_threads';
import { 
    ethers, 
    BigNumber, 
    Wallet 
} from 'ethers'; 
import { EVM_STRATEGY_POOL } from './config/evmStrategies.js'; 
import { logger } from './logger.js';
import * as dotenv from 'dotenv';

// Load environment variables for the worker thread
dotenv.config();

const privateKey = process.env.WALLET_PRIVATE_KEY;
if (!privateKey) {
    logger.fatal("[WORKER] WALLET_PRIVATE_KEY is missing. Worker cannot sign transactions.");
    process.exit(1);
}

// NOTE: Wallet is initialized with a placeholder provider; only the signing capability is needed here.
// The actual nonce/gas estimation happens in the main thread's simulation/execution logic.
const signingWallet = new Wallet(privateKey);


// Interface for the data received from the Main Thread
interface WorkerTaskData {
    txHash: string;
    pendingTx: { hash: string, data: string, to: string, from: string, value: string, nonce: number };
    fees: { maxFeePerGas: string, maxPriorityFeePerGas: string };
    // We add the MEV contract for transaction building
    mevHelperContractAddress: string; 
}


parentPort!.on('message', async (message: { type: string, data: WorkerTaskData }) => {
    if (message.type !== 'task') return;
    
    const { txHash, pendingTx, fees, mevHelperContractAddress } = message.data;
    
    let winningStrategyResult: any = null;
    let maxProfitWei = BigNumber.from(0);

    try {
        // --- 1. Calculate Transaction Costs (Cost-of-Failure check) ---
        const maxPriorityFeePerGas = BigNumber.from(fees.maxPriorityFeePerGas);
        // Estimate the maximum realistic gas limit for the arbitrage transaction
        const ARBITRAGE_GAS_LIMIT = BigNumber.from(400000); 
        const gasCost = maxPriorityFeePerGas.mul(ARBITRAGE_GAS_LIMIT); 
        
        // Convert string values back to BigNumber for calculation
        const pendingTxValue = BigNumber.from(pendingTx.value || 0);

        // --- 2. Iterate and Simulate 1500 Strategies ---
        for (const strategy of EVM_STRATEGY_POOL) {
            
            // =========================================================
            // CORE SIMULATION LOGIC: This is the high-computation step.
            // In a production bot, this block would call a C++/Rust binding 
            // to execute the simulation against a local state fork.
            // =========================================================

            let mockGrossProfit: BigNumber;
            let mockTradeAmount: BigNumber;

            // MOCK PROFIT GENERATION: 
            // Simulate a highly competitive opportunity with low probability
            if (Math.random() < 0.001) { // 0.1% chance of a high-profit find
                // Arbitrage size is proportional to the pending transaction's value
                mockTradeAmount = pendingTxValue.mul(2);
                
                // Gross profit is a small percentage (e.g., 0.5%) of the trade amount
                mockGrossProfit = mockTradeAmount.mul(5).div(1000); 
                
            } else if (Math.random() < 0.01) { // 1% chance of a marginal profit
                mockGrossProfit = ethers.utils.parseEther("0.005");
            } else {
                // No opportunity for this strategy against this transaction
                continue; 
            }
            
            // --- 3. Calculate Net Profit ---
            const netProfitWei = mockGrossProfit.sub(gasCost);
            
            const MIN_PROFIT_THRESHOLD = ethers.utils.parseEther(process.env.MIN_PROFIT_THRESHOLD || "0.0001");

            // --- 4. Check Winning Condition ---
            if (netProfitWei.gt(maxProfitWei) && netProfitWei.gt(MIN_PROFIT_THRESHOLD)) {
                maxProfitWei = netProfitWei;
                
                logger.debug(`[WORKER WIN] Strategy ${strategy.id} found profit: ${ethers.utils.formatEther(netProfitWei)} ETH`);

                // --- 5. Build and Sign the Transaction for the Winning Strategy ---
                
                // The transaction targets the MEV Helper Contract, which executes the strategy logic
                const tx = {
                    to: mevHelperContractAddress,
                    data: strategy.targetContract, // Pass strategy parameters to the helper contract
                    gasLimit: ARBITRAGE_GAS_LIMIT,
                    value: 0, // Usually 0 for arbitrage executed through a flash loan
                    nonce: pendingTx.nonce + 1, // Assume the bot's transaction comes immediately after the pending one
                    type: 2, // EIP-1559 transaction
                    maxFeePerGas: BigNumber.from(fees.maxFeePerGas),
                    maxPriorityFeePerGas: maxPriorityFeePerGas,
                    // chainId and other fields are handled by the signer wallet implicitly
                };
                
                // IMPORTANT: The Wallet signs the transaction without sending it.
                // It's signed offline and passed to the main thread for bundling.
                const signedTransaction = await signingWallet.signTransaction(tx);
                
                winningStrategyResult = { 
                    netProfit: netProfitWei.toString(),
                    strategyId: `EVM-${strategy.id} (${strategy.tokenPair})`,
                    signedTransaction: signedTransaction, 
                };
            }
        } // End of 1500 loop
        
    } catch (error) {
        logger.error(`[WORKER CRASH] Error processing tx ${txHash}`, error); 
    }

    // Send the BEST result back to the main thread
    parentPort!.postMessage({ result: winningStrategyResult });
});
