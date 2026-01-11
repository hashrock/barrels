import * as fs from "fs";
import * as path from "path";
import { render } from "ink";
import React from "react";
import {
  updateBarrels,
  watchBarrels,
  findBarrelDirs,
} from "./index.js";
import { getBarrels, initMeta, regenerateBarrel } from "./api.js";

function resolveDir(dir: string): string {
  return path.resolve(process.cwd(), dir);
}

function printUsage(): void {
  console.log(`Usage:
  metacolle [basedir]              Interactive TUI mode
  metacolle update [basedir]       Update all index files
  metacolle watch [basedir]        Watch and auto-update on changes
  metacolle list [basedir]         List all collections (non-interactive)
  metacolle init <dir>             Add meta template to files in directory
  metacolle --help                 Show this help message

Interactive mode commands:
  j/k or arrows    Navigate
  Enter            Select/Edit
  Esc              Go back
  q                Quit
`);
}

function cmdUpdate(baseDir: string): void {
  const resolved = resolveDir(baseDir);
  if (!fs.existsSync(resolved)) {
    console.error(`Directory not found: ${resolved}`);
    process.exit(1);
  }

  const results = updateBarrels(resolved);
  if (results.length === 0) {
    console.log(`No index files found in ${resolved}`);
  } else {
    for (const result of results) {
      console.log(`Updated: ${result.path} (${result.fileCount} files)`);
    }
  }
}

function cmdWatch(baseDir: string): void {
  const resolved = resolveDir(baseDir);
  if (!fs.existsSync(resolved)) {
    console.error(`Directory not found: ${resolved}`);
    process.exit(1);
  }

  const dirs = findBarrelDirs(resolved);
  if (dirs.length === 0) {
    console.log(`No index files found in ${resolved}`);
    process.exit(1);
  }

  const watcher = watchBarrels(resolved, {
    onUpdate: (result) => {
      console.log(`Updated: ${result.path} (${result.fileCount} files)`);
    },
  });

  console.log(`\nWatching ${dirs.length} directories for changes...`);
  console.log("Press Ctrl+C to stop\n");

  process.on("SIGINT", () => {
    watcher.close();
    process.exit(0);
  });
}

function cmdList(baseDir: string): void {
  const resolved = resolveDir(baseDir);
  if (!fs.existsSync(resolved)) {
    console.error(`Directory not found: ${resolved}`);
    process.exit(1);
  }

  const barrels = getBarrels(resolved);
  if (barrels.length === 0) {
    console.log(`No collections found in ${resolved}`);
    return;
  }

  for (const barrel of barrels) {
    console.log(`\n${barrel.relativePath || "."} (${barrel.files.length} files)`);
    console.log("─".repeat(40));

    // Collect all keys
    const allKeys = new Set<string>();
    for (const file of barrel.files) {
      for (const key of Object.keys(file.meta)) {
        allKeys.add(key);
      }
    }

    for (const file of barrel.files) {
      console.log(`  ${file.name}`);
      for (const key of allKeys) {
        const value = file.meta[key];
        if (value !== undefined) {
          const formatted = typeof value === "string" ? value : JSON.stringify(value);
          console.log(`    ${key}: ${formatted}`);
        }
      }
    }
  }
}

function cmdInitNonInteractive(dir: string): void {
  const resolved = resolveDir(dir);
  if (!fs.existsSync(resolved)) {
    console.error(`Directory not found: ${resolved}`);
    process.exit(1);
  }

  // Default template
  const template = {
    title: "",
    createdAt: new Date().toISOString().split("T")[0],
  };

  const result = initMeta(resolved, template);

  if (result.added.length > 0) {
    regenerateBarrel(resolved);
    console.log(`Added meta to ${result.added.length} files:`);
    for (const f of result.added) {
      console.log(`  + ${f}`);
    }
  }

  if (result.skipped.length > 0) {
    console.log(`Skipped ${result.skipped.length} files (already have meta):`);
    for (const f of result.skipped) {
      console.log(`  - ${f}`);
    }
  }

  if (result.added.length === 0 && result.skipped.length === 0) {
    console.log("No files found to process");
  }
}

async function cmdInteractive(baseDir: string): Promise<void> {
  const resolved = resolveDir(baseDir);
  if (!fs.existsSync(resolved)) {
    console.error(`Directory not found: ${resolved}`);
    process.exit(1);
  }

  const { App } = await import("./ui/App.js");
  const { waitUntilExit } = render(React.createElement(App, { baseDir: resolved }));
  await waitUntilExit();
}

async function cmdInitInteractive(dir: string): Promise<void> {
  const resolved = resolveDir(dir);
  if (!fs.existsSync(resolved)) {
    console.error(`Directory not found: ${resolved}`);
    process.exit(1);
  }

  const { Init } = await import("./ui/components/Init.js");
  const { waitUntilExit } = render(React.createElement(Init, { dir: resolved }));
  await waitUntilExit();
}

// Main
const args = process.argv.slice(2);
const command = args[0];

if (command === "update") {
  const baseDir = args[1] || ".";
  cmdUpdate(baseDir);
} else if (command === "watch") {
  const baseDir = args[1] || ".";
  cmdWatch(baseDir);
} else if (command === "list") {
  const baseDir = args[1] || ".";
  cmdList(baseDir);
} else if (command === "init") {
  const dir = args[1];
  if (!dir) {
    console.error("Error: init command requires a directory argument");
    console.error("Usage: metacolle init <dir>");
    process.exit(1);
  }
  // Check if --no-interactive flag is set
  if (args.includes("--no-interactive") || args.includes("-n")) {
    cmdInitNonInteractive(dir);
  } else {
    cmdInitInteractive(dir);
  }
} else if (command === "--help" || command === "-h") {
  printUsage();
} else {
  // Default to interactive mode
  const baseDir = command || ".";
  cmdInteractive(baseDir);
}
