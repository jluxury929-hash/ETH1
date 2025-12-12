// logger.ts

import * as winston from 'winston';

// We must define a minimal LogInfo type ourselves to bypass the stubborn TS2694/TS2305 error
interface LogInfo {
    level: string;
    message: string;
    timestamp: string;
    stack?: string;
}

const logFormat = winston.format.printf(
    // FINAL FIX TS2694: Using the custom interface to bypass the stubborn dependency type error
    ({ level, message, timestamp, stack }: LogInfo) => { 
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
