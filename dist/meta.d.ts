export interface MetaProperty {
    name: string;
    type: string;
    required: boolean;
}
/**
 * Infer TypeScript type from a JavaScript value
 */
export declare function inferType(value: unknown): string;
/**
 * Extract meta object from a source file using magicast
 */
export declare function extractMetaFromFile(filePath: string): Record<string, unknown> | null;
/**
 * Merge multiple meta objects and determine property requirements
 */
export declare function mergeMetaProperties(metaList: Record<string, unknown>[]): MetaProperty[];
/**
 * Generate TypeScript interface string from meta properties
 */
export declare function generateMetaInterface(properties: MetaProperty[]): string;
