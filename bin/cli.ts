#!/usr/bin/env -S node --import tsx

import * as fs from "fs";
import * as path from "path";
import { parseModule, generateCode, builders } from "magicast";

const BARREL_FILE = "_barrel.ts";
const TARGET_DIRS = ["pages", "posts", "components"];

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
  if (expected.length === 0) {
    return;
  }

  const outputPath = path.join(dir, BARREL_FILE);
  let mod;
  let existingSources = new Set<string>();

  // Try to parse existing barrel file
  if (fs.existsSync(outputPath)) {
    try {
      const content = fs.readFileSync(outputPath, "utf-8");
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
  } else {
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
  console.log(`Generated: ${outputPath} (${expected.length} files)`);
}

function findTargetDirs(baseDir: string): string[] {
  const found: string[] = [];

  function scan(dir: string) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = path.join(dir, entry.name);
        if (TARGET_DIRS.includes(entry.name)) {
          found.push(fullPath);
        }
        scan(fullPath);
      }
    }
  }

  scan(baseDir);
  return found;
}

// Main
const baseDir = process.argv[2] || ".";

if (!fs.existsSync(baseDir)) {
  console.error(`Directory not found: ${baseDir}`);
  process.exit(1);
}

const dirs = findTargetDirs(baseDir);
if (dirs.length === 0) {
  console.log(`No target directories found in ${baseDir} (pages, posts, components)`);
} else {
  dirs.forEach(generateBarrel);
}
