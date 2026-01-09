export interface FileInfo {
    name: string;
    path: string;
    meta: Record<string, unknown>;
}
export interface BarrelInfo {
    dir: string;
    relativePath: string;
    barrelFile: string;
    files: FileInfo[];
}
