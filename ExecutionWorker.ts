// src/ExecutionWorker.ts

import { parentPort } from 'node:worker_threads';
import { 
    ethers, 
    BigNumber, 
    Wallet 
} from 'ethers';	
import { EVM_STRATEGY_POOL } from './evmStrategies.js'; // Corrected Import
import { logger } from './logger.js';
import * as dotenv from 'dotenv';
import { WorkerTaskData } from './types.js';

dotenv.config();

const privateKey = process.env.WALLET_PRIVATE_KEY;
if (!privateKey) {
    logger.fatal("[WORKER] WALLET_PRIVATE_KEY is missing. Worker cannot sign transactions.");
    process.exit(1);
}

const signingWallet = new Wallet(privateKey);


parentPort!.on('message', async (message: { type: string, data: WorkerTaskData, taskId: number }) => {
	if (message.type !== 'task') return;
    
    const { txHash, pendingTx, fees, mevHelperContractAddress } = message.data;
    const taskId = message.taskId;
	
	let winningStrategyResult: any = null;
	let maxProfitWei = BigNumber.from(0);

	try {
        // --- 1. Calculate Transaction Costs (EIP-1559 Tip) ---
		const maxPriorityFeePerGas = BigNumber.from(fees.maxPriorityFeePerGas);
		const ARBITRAGE_GAS_LIMIT = BigNumber.from(400000); 
		const gasCost = maxPriorityFeePerGas.mul(ARBITRAGE_GAS_LIMIT);	
        
        const pendingTxValue = BigNumber.from(pendingTx.value || 0);
        const MIN_PROFIT_THRESHOLD = ethers.utils.parseEther(process.env.MIN_PROFIT_THRESHOLD || "0.0001");


		// --- 2. Iterate and Simulate 1500 Strategies in a tight loop ---
		for (const strategy of EVM_STRATEGY_POOL) {
            
            // =========================================================
            // CORE SIMULATION LOGIC: (Placeholder for fast, native code execution)
            // =========================================================
            let mockGrossProfit: BigNumber;

            // MOCK PROFIT: 
            if (Math.random() < 0.001) { 
                mockGrossProfit = pendingTxValue.mul(5).div(1000).add(ethers.utils.parseEther("0.02")); 
            } else if (Math.random() < 0.01) {
                mockGrossProfit = ethers.utils.parseEther("0.005");
            } else {
                continue; 
            }
            
            // --- 3. Calculate Net Profit ---
            const netProfitWei = mockGrossProfit.sub(gasCost);
            
            // --- 4. Check Winning Condition ---
            if (netProfitWei.gt(maxProfitWei) && netProfitWei.gt(MIN_PROFIT_THRESHOLD)) {
                maxProfitWei = netProfitWei;
                
                logger.debug(`[WORKER WIN] Strategy ${strategy.id} found profit: ${ethers.utils.formatEther(netProfitWei)} ETH`);

                // --- 5. Build and Sign the Transaction ---
                
                const tx = {
                    to: mevHelperContractAddress,
                    data: strategy.targetContract, 
                    gasLimit: ARBITRAGE_GAS_LIMIT,
                    value: 0, 
                    // Nonce is taken from the pending transaction, assuming the bot's tx will be second in the bundle
                    nonce: pendingTx.nonce, 
                    type: 2, 
                    maxFeePerGas: BigNumber.from(fees.maxFeePerGas),
                    maxPriorityFeePerGas: maxPriorityFeePerGas,
                };
                
                const signedTransaction = await signingWallet.signTransaction(tx);
                
                winningStrategyResult = {	
	                     netProfit: netProfitWei.toString(),
	                     strategyId: `EVM-${strategy.id} (${strategy.tokenPair})`,
	                     signedTransaction: signedTransaction,	
	                 };
            }
		} 
		
	} catch (error) {
		logger.error(`[WORKER CRASH] Error processing tx ${txHash}`, error); 
	}

	// Send the BEST result back to the main thread, along with the task ID
	parentPort!.postMessage({ result: winningStrategyResult, taskId });
});
