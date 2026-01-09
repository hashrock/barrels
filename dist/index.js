import * as fs from "fs";
import * as path from "path";
import { parseModule, generateCode } from "magicast";
import { extractMetaFromFile, mergeMetaProperties, generateMetaInterface, } from "./meta.js";
import { isExportNamedDeclaration, getModuleAst, } from "./ast.js";
function getSourceValue(node) {
    if (node.source?.type === "Literal" && typeof node.source.value === "string") {
        return node.source.value;
    }
    return undefined;
}
export const BARREL_FILES = ["_barrel.ts", "_barrel.js"];
function findBarrelFile(dir) {
    for (const file of BARREL_FILES) {
        if (fs.existsSync(path.join(dir, file))) {
            return file;
        }
    }
    return null;
}
export function getSourceExtensions(barrelFile) {
    if (barrelFile === "_barrel.ts") {
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
export function generateBarrel(dir) {
    const barrelFile = findBarrelFile(dir);
    if (!barrelFile) {
        throw new Error(`No barrel file found in ${dir}`);
    }
    const expected = getExpectedExports(dir, barrelFile);
    const outputPath = path.join(dir, barrelFile);
    let mod;
    let existingSources = new Set();
    const content = fs.readFileSync(outputPath, "utf-8");
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
export function findBarrelDirs(baseDir) {
    const found = [];
    function scan(dir) {
        if (!fs.existsSync(dir))
            return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const barrelFile = findBarrelFile(dir);
        if (barrelFile) {
            found.push({ dir, barrelFile });
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
export function initBarrel(dir, type = "ts") {
    const barrelFile = type === "ts" ? "_barrel.ts" : "_barrel.js";
    const outputPath = path.join(dir, barrelFile);
    // Check if any barrel file already exists
    const existing = findBarrelFile(dir);
    if (existing) {
        return { created: false, path: path.join(dir, existing) };
    }
    fs.writeFileSync(outputPath, "// Auto-generated barrel file\n");
    return { created: true, path: outputPath };
}
export function updateBarrels(baseDir) {
    const dirs = findBarrelDirs(baseDir);
    return dirs.map(({ dir }) => generateBarrel(dir));
}
export function watchBarrels(baseDir, options = {}) {
    const { onUpdate, debounceMs = 100 } = options;
    const barrelDirs = findBarrelDirs(baseDir);
    const watchers = [];
    const timeouts = new Map();
    // Initial update
    for (const { dir } of barrelDirs) {
        const result = generateBarrel(dir);
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
                const result = generateBarrel(dir);
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
export { extractMetaFromFile, mergeMetaProperties, generateMetaInterface, inferType, } from "./meta.js";
