// logger.ts

import * as winston from 'winston';
import { TransformableInfo } from 'logform'; 

// FINAL FIX TS2430: Define the interface to strictly comply with the base TransformableInfo's requirements 
// for properties like 'level' while still allowing for the fields we need.
interface CustomLogInfo extends TransformableInfo {
    // We explicitly define level and message as string (non-optional) to satisfy the base interface.
    // The inner function must handle potential undefined values added by winston during the pipeline.
    level: string; 
    message: string; 
    timestamp?: string; // Optional because timestamp() adds it, not the base info object
    stack?: string;
}

const logFormat = winston.format.printf(
    ({ level, message, timestamp, stack }: CustomLogInfo) => { 
        // We use nullish coalescing to safely access the fields, knowing they might be missing 
        // even if the type definition requires them.
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
