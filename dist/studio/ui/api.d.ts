import type { BarrelInfo } from "./types";
export declare function fetchBarrels(): Promise<BarrelInfo[]>;
export declare function fetchBarrel(barrelPath: string): Promise<BarrelInfo>;
export declare function updateFileMeta(barrelPath: string, fileName: string, meta: Record<string, unknown>): Promise<void>;
export declare function createFile(barrelPath: string, fileName: string, meta: Record<string, unknown>): Promise<void>;
export declare function deleteFile(barrelPath: string, fileName: string): Promise<void>;
