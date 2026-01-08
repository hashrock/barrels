#!/usr/bin/env npx tsx

import * as fs from "fs";
import * as path from "path";

const BARREL_FILE = "_barrel.ts";
const TARGET_DIRS = ["pages", "posts", "components"];

function generateBarrel(dir: string): void {
  const files = fs
    .readdirSync(dir)
    .filter((file) => {
      const ext = path.extname(file);
      return (ext === ".ts" || ext === ".tsx") && file !== BARREL_FILE;
    })
    .sort();

  if (files.length === 0) {
    return;
  }

  const exports = files.map((file) => {
    const ext = path.extname(file);
    const name = path.basename(file, ext);
    const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
    return `export { meta as ${name}Meta, default as ${pascalName} } from "./${file}";`;
  });

  const content = `// Auto-generated barrel file\n${exports.join("\n")}\n`;
  const outputPath = path.join(dir, BARREL_FILE);

  fs.writeFileSync(outputPath, content);
  console.log(`Generated: ${outputPath} (${files.length} files)`);
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
