export interface BarrelInfo {
    dir: string;
    relativePath: string;
    barrelFile: string;
    files: FileInfo[];
}
export interface FileInfo {
    name: string;
    path: string;
    meta: Record<string, unknown>;
}
/**
 * Get all barrels with their files and meta
 */
export declare function getBarrels(baseDir: string): BarrelInfo[];
/**
 * Get a single barrel's info
 */
export declare function getBarrel(baseDir: string, barrelPath: string): BarrelInfo | null;
/**
 * Update meta in a source file
 */
export declare function updateFileMeta(filePath: string, meta: Record<string, unknown>): void;
/**
 * Create a new file with template
 */
export declare function createFile(barrelDir: string, fileName: string, meta: Record<string, unknown>): string;
/**
 * Delete a file and regenerate barrel
 */
export declare function deleteFile(barrelDir: string, fileName: string): void;
/**
 * Regenerate barrel file for a directory
 */
export declare function regenerateBarrel(dir: string): void;
