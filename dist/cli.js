import * as fs from "fs";
import * as path from "path";
import { initBarrel, updateBarrels, watchBarrels, findBarrelDirs, } from "./index.js";
function resolveDir(dir) {
    return path.resolve(process.cwd(), dir);
}
function printUsage() {
    console.log(`Usage:
  barrels [basedir]              Update all barrel files (shorthand)
  barrels update [basedir]       Update all barrel files
  barrels watch [basedir]        Watch and auto-update on changes
  barrels init <dir> ...         Create _barrel.ts in specified directories
  barrels init --js <dir> ...    Create _barrel.js in specified directories
`);
}
function cmdInit(dirs, type) {
    for (const dir of dirs) {
        const resolved = resolveDir(dir);
        if (!fs.existsSync(resolved)) {
            console.error(`Directory not found: ${resolved}`);
            continue;
        }
        const result = initBarrel(resolved, type);
        if (result.created) {
            console.log(`Created: ${result.path}`);
        }
        else {
            console.log(`Already exists: ${result.path}`);
        }
    }
}
function cmdUpdate(baseDir) {
    const resolved = resolveDir(baseDir);
    if (!fs.existsSync(resolved)) {
        console.error(`Directory not found: ${resolved}`);
        process.exit(1);
    }
    const results = updateBarrels(resolved);
    if (results.length === 0) {
        console.log(`No barrel files found in ${resolved}`);
    }
    else {
        for (const result of results) {
            console.log(`Updated: ${result.path} (${result.fileCount} files)`);
        }
    }
}
function cmdWatch(baseDir) {
    const resolved = resolveDir(baseDir);
    if (!fs.existsSync(resolved)) {
        console.error(`Directory not found: ${resolved}`);
        process.exit(1);
    }
    const dirs = findBarrelDirs(resolved);
    if (dirs.length === 0) {
        console.log(`No barrel files found in ${resolved}`);
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
// Main
const args = process.argv.slice(2);
const command = args[0];
if (command === "init") {
    let type = "ts";
    let dirs = args.slice(1);
    if (dirs[0] === "--js") {
        type = "js";
        dirs = dirs.slice(1);
    }
    else if (dirs[0] === "--ts") {
        type = "ts";
        dirs = dirs.slice(1);
    }
    if (dirs.length === 0) {
        console.error("Error: specify directories to initialize");
        printUsage();
        process.exit(1);
    }
    cmdInit(dirs, type);
}
else if (command === "update") {
    const baseDir = args[1] || ".";
    cmdUpdate(baseDir);
}
else if (command === "watch") {
    const baseDir = args[1] || ".";
    cmdWatch(baseDir);
}
else if (command === "--help" || command === "-h") {
    printUsage();
}
else {
    const baseDir = command || ".";
    cmdUpdate(baseDir);
}
