// logger.ts

import * as winston from 'winston';
// Remove 'import { Info } from 'logform';'

const logFormat = winston.format.printf(
    // FIX TS2305: Using the stable internal type path that works with all versions
    ({ level, message, timestamp, stack }: winston.Logform.Info) => { 
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
