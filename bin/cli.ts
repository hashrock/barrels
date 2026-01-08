#!/usr/bin/env -S node --import tsx

import * as fs from "fs";
import * as path from "path";
import { parseModule, generateCode } from "magicast";

const BARREL_FILE = "_barrel.ts";

interface ExportInfo {
  file: string;
  metaAlias: string;
  defaultAlias: string;
}

function getExpectedExports(dir: string): ExportInfo[] {
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

function generateBarrel(dir: string): void {
  const expected = getExpectedExports(dir);
  const outputPath = path.join(dir, BARREL_FILE);

  let mod;
  let existingSources = new Set<string>();

  // Parse existing barrel file
  const content = fs.readFileSync(outputPath, "utf-8");
  try {
    mod = parseModule(content);

    // Collect existing export sources
    for (const node of mod.$ast.body) {
      if (node.type === "ExportNamedDeclaration" && node.source) {
        existingSources.add(node.source.value);
      }
    }

    // Remove exports for files that no longer exist
    const expectedSources = new Set(expected.map((e) => e.file));
    mod.$ast.body = mod.$ast.body.filter((node: any) => {
      if (node.type === "ExportNamedDeclaration" && node.source) {
        return expectedSources.has(node.source.value);
      }
      return true; // Keep comments and other nodes
    });

    // Update existingSources after removal
    existingSources = new Set<string>();
    for (const node of mod.$ast.body) {
      if (node.type === "ExportNamedDeclaration" && node.source) {
        existingSources.add(node.source.value);
      }
    }
  } catch {
    mod = parseModule("// Auto-generated barrel file\n");
  }

  // Add missing exports
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

  // Sort exports by source
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
  console.log(`Updated: ${outputPath} (${expected.length} files)`);
}

function findBarrelDirs(baseDir: string): string[] {
  const found: string[] = [];

  function scan(dir: string) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    // Check if this directory has a _barrel.ts
    if (entries.some((e) => e.isFile() && e.name === BARREL_FILE)) {
      found.push(dir);
    }

    // Recursively scan subdirectories
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== "node_modules") {
        scan(path.join(dir, entry.name));
      }
    }
  }

  scan(baseDir);
  return found;
}

function initBarrel(dirs: string[]): void {
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      console.error(`Directory not found: ${dir}`);
      continue;
    }

    const outputPath = path.join(dir, BARREL_FILE);
    if (fs.existsSync(outputPath)) {
      console.log(`Already exists: ${outputPath}`);
      continue;
    }

    fs.writeFileSync(outputPath, "// Auto-generated barrel file\n");
    console.log(`Created: ${outputPath}`);
  }
}

function updateBarrels(baseDir: string): void {
  if (!fs.existsSync(baseDir)) {
    console.error(`Directory not found: ${baseDir}`);
    process.exit(1);
  }

  const dirs = findBarrelDirs(baseDir);
  if (dirs.length === 0) {
    console.log(`No ${BARREL_FILE} found in ${baseDir}`);
  } else {
    dirs.forEach(generateBarrel);
  }
}

function printUsage(): void {
  console.log(`Usage:
  barrels [basedir]              Update all _barrel.ts files (shorthand)
  barrels update [basedir]       Update all _barrel.ts files
  barrels init <dir> ...         Create _barrel.ts in specified directories
`);
}

// Main
const args = process.argv.slice(2);
const command = args[0];

if (command === "init") {
  const dirs = args.slice(1);
  if (dirs.length === 0) {
    console.error("Error: specify directories to initialize");
    printUsage();
    process.exit(1);
  }
  initBarrel(dirs);
} else if (command === "update") {
  const baseDir = args[1] || ".";
  updateBarrels(baseDir);
} else if (command === "--help" || command === "-h") {
  printUsage();
} else {
  // Shorthand: barrels [basedir] = barrels update [basedir]
  const baseDir = command || ".";
  updateBarrels(baseDir);
}
