// logger.ts (Cleaned and simplified for node resolution)

import * as winston from 'winston';
// Remove the complex imports and interfaces
// The compiler should now default to a compatible type since module resolution is node.

const logFormat = winston.format.printf(
    // Reverting to the most stable, canonical type path.
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
