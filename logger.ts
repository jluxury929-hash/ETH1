// logger.ts

import * as winston from 'winston';
import { TransformableInfo } from 'logform'; 

// FINAL FIX TS2345: Define the interface to be compatible with TransformableInfo.
// We make 'message' accept 'any' or 'unknown' to satisfy the base type check.
interface CustomLogInfo extends TransformableInfo {
    // The base type TransformableInfo defines level/message, but often with loose types (unknown/any).
    // We make them optional to allow the base type to be assigned, and we'll cast inside printf.
    level?: string;
    message?: any; // FIX: Use 'any' or 'unknown' to satisfy the base type, which uses unknown/any
    timestamp?: string; 
    stack?: string;
}

const logFormat = winston.format.printf(
    ({ level, message, timestamp, stack }: CustomLogInfo) => { 
        // Cast to string inside the function and use nullish coalescing for safety
        const msg = String(message ?? '');
        const lvl = level ?? 'info';
        const time = timestamp ?? new Date().toISOString(); 
        
        if (stack) {
            return `${time} [${lvl.toUpperCase()}]: ${msg}\n${stack}`;
        }
        return `${time} [${lvl.toUpperCase()}]: ${msg}`;
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
