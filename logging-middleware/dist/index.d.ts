export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogPayload = {
    stack: string;
    level: LogLevel;
    package: string;
    message: string;
    meta?: any;
    timestamp: string;
};
export declare function Log(stack: string, level: LogLevel, pkg: string, message: string, meta?: any): Promise<void>;
