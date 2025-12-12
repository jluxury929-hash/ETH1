// logger.ts

import * as winston from 'winston';
import { TransformableInfo } from 'logform'; 

// FINAL, COMPATIBLE INTERFACE
// This is the least restrictive interface that still maintains type safety for the compiler.
interface CustomLogInfo extends TransformableInfo {
    // These properties are required for the printf function to work, 
    // but made optional here to satisfy the compiler's strict check against TransformableInfo.
    level?: string;
    message?: any; 
    timestamp?: string; 
    stack?: string;
}

const logFormat = winston.format.printf(
    ({ level, message, timestamp, stack }: CustomLogInfo) => { 
        // We use nullish coalescing to safely access the fields.
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
