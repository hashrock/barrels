import * as fs from "fs";
import * as path from "path";
import { parseModule, generateCode } from "magicast";
import { extractMetaFromFile, mergeMetaProperties, generateMetaInterface, hasMetaExport, } from "./meta.js";
import { isExportNamedDeclaration, getModuleAst, } from "./ast.js";
function getSourceValue(node) {
    const source = node.source;
    // Handle both "Literal" (acorn) and "StringLiteral" (babel) node types
    if (source && typeof source.value === "string") {
        return source.value;
    }
    return undefined;
}
export const BARREL_FILES = ["_index.ts", "_index.js"];
function findBarrelFile(dir) {
    for (const file of BARREL_FILES) {
        if (fs.existsSync(path.join(dir, file))) {
            return file;
        }
    }
    return null;
}
/**
 * Detect the appropriate barrel file type based on existing files in directory
 */
function detectBarrelType(dir) {
    const entries = fs.readdirSync(dir);
    const hasTsFiles = entries.some((e) => e.endsWith(".ts") || e.endsWith(".tsx"));
    return hasTsFiles ? "_index.ts" : "_index.js";
}
export function getSourceExtensions(barrelFile) {
    if (barrelFile === "_index.ts") {
        return [".ts", ".tsx"];
    }
    return [".js", ".jsx"];
}
export function getExpectedExports(dir, barrelFile) {
    const sourceExts = getSourceExtensions(barrelFile);
    const files = fs
        .readdirSync(dir)
        .filter((file) => {
        const ext = path.extname(file);
        return sourceExts.includes(ext) && file !== barrelFile;
    })
        .sort();
    return files.map((file) => {
        const ext = path.extname(file);
        const name = path.basename(file, ext);
        const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
        return {
            file: `./${file}`,
            metaAlias: `${name}Meta`,
            defaultAlias: pascalName,
        };
    });
}
/**
 * Get array name from directory name
 */
function getArrayName(dir) {
    return path.basename(dir);
}
/**
 * Generate Meta interface and array export code
 */
function generateMetaAndArrayCode(dir, expected) {
    // Extract meta from all source files
    const metaList = [];
    for (const exp of expected) {
        const filePath = path.join(dir, exp.file.replace("./", ""));
        const meta = extractMetaFromFile(filePath);
        if (meta) {
            metaList.push(meta);
        }
    }
    // Generate Meta interface
    const properties = mergeMetaProperties(metaList);
    const interfaceCode = generateMetaInterface(properties);
    // Generate array export
    const arrayName = getArrayName(dir);
    const arrayItems = expected
        .map((e) => `  { meta: ${e.metaAlias}, Component: ${e.defaultAlias} }`)
        .join(",\n");
    const arrayCode = `export const ${arrayName} = [\n${arrayItems},\n];`;
    return { interfaceCode, arrayCode };
}
export function generateBarrel(dir, barrelFileOverride) {
    // Use provided barrel file, or find existing, or detect based on source files
    let barrelFile = barrelFileOverride || findBarrelFile(dir);
    const needsCreation = !barrelFile;
    if (!barrelFile) {
        // Auto-detect barrel file type based on existing source files
        barrelFile = detectBarrelType(dir);
    }
    const expected = getExpectedExports(dir, barrelFile);
    const outputPath = path.join(dir, barrelFile);
    let mod;
    let existingSources = new Set();
    // Check if barrel file exists
    const barrelExists = fs.existsSync(outputPath);
    const content = barrelExists
        ? fs.readFileSync(outputPath, "utf-8")
        : "// Auto-generated barrel file\n";
    try {
        mod = parseModule(content);
        const ast = getModuleAst(mod);
        for (const node of ast.body) {
            if (isExportNamedDeclaration(node)) {
                const sourceValue = getSourceValue(node);
                if (sourceValue) {
                    existingSources.add(sourceValue);
                }
            }
        }
        const expectedSources = new Set(expected.map((e) => e.file));
        ast.body = ast.body.filter((node) => {
            if (isExportNamedDeclaration(node)) {
                const sourceValue = getSourceValue(node);
                if (sourceValue) {
                    return expectedSources.has(sourceValue);
                }
            }
            // Remove existing interface and array declarations
            if (isExportNamedDeclaration(node) &&
                node.declaration?.type === "TSInterfaceDeclaration" &&
                node.declaration.id?.name === "Meta") {
                return false;
            }
            if (isExportNamedDeclaration(node) &&
                node.declaration?.type === "VariableDeclaration") {
                const declaration = node.declaration;
                const decl = declaration.declarations[0];
                if (decl?.id?.name === getArrayName(dir)) {
                    return false;
                }
            }
            return true;
        });
        existingSources = new Set();
        for (const node of ast.body) {
            if (isExportNamedDeclaration(node)) {
                const sourceValue = getSourceValue(node);
                if (sourceValue) {
                    existingSources.add(sourceValue);
                }
            }
        }
    }
    catch {
        mod = parseModule("// Auto-generated barrel file\n");
    }
    const ast = getModuleAst(mod);
    for (const exp of expected) {
        if (!existingSources.has(exp.file)) {
            const exportNode = {
                type: "ExportNamedDeclaration",
                specifiers: [
                    {
                        type: "ExportSpecifier",
                        local: { type: "Identifier", name: "meta" },
                        exported: { type: "Identifier", name: exp.metaAlias },
                    },
                    {
                        type: "ExportSpecifier",
                        local: { type: "Identifier", name: "default" },
                        exported: { type: "Identifier", name: exp.defaultAlias },
                    },
                ],
                source: { type: "Literal", value: exp.file },
            };
            ast.body.push(exportNode);
        }
    }
    const comments = [];
    const exports = [];
    for (const node of ast.body) {
        if (isExportNamedDeclaration(node)) {
            exports.push(node);
        }
        else {
            comments.push(node);
        }
    }
    exports.sort((a, b) => {
        const aSource = getSourceValue(a) || "";
        const bSource = getSourceValue(b) || "";
        return aSource.localeCompare(bSource);
    });
    ast.body = [...comments, ...exports];
    // Generate code from AST
    let { code } = generateCode(mod);
    // Generate and append Meta interface and array export
    if (expected.length > 0) {
        const { interfaceCode, arrayCode } = generateMetaAndArrayCode(dir, expected);
        code = code.trimEnd() + "\n\n" + interfaceCode + "\n\n" + arrayCode + "\n";
    }
    fs.writeFileSync(outputPath, code);
    return { path: outputPath, fileCount: expected.length };
}
/**
 * Check if a directory contains any files with meta exports
 */
function hasFilesWithMetaExport(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const sourceExts = [".ts", ".tsx", ".js", ".jsx"];
    for (const entry of entries) {
        if (!entry.isFile())
            continue;
        const ext = path.extname(entry.name);
        if (!sourceExts.includes(ext))
            continue;
        if (BARREL_FILES.includes(entry.name))
            continue;
        const filePath = path.join(dir, entry.name);
        if (hasMetaExport(filePath)) {
            return true;
        }
    }
    return false;
}
export function findBarrelDirs(baseDir) {
    const found = [];
    function scan(dir) {
        if (!fs.existsSync(dir))
            return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        // First check for explicit barrel file
        const barrelFile = findBarrelFile(dir);
        if (barrelFile) {
            found.push({ dir, barrelFile });
        }
        else if (hasFilesWithMetaExport(dir)) {
            // No barrel file, but has files with meta exports - treat as collection
            const detectedBarrelFile = detectBarrelType(dir);
            found.push({ dir, barrelFile: detectedBarrelFile });
        }
        for (const entry of entries) {
            if (entry.isDirectory() && entry.name !== "node_modules") {
                scan(path.join(dir, entry.name));
            }
        }
    }
    scan(baseDir);
    return found;
}
export function updateBarrels(baseDir) {
    const dirs = findBarrelDirs(baseDir);
    return dirs.map(({ dir, barrelFile }) => generateBarrel(dir, barrelFile));
}
export function watchBarrels(baseDir, options = {}) {
    const { onUpdate, debounceMs = 100 } = options;
    const barrelDirs = findBarrelDirs(baseDir);
    const watchers = [];
    const timeouts = new Map();
    // Initial update
    for (const { dir, barrelFile } of barrelDirs) {
        const result = generateBarrel(dir, barrelFile);
        onUpdate?.(result);
    }
    for (const { dir, barrelFile } of barrelDirs) {
        const sourceExts = getSourceExtensions(barrelFile);
        const watcher = fs.watch(dir, (eventType, filename) => {
            if (!filename)
                return;
            if (BARREL_FILES.includes(filename))
                return;
            const ext = path.extname(filename);
            if (!sourceExts.includes(ext))
                return;
            if (timeouts.has(dir)) {
                clearTimeout(timeouts.get(dir));
            }
            timeouts.set(dir, setTimeout(() => {
                const result = generateBarrel(dir, barrelFile);
                onUpdate?.(result);
                timeouts.delete(dir);
            }, debounceMs));
        });
        watchers.push(watcher);
    }
    return {
        close: () => {
            watchers.forEach((w) => w.close());
            timeouts.forEach((t) => clearTimeout(t));
            timeouts.clear();
        },
    };
}
// Re-export meta utilities for external use
export { extractMetaFromFile, hasMetaExport, mergeMetaProperties, generateMetaInterface, inferType, } from "./meta.js";
