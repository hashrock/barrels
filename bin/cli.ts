#!/usr/bin/env -S node --import tsx

import * as fs from "fs";
import {
  BARREL_FILES,
  initBarrel,
  updateBarrels,
  watchBarrels,
  findBarrelDirs,
} from "../src/index.js";

function printUsage(): void {
  console.log(`Usage:
  barrels [basedir]              Update all barrel files (shorthand)
  barrels update [basedir]       Update all barrel files
  barrels watch [basedir]        Watch and auto-update on changes
  barrels init <dir> ...         Create _barrel.ts in specified directories
  barrels init --js <dir> ...    Create _barrel.js in specified directories
`);
}

function cmdInit(dirs: string[], type: "ts" | "js"): void {
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      console.error(`Directory not found: ${dir}`);
      continue;
    }

    const result = initBarrel(dir, type);
    if (result.created) {
      console.log(`Created: ${result.path}`);
    } else {
      console.log(`Already exists: ${result.path}`);
    }
  }
}

function cmdUpdate(baseDir: string): void {
  if (!fs.existsSync(baseDir)) {
    console.error(`Directory not found: ${baseDir}`);
    process.exit(1);
  }

  const results = updateBarrels(baseDir);
  if (results.length === 0) {
    console.log(`No barrel files found in ${baseDir}`);
  } else {
    for (const result of results) {
      console.log(`Updated: ${result.path} (${result.fileCount} files)`);
    }
  }
}

function cmdWatch(baseDir: string): void {
  if (!fs.existsSync(baseDir)) {
    console.error(`Directory not found: ${baseDir}`);
    process.exit(1);
  }

  const dirs = findBarrelDirs(baseDir);
  if (dirs.length === 0) {
    console.log(`No barrel files found in ${baseDir}`);
    process.exit(1);
  }

  const watcher = watchBarrels(baseDir, {
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

// Main
const args = process.argv.slice(2);
const command = args[0];

if (command === "init") {
  let type: "ts" | "js" = "ts";
  let dirs = args.slice(1);

  if (dirs[0] === "--js") {
    type = "js";
    dirs = dirs.slice(1);
  } else if (dirs[0] === "--ts") {
    type = "ts";
    dirs = dirs.slice(1);
  }

  if (dirs.length === 0) {
    console.error("Error: specify directories to initialize");
    printUsage();
    process.exit(1);
  }
  cmdInit(dirs, type);
} else if (command === "update") {
  const baseDir = args[1] || ".";
  cmdUpdate(baseDir);
} else if (command === "watch") {
  const baseDir = args[1] || ".";
  cmdWatch(baseDir);
} else if (command === "--help" || command === "-h") {
  printUsage();
} else {
  const baseDir = command || ".";
  cmdUpdate(baseDir);
}
