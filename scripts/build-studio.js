import * as esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

const srcDir = path.join(rootDir, "src", "studio", "ui");
const outDir = path.join(rootDir, "dist", "studio");

// Ensure output directory exists
fs.mkdirSync(outDir, { recursive: true });

// Build React app
await esbuild.build({
  entryPoints: [path.join(srcDir, "main.tsx")],
  bundle: true,
  outfile: path.join(outDir, "bundle.js"),
  format: "esm",
  platform: "browser",
  target: "es2020",
  jsx: "automatic",
  minify: true,
  sourcemap: false,
});

// Copy index.html
fs.copyFileSync(
  path.join(srcDir, "index.html"),
  path.join(outDir, "index.html")
);

console.log("Studio build complete: dist/studio/");
