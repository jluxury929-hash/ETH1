// logger.ts

import * as winston from 'winston';

// FIX TS2345: Define a robust interface that matches the expected output of winston.format.combine
// The compiler requires level, message, and timestamp to be present after timestamp() is called.
interface CustomLogInfo {
    level: string;
    message: string;
    timestamp: string; // Required because winston.format.timestamp is used
    stack?: string;
    [key: string]: any; // Allows for other properties winston adds
}

const logFormat = wininston.format.printf(
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
