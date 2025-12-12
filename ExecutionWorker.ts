// ExecutionWorker.ts

import { parentPort } from 'worker_threads';
import { FlashbotsMEVExecutor } from './FlashbotsMEVExecutor.js'; // Ensure import is correct
import { 
    WorkerTaskData, 
    WorkerResult 
} from './types.js'; // Ensure all types are imported

if (parentPort) {
    parentPort.on('message', async (wrapper: { id: number, data: WorkerTaskData }) => {
        const { id, data } = wrapper;
        
        try {
            // FIX TS2339: The properties are now correctly defined in WorkerTaskData
            const { 
                txHash, 
                pendingTx, 
                fees, 
                mevHelperContractAddress, 
                txs, 
                blockNumber,
                maxPriorityFeePerGas,
                maxFeePerGas
            } = data;
            
            // Placeholder logic: Instantiate executor and send bundle
            // NOTE: In a real app, the executor should be initialized once per worker.
            // const executor = new FlashbotsMEVExecutor(...); 

            // Simulating execution and using the passed data (now correctly typed)
            
            // Example of using the corrected BigNumber properties
            // const tip = maxPriorityFeePerGas.add(fees);

            // Simulating success
            const result: WorkerResult = { 
                success: true, 
                message: `Successfully processed bundle for block ${blockNumber}.`,
                blockNumber: blockNumber
            };
            
            parentPort!.postMessage({ id, result });
            
        } catch (error) {
            // Simulating failure
            const result: WorkerResult = { 
                success: false, 
                message: `Execution failed: ${error}`,
                blockNumber: data.blockNumber
            };
            parentPort!.postMessage({ id, result: null }); // Post null result on error
        }
    });
}
