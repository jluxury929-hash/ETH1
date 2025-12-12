// logger.ts

import * as winston from 'winston';
// FIX TS2694: Directly import the required Info type for the logging format
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
