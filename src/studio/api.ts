import * as fs from "fs";
import * as path from "path";
import { parseModule, generateCode } from "magicast";
import {
  findBarrelDirs,
  getExpectedExports,
  getSourceExtensions,
  generateBarrel,
} from "../index.js";
import { extractMetaFromFile } from "../meta.js";

export interface BarrelInfo {
  dir: string;
  relativePath: string;
  barrelFile: string;
  files: FileInfo[];
}

export interface FileInfo {
  name: string;
  path: string;
  meta: Record<string, unknown>;
}

/**
 * Get all barrels with their files and meta
 */
export function getBarrels(baseDir: string): BarrelInfo[] {
  const barrelDirs = findBarrelDirs(baseDir);

  return barrelDirs.map(({ dir, barrelFile }) => {
    const expected = getExpectedExports(dir, barrelFile);
    const files: FileInfo[] = expected.map((exp) => {
      const filePath = path.join(dir, exp.file.replace("./", ""));
      const meta = extractMetaFromFile(filePath) || {};
      return {
        name: exp.file.replace("./", ""),
        path: filePath,
        meta,
      };
    });

    return {
      dir,
      relativePath: path.relative(baseDir, dir),
      barrelFile,
      files,
    };
  });
}

/**
 * Get a single barrel's info
 */
export function getBarrel(baseDir: string, barrelPath: string): BarrelInfo | null {
  const barrels = getBarrels(baseDir);
  return barrels.find((b) => b.relativePath === barrelPath) || null;
}

/**
 * Update meta in a source file
 */
export function updateFileMeta(
  filePath: string,
  meta: Record<string, unknown>
): void {
  const content = fs.readFileSync(filePath, "utf-8");
  const mod = parseModule(content, { sourceFileName: filePath });
  const ast = mod.$ast as any;

  // Find and update the meta export
  for (const node of ast.body) {
    if (
      node.type === "ExportNamedDeclaration" &&
      node.declaration?.type === "VariableDeclaration"
    ) {
      for (const decl of node.declaration.declarations) {
        if (decl.id?.name === "meta") {
          // Rebuild the object expression with new values
          decl.init = buildObjectExpression(meta);
          break;
        }
      }
    }
  }

  const { code } = generateCode(mod);
  fs.writeFileSync(filePath, code);
}

/**
 * Build AST ObjectExpression from a plain object
 */
function buildObjectExpression(obj: Record<string, unknown>): any {
  return {
    type: "ObjectExpression",
    properties: Object.entries(obj).map(([key, value]) => ({
      type: "Property",
      key: { type: "Identifier", name: key },
      value: buildValueNode(value),
      kind: "init",
      method: false,
      shorthand: false,
      computed: false,
    })),
  };
}

/**
 * Build AST node for a value
 */
function buildValueNode(value: unknown): any {
  if (value === null) {
    return { type: "Literal", value: null };
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return { type: "Literal", value };
  }
  if (Array.isArray(value)) {
    return {
      type: "ArrayExpression",
      elements: value.map((v) => buildValueNode(v)),
    };
  }
  if (typeof value === "object") {
    return buildObjectExpression(value as Record<string, unknown>);
  }
  return { type: "Literal", value: null };
}

/**
 * Create a new file with template
 */
export function createFile(
  barrelDir: string,
  fileName: string,
  meta: Record<string, unknown>
): string {
  // Determine file extension based on barrel type
  const barrelFile = fs.readdirSync(barrelDir).find((f) => f.startsWith("_barrel."));
  const isTs = barrelFile === "_barrel.ts";
  const ext = isTs ? ".tsx" : ".jsx";

  // Ensure fileName has correct extension
  let finalName = fileName;
  if (!finalName.endsWith(ext) && !finalName.endsWith(".ts") && !finalName.endsWith(".tsx") && !finalName.endsWith(".js") && !finalName.endsWith(".jsx")) {
    finalName = fileName + ext;
  }

  const filePath = path.join(barrelDir, finalName);

  // Generate component name from file name
  const baseName = path.basename(finalName, path.extname(finalName));
  const componentName = baseName.charAt(0).toUpperCase() + baseName.slice(1);

  // Build meta object string
  const metaEntries = Object.entries(meta)
    .map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`)
    .join("\n");

  const template = `export const meta = {
${metaEntries}
};

export default function ${componentName}() {
  return (
    <article>
      <h1>{meta.title}</h1>
    </article>
  );
}
`;

  fs.writeFileSync(filePath, template);
  return filePath;
}

/**
 * Delete a file and regenerate barrel
 */
export function deleteFile(barrelDir: string, fileName: string): void {
  const filePath = path.join(barrelDir, fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * Regenerate barrel file for a directory
 */
export function regenerateBarrel(dir: string): void {
  generateBarrel(dir);
}
