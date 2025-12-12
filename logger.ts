// logger.ts

import * as winston from 'winston';

// Final, robust interface definition to satisfy TS2345
interface CustomLogInfo {
    level: string;
    message: string;
    timestamp: string; // Required because winston.format.timestamp is used
    stack?: string;
    [key: string]: any; // Allows for other properties winston adds
}

const logFormat = winston.format.printf( // FIX TS2552: Corrected typo from 'wininston' to 'winston'
    // Using the final, robust custom interface
    ({ level, message, timestamp, stack }: CustomLogInfo) => { 
        if (stack) {
            return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
        }
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
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
