import * as fs from "fs";
import { parseModule } from "magicast";

export interface MetaProperty {
  name: string;
  type: string;
  required: boolean;
}

/**
 * Infer TypeScript type from a JavaScript value
 */
export function inferType(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value)) {
    if (value.length === 0) return "unknown[]";
    const itemTypes = [...new Set(value.map((v) => inferType(v)))];
    if (itemTypes.length === 1) {
      return `${itemTypes[0]}[]`;
    }
    return `(${itemTypes.join(" | ")})[]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "Record<string, unknown>";
    const props = entries.map(([k, v]) => `${k}: ${inferType(v)}`).join("; ");
    return `{ ${props} }`;
  }
  return "unknown";
}

/**
 * Extract meta object from a source file using magicast
 */
export function extractMetaFromFile(
  filePath: string,
): Record<string, unknown> | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const mod = parseModule(content, {
      sourceFileName: filePath,
    });

    // magicast returns a Proxy, we need to extract the actual value
    // by accessing $ast and evaluating the literal values
    const ast = (mod as any).$ast;
    for (const node of ast.body) {
      if (
        node.type === "ExportNamedDeclaration" &&
        node.declaration?.type === "VariableDeclaration"
      ) {
        for (const decl of node.declaration.declarations) {
          if (
            decl.id?.name === "meta" &&
            decl.init?.type === "ObjectExpression"
          ) {
            return extractObjectLiteral(decl.init);
          }
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract object literal from AST ObjectExpression node
 * Handles both Babel AST (ObjectProperty) and ESTree (Property) formats
 */
function extractObjectLiteral(node: any): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const prop of node.properties) {
    // Handle both ObjectProperty (Babel) and Property (ESTree)
    if (
      (prop.type === "Property" || prop.type === "ObjectProperty") &&
      prop.key
    ) {
      const key =
        prop.key.type === "Identifier" ? prop.key.name : prop.key.value;
      result[key] = extractValue(prop.value);
    }
  }
  return result;
}

/**
 * Extract value from AST node
 * Handles both Babel and ESTree AST formats
 */
function extractValue(node: any): unknown {
  switch (node.type) {
    case "Literal":
      return node.value;
    case "StringLiteral":
      return node.value;
    case "NumericLiteral":
      return node.value;
    case "BooleanLiteral":
      return node.value;
    case "NullLiteral":
      return null;
    case "ArrayExpression":
      return (node.elements || []).map((el: any) =>
        el ? extractValue(el) : null,
      );
    case "ObjectExpression":
      return extractObjectLiteral(node);
    case "UnaryExpression":
      if (node.operator === "-") {
        const arg = extractValue(node.argument);
        if (typeof arg === "number") return -arg;
      }
      return undefined;
    default:
      return undefined;
  }
}

/**
 * Merge multiple meta objects and determine property requirements
 */
export function mergeMetaProperties(
  metaList: Record<string, unknown>[],
): MetaProperty[] {
  if (metaList.length === 0) return [];

  // Collect all property names and their types across all files
  const propMap = new Map<string, { types: Set<string>; count: number }>();

  for (const meta of metaList) {
    for (const [key, value] of Object.entries(meta)) {
      const existing = propMap.get(key) || { types: new Set(), count: 0 };
      existing.types.add(inferType(value));
      existing.count++;
      propMap.set(key, existing);
    }
  }

  // Convert to MetaProperty array
  const properties: MetaProperty[] = [];
  for (const [name, { types, count }] of propMap) {
    const typeArray = [...types];
    const type = typeArray.length === 1 ? typeArray[0] : typeArray.join(" | ");
    properties.push({
      name,
      type,
      required: count === metaList.length,
    });
  }

  // Sort alphabetically
  properties.sort((a, b) => a.name.localeCompare(b.name));
  return properties;
}

/**
 * Generate TypeScript interface string from meta properties
 */
export function generateMetaInterface(properties: MetaProperty[]): string {
  if (properties.length === 0) {
    return "export interface Meta {}";
  }

  const lines = properties.map((p) => {
    const optional = p.required ? "" : "?";
    return `  ${p.name}${optional}: ${p.type};`;
  });

  return `export interface Meta {\n${lines.join("\n")}\n}`;
}
