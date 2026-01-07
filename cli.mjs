#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";

const args = process.argv.slice(2);
const dir = args[0] || ".";
const output = args[1] || "index.ts";

function generateBarrel(dir, output) {
  const files = fs
    .readdirSync(dir)
    .filter((file) => {
      const ext = path.extname(file);
      return (ext === ".ts" || ext === ".tsx") && file !== output;
    })
    .sort();

  const exports = files.map((file) => {
    const ext = path.extname(file);
    const name = path.basename(file, ext);
    const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
    return `export { meta as ${name}Meta, default as ${pascalName} } from "./${file}";`;
  });

  const content = `// Auto-generated barrel file\n${exports.join("\n")}\n`;
  const outputPath = path.join(dir, output);

  fs.writeFileSync(outputPath, content);
  console.log(`Generated: ${outputPath}`);
  console.log(`Exported ${files.length} files`);
}

generateBarrel(dir, output);
