# Barrels

Barrel file generator for SSG (Static Site Generator) projects.

Barrels automatically generates and maintains barrel files (`_barrel.ts` or `_barrel.js`) that re-export named exports from files in a directory, making it easier to manage collections of pages, posts, or components in static site generators.

## Features

- **Automatic barrel file generation** - Scans directories and generates exports for all TypeScript/JavaScript files
- **TypeScript and JavaScript support** - Works with both `.ts`/`.tsx` and `.js`/`.jsx` files
- **Watch mode** - Automatically updates barrel files when source files change
- **CLI and library** - Use as a command-line tool or import as a library
- **Smart exports** - Exports both `meta` and `default` exports with descriptive aliases

## Installation

```bash
npm install barrels
```

## CLI Usage

### Initialize barrel files

Create a `_barrel.ts` file in a directory:

```bash
barrels init ./example/posts
```

Create a `_barrel.js` file for JavaScript projects:

```bash
barrels init --js ./example/posts
```

Initialize multiple directories at once:

```bash
barrels init ./posts ./components ./pages
```

### Update barrel files

Update all barrel files in the current directory and subdirectories:

```bash
barrels update
```

Update barrel files in a specific directory:

```bash
barrels update ./src
```

Shorthand (same as `update`):

```bash
barrels
```

### Watch mode

Watch for file changes and automatically update barrel files:

```bash
barrels watch
```

Watch a specific directory:

```bash
barrels watch ./src
```

## Library Usage

```typescript
import {
  initBarrel,
  updateBarrels,
  watchBarrels,
  findBarrelDirs,
  generateBarrel,
} from "barrels";

// Initialize a barrel file
initBarrel("./posts", "ts"); // or "js"

// Update all barrel files in a directory tree
const results = updateBarrels("./src");
console.log(results); // [{ path: "...", fileCount: 3 }, ...]

// Watch for changes
const watcher = watchBarrels("./src", {
  onUpdate: (result) => {
    console.log(`Updated: ${result.path} (${result.fileCount} files)`);
  },
  debounceMs: 100,
});

// Stop watching
watcher.close();
```

## How It Works

Given a directory with files:

```
posts/
  _barrel.ts
  page1.tsx
  page2.tsx
```

Where each page exports `meta` and a default export:

```typescript
// page1.tsx
export const meta = {
  title: "First Post",
  createdAt: "2026-01-07",
  tags: ["typescript", "cli"],
};

export default function Page1() {
  return <article>...</article>;
}
```

Barrels generates a `_barrel.ts` file:

```typescript
// _barrel.ts (auto-generated)
export { meta as page1Meta, default as Page1 } from "./page1.tsx";
export { meta as page2Meta, default as Page2 } from "./page2.tsx";
```

Now you can import all pages from one place:

```typescript
import { page1Meta, Page1, page2Meta, Page2 } from "./posts/_barrel";
```

## Use Cases

- **SSG blog/documentation sites** - Manage collections of markdown/MDX pages
- **Component libraries** - Re-export components from a directory
- **Page routing** - Aggregate page metadata for routing
- **Content collections** - Organize posts, articles, or any content files

## License

ISC
