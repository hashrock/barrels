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
const args = process.argv.slice(2);

if (args.length > 0) {
  // 引数があれば指定ディレクトリのみ
  generateBarrel(args[0]);
} else {
  // 引数なしなら規約ベースで自動検出
  const dirs = findTargetDirs(".");
  if (dirs.length === 0) {
    console.log("No target directories found (pages, posts, components)");
  } else {
    dirs.forEach(generateBarrel);
  }
}
