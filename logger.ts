// logger.ts

import * as winston from 'winston';
// FINAL FIX TS2305: Directly import the required Info type to bypass the Namespace error
import { Info } from 'logform'; 

const logFormat = winston.format.printf(
    // Use the directly imported Info type
    ({ level, message, timestamp, stack }: Info) => { 
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
