import * as fs from "fs";
import * as path from "path";
import { parseModule, generateCode } from "magicast";

export const BARREL_FILES = ["_barrel.ts", "_barrel.js"] as const;
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

function findBarrelFile(dir: string): string | null {
  for (const file of BARREL_FILES) {
    if (fs.existsSync(path.join(dir, file))) {
      return file;
    }
  }
  return null;
}

function getSourceExtensions(barrelFile: string): string[] {
  if (barrelFile === "_barrel.ts") {
    return [".ts", ".tsx"];
  }
  return [".js", ".jsx"];
}

export function getExpectedExports(dir: string, barrelFile: string): ExportInfo[] {
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

export function generateBarrel(dir: string): BarrelResult {
  const barrelFile = findBarrelFile(dir);
  if (!barrelFile) {
    throw new Error(`No barrel file found in ${dir}`);
  }

  const expected = getExpectedExports(dir, barrelFile);
  const outputPath = path.join(dir, barrelFile);

  let mod;
  let existingSources = new Set<string>();

  const content = fs.readFileSync(outputPath, "utf-8");
  try {
    mod = parseModule(content);

    for (const node of mod.$ast.body) {
      if (node.type === "ExportNamedDeclaration" && node.source) {
        existingSources.add(node.source.value);
      }
    }

    const expectedSources = new Set(expected.map((e) => e.file));
    mod.$ast.body = mod.$ast.body.filter((node: any) => {
      if (node.type === "ExportNamedDeclaration" && node.source) {
        return expectedSources.has(node.source.value);
      }
      return true;
    });

    existingSources = new Set<string>();
    for (const node of mod.$ast.body) {
      if (node.type === "ExportNamedDeclaration" && node.source) {
        existingSources.add(node.source.value);
      }
    }
  } catch {
    mod = parseModule("// Auto-generated barrel file\n");
  }

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
      mod.$ast.body.push(exportNode);
    }
  }

  const comments: any[] = [];
  const exports: any[] = [];

  for (const node of mod.$ast.body) {
    if (node.type === "ExportNamedDeclaration") {
      exports.push(node);
    } else {
      comments.push(node);
    }
  }

  exports.sort((a, b) => {
    const aSource = a.source?.value || "";
    const bSource = b.source?.value || "";
    return aSource.localeCompare(bSource);
  });

  mod.$ast.body = [...comments, ...exports];

  const { code } = generateCode(mod);
  fs.writeFileSync(outputPath, code);

  return { path: outputPath, fileCount: expected.length };
}

export interface BarrelDir {
  dir: string;
  barrelFile: string;
}

export function findBarrelDirs(baseDir: string): BarrelDir[] {
  const found: BarrelDir[] = [];

  function scan(dir: string) {
    if (!fs.existsSync(dir)) return;

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

export function initBarrel(
  dir: string,
  type: "ts" | "js" = "ts"
): { created: boolean; path: string } {
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

export function updateBarrels(baseDir: string): BarrelResult[] {
  const dirs = findBarrelDirs(baseDir);
  return dirs.map(({ dir }) => generateBarrel(dir));
}

export interface WatchOptions {
  onUpdate?: (result: BarrelResult) => void;
  debounceMs?: number;
}

export function watchBarrels(
  baseDir: string,
  options: WatchOptions = {}
): { close: () => void } {
  const { onUpdate, debounceMs = 100 } = options;
  const barrelDirs = findBarrelDirs(baseDir);
  const watchers: fs.FSWatcher[] = [];
  const timeouts = new Map<string, NodeJS.Timeout>();

  // Initial update
  for (const { dir } of barrelDirs) {
    const result = generateBarrel(dir);
    onUpdate?.(result);
  }

  for (const { dir, barrelFile } of barrelDirs) {
    const sourceExts = getSourceExtensions(barrelFile);

    const watcher = fs.watch(dir, (eventType, filename) => {
      if (!filename) return;
      if (BARREL_FILES.includes(filename as BarrelFileName)) return;

      const ext = path.extname(filename);
      if (!sourceExts.includes(ext)) return;

      if (timeouts.has(dir)) {
        clearTimeout(timeouts.get(dir)!);
      }

      timeouts.set(
        dir,
        setTimeout(() => {
          const result = generateBarrel(dir);
          onUpdate?.(result);
          timeouts.delete(dir);
        }, debounceMs)
      );
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
