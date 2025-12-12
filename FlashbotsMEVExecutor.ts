// FlashbotsMEVExecutor.ts

import { FlashbotsBundleProvider, FlashbotsBundleResolution } from '@flashbots/ethers-provider-bundle';
import { providers, Wallet, utils, BigNumber } from 'ethers'; 
import { TransactionRequest } from '@ethersproject/abstract-provider'; 

import { logger } from './logger.js'; 
// Path fix relies on 'baseUrl' in tsconfig.json
import { ChainConfig } from './config/chains.js'; 

export class FlashbotsMEVExecutor {
    private provider: providers.JsonRpcProvider;
    private walletSigner: Wallet;
    private flashbotsProvider: FlashbotsBundleProvider;

    private constructor(
        provider: providers.JsonRpcProvider,
        walletSigner: Wallet,
        flashbotsProvider: FlashbotsBundleProvider
    ) {
        this.provider = provider;
        this.walletSigner = walletSigner;
        this.flashbotsProvider = flashbotsProvider;
    }

    static async create(
        walletPrivateKey: string,
        authPrivateKey: string,
        rpcUrl: string,
        flashbotsUrl: string
    ): Promise<FlashbotsMEVExecutor> {
        const provider = new providers.JsonRpcProvider(rpcUrl);
        const walletSigner = new Wallet(walletPrivateKey, provider);
        const authSigner = new Wallet(authPrivateKey);

        const flashbotsProvider = await FlashbotsBundleProvider.create(
            provider,
            authSigner,
            flashbotsUrl
        );
        logger.info(`[EVM] Flashbots provider created and connected to ${flashbotsUrl}.`);
        return new FlashbotsMEVExecutor(provider, walletSigner, flashbotsProvider);
    }
    
    public getWalletAddress(): string { /* ... */ return this.walletSigner.address; }
    public async getGasParameters(): Promise<{ maxFeePerGas: BigNumber, maxPriorityFeePerGas: BigNumber }> { /* ... */ 
        try {
            const block = await this.provider.getBlock('latest');
            const baseFeePerGas = block.baseFeePerGas || utils.parseUnits('1', 'gwei');
            const priorityFee = utils.parseUnits('3', 'gwei'); 
            const maxFeePerGas = baseFeePerGas.mul(2).add(priorityFee);
            return { maxFeePerGas, maxPriorityFeePerGas: priorityFee };
        } catch (error) {
            return {
                maxFeePerGas: utils.parseUnits('50', 'gwei'),
                maxPriorityFeePerGas: utils.parseUnits('3', 'gwei'),
            };
        }
    }
    public async signTransaction(transaction: TransactionRequest): Promise<string> { /* ... */ 
        if (!transaction.nonce) {
            transaction.nonce = await this.provider.getTransactionCount(this.walletSigner.address, 'pending');
        }
        if (!transaction.maxFeePerGas || !transaction.maxPriorityFeePerGas) {
            const gasParams = await this.getGasParameters();
            transaction.maxFeePerGas = gasParams.maxFeePerGas;
            transaction.maxPriorityFeePerGas = gasParams.maxPriorityFeePerGas;
        }
        return this.walletSigner.signTransaction(transaction);
    }

    async sendBundle(
        signedTxs: string[], 
        blockNumber: number
    ): Promise<void> {
        logger.info(`[Flashbots] Submitting bundle of ${signedTxs.length} txs to block ${blockNumber}...`);

        try {
            const submission = await this.flashbotsProvider.sendRawBundle(
                signedTxs, 
                blockNumber
            );
            
            // FIX TS2339: This correct code relies on the package.json version fix
            const resolution = await submission.wait(); 

            if (resolution === FlashbotsBundleResolution.BundleIncluded) {
                logger.info(`[Flashbots SUCCESS] Bundle included in block ${blockNumber}.`);
            } else if (resolution === FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
                logger.warn(`[Flashbots FAIL] Bundle was not included.`);
            }
        } catch (error) {
            logger.error(`[Flashbots] Bundle submission error.`, error);
            if (error && (error as any).body) {
                logger.error(`Relay response body:`, (error as any).body);
            }
        }
    }
}
