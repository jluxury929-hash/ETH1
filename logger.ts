// src/logger.ts

import * as winston from 'winston';

const logFormat = winston.format.printf(
    // Explicitly type the arguments using winston's Info object
    ({ level, message, timestamp, stack }: winston.Logform.Info) => { 
        // Handles stack trace for error logs
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
