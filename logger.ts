// logger.ts

import * as winston from 'winston';
// Import the base type needed for the printf function compatibility check
import { TransformableInfo } from 'logform'; 

// FINAL FIX TS2345: Define a compatible interface. 
// timestamp MUST be optional to satisfy the function parameter type (TransformableInfo).
interface CustomLogInfo extends TransformableInfo {
    level: string;
    message: string;
    timestamp?: string; // Made optional to satisfy the compiler's signature check
    stack?: string;
}

const logFormat = winston.format.printf(
    // Using the final, compatible custom interface
    ({ level, message, timestamp, stack }: CustomLogInfo) => { 
        // We check for timestamp's existence before using it, as it's now optional in the type
        const time = timestamp ? timestamp : new Date().toISOString(); 
        
        if (stack) {
            return `${time} [${level.toUpperCase()}]: ${message}\n${stack}`;
        }
        return `${time} [${level.toUpperCase()}]: ${message}`;
    }
);

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        logFormat
    ),
    transports: [
        new winston.transports.Console()
    ]
});
