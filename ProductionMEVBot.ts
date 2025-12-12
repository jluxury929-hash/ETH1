// src/ProductionMEVBot.ts

import {	
	ethers,	
	Wallet,
	providers
} from 'ethers';

import * as dotenv from 'dotenv';
import { logger } from './logger.js'; 
import { BotConfig } from './types.js'; 
import { FlashbotsMEVExecutor } from './FlashbotsMEVExecutor.js'; 
import { NonceManager } from './NonceManager.js';
import { MempoolMonitor } from './MempoolMonitor.js';

export class ProductionMEVBot {	
	private signer: Wallet;	
	private httpProvider: providers.JsonRpcProvider;
	private executor: FlashbotsMEVExecutor | undefined;
	private nonceManager: NonceManager | undefined;
	private monitor: MempoolMonitor | undefined;
	private config: BotConfig;
	private gasApiUrl: string;

	constructor() {
		dotenv.config();

		const privateKey = process.env.WALLET_PRIVATE_KEY;
		const fbReputationKey = process.env.FLASHBOTS_RELAY_SIGNER_KEY;
		const httpRpcUrl = process.env.ETHEREUM_RPC_1;
		
		if (!privateKey || !fbReputationKey || !httpRpcUrl) {
			logger.error("Missing critical RPC/Key environment variables. Exiting."); // FIXED: Changed fatal to error
             process.exit(1);
		}

		this.config = {
			walletAddress: '', 
			authSignerKey: fbReputationKey,
			minEthBalance: parseFloat(process.env.MIN_ETH_BALANCE || '0.008'),	
			minProfitThreshold: parseFloat(process.env.MIN_PROFIT_THRESHOLD || '0.0001'),
			mevHelperContractAddress: process.env.MEV_HELPER_CONTRACT_ADDRESS || '',
			flashbotsUrl: process.env.FLASHBOTS_RELAY || 'https://relay.flashbots.net',
		};

		this.gasApiUrl = process.env.INFURA_GAS_API_URL || ''; 
		
		this.httpProvider = new providers.JsonRpcProvider(httpRpcUrl);	
		this.signer = new Wallet(privateKey, this.httpProvider);
		this.config.walletAddress = this.signer.address;
		
		logger.info("Bot configuration loaded.");
	}

	private async initializeExecutor(): Promise<void> {
		try {
			this.executor = await FlashbotsMEVExecutor.create(
				this.signer.privateKey,
				this.config.authSignerKey,
				this.httpProvider.connection.url,
				this.config.flashbotsUrl
			);
			logger.info("Flashbots Executor initialized successfully.");
		} catch (error) {
			logger.error("Failed to initialize FlashbotsMEVExecutor.", error); // FIXED: Changed fatal to error
            process.exit(1);
		}
	}
    
    private async checkBalanceAndNonce(): Promise<void> {
        try {
            const balance = await this.httpProvider.getBalance(this.config.walletAddress);
            const formattedBalance = ethers.utils.formatEther(balance);	
            logger.info(`[BALANCE] Current ETH Balance: ${formattedBalance} ETH`);

            if (balance.lt(ethers.utils.parseEther(this.config.minEthBalance.toString()))) { 
                logger.error(`Balance (${formattedBalance}) is below MIN_ETH_BALANCE. Shutting down.`); // FIXED: Changed fatal to error
                process.exit(1);
            }

            this.nonceManager = new NonceManager(this.config.walletAddress, this.httpProvider);
            await this.nonceManager.initialize();

        } catch (error) {
            logger.error("Could not check balance or initialize nonce manager. Check HTTP_RPC_URL.", error); // FIXED: Changed fatal to error
            process.exit(1);
        }
    }


	public async startMonitoring(): Promise<void> {
		logger.info("[STATUS] Starting bot services...");

		await this.initializeExecutor();	
        await this.checkBalanceAndNonce();
        
        if (!this.executor || !this.nonceManager) return;

        this.monitor = new MempoolMonitor(
            this.httpProvider,
            this.nonceManager,
            this.executor,
            this.config.mevHelperContractAddress,
            this.gasApiUrl
        );
        
        if (this.monitor.isMonitoring()) {
            logger.info("[STATUS] Monitoring fully active.");
        } else {
            logger.warn("WSS Provider is not active. Cannot monitor mempool in real-time.");
        }
	}
}
