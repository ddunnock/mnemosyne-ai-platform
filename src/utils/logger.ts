export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export class Logger {
    constructor(
        private name: string,
        private level: LogLevel = LogLevel.INFO
    ) {}

    setLevel(level: LogLevel): void {
        this.level = level;
    }

    debug(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.DEBUG) {
            console.debug(`[${this.name}] ${message}`, ...args);
        }
    }

    info(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.INFO) {
            console.info(`[${this.name}] ${message}`, ...args);
        }
    }

    warn(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.WARN) {
            console.warn(`[${this.name}] ${message}`, ...args);
        }
    }

    error(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.ERROR) {
            console.error(`[${this.name}] ${message}`, ...args);
        }
    }
}

const loggers = new Map<string, Logger>();

export function getLogger(name: string, level?: LogLevel): Logger {
    if (!loggers.has(name)) {
        loggers.set(name, new Logger(name, level));
    }
    return loggers.get(name)!;
}

export function setGlobalLogLevel(level: LogLevel): void {
    loggers.forEach(logger => logger.setLevel(level));
}