import * as fs from "fs";
import * as path from "path";
import { parseModule, generateCode } from "magicast";

export const BARREL_FILE = "_barrel.ts";

export interface ExportInfo {
  file: string;
  metaAlias: string;
  defaultAlias: string;
}

export interface BarrelResult {
  path: string;
  fileCount: number;
}

export function getExpectedExports(dir: string): ExportInfo[] {
  const files = fs
    .readdirSync(dir)
    .filter((file) => {
      const ext = path.extname(file);
      return (ext === ".ts" || ext === ".tsx") && file !== BARREL_FILE;
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
  const expected = getExpectedExports(dir);
  const outputPath = path.join(dir, BARREL_FILE);

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

export function findBarrelDirs(baseDir: string): string[] {
  const found: string[] = [];

  function scan(dir: string) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    if (entries.some((e) => e.isFile() && e.name === BARREL_FILE)) {
      found.push(dir);
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

export function initBarrel(dir: string): { created: boolean; path: string } {
  const outputPath = path.join(dir, BARREL_FILE);

  if (fs.existsSync(outputPath)) {
    return { created: false, path: outputPath };
  }

  fs.writeFileSync(outputPath, "// Auto-generated barrel file\n");
  return { created: true, path: outputPath };
}

export function updateBarrels(baseDir: string): BarrelResult[] {
  const dirs = findBarrelDirs(baseDir);
  return dirs.map(generateBarrel);
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
  const dirs = findBarrelDirs(baseDir);
  const watchers: fs.FSWatcher[] = [];
  const timeouts = new Map<string, NodeJS.Timeout>();

  // Initial update
  for (const dir of dirs) {
    const result = generateBarrel(dir);
    onUpdate?.(result);
  }

  for (const dir of dirs) {
    const watcher = fs.watch(dir, (eventType, filename) => {
      if (!filename) return;
      if (filename === BARREL_FILE) return;

      const ext = path.extname(filename);
      if (ext !== ".ts" && ext !== ".tsx") return;

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
