export declare const BARREL_FILES: readonly ["_barrel.ts", "_barrel.js"];
export type BarrelFileName = (typeof BARREL_FILES)[number];
export interface ExportInfo {
    file: string;
    metaAlias: string;
    defaultAlias: string;
}
export interface BarrelResult {
    path: string;
    fileCount: number;
}
export declare function getSourceExtensions(barrelFile: string): string[];
export declare function getExpectedExports(dir: string, barrelFile: string): ExportInfo[];
export declare function generateBarrel(dir: string, barrelFileOverride?: string): BarrelResult;
export interface BarrelDir {
    dir: string;
    barrelFile: string;
}
export declare function findBarrelDirs(baseDir: string): BarrelDir[];
export declare function initBarrel(dir: string, type?: "ts" | "js"): {
    created: boolean;
    path: string;
};
export declare function updateBarrels(baseDir: string): BarrelResult[];
export interface WatchOptions {
    onUpdate?: (result: BarrelResult) => void;
    debounceMs?: number;
}
export declare function watchBarrels(baseDir: string, options?: WatchOptions): {
    close: () => void;
};
export { extractMetaFromFile, hasMetaExport, mergeMetaProperties, generateMetaInterface, inferType, } from "./meta.js";
