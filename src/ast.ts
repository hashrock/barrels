export type AstNode = { type: string; [key: string]: unknown };
export type ModuleAst = { body: AstNode[] };
export type IdentifierNode = { type: "Identifier"; name: string };
export type LiteralNode = { type: "Literal"; value: unknown };
export type PropertyNode = {
  type: "Property" | "ObjectProperty";
  key?: AstNode;
  value?: AstNode;
};
export type ObjectExpressionNode = { type: "ObjectExpression"; properties: AstNode[] };
export type VariableDeclaratorNode = AstNode & { id?: IdentifierNode; init?: AstNode };
export type VariableDeclarationNode = AstNode & {
  declarations: VariableDeclaratorNode[];
};
export type ExportNamedDeclarationNode = AstNode & {
  type: "ExportNamedDeclaration";
  source?: LiteralNode | null;
  declaration?: AstNode | null;
  specifiers?: AstNode[];
};

export function isExportNamedDeclaration(
  node: AstNode,
): node is ExportNamedDeclarationNode {
  return node.type === "ExportNamedDeclaration";
}

export function isVariableDeclaration(
  node: AstNode,
): node is VariableDeclarationNode {
  return node.type === "VariableDeclaration";
}

export function isObjectExpression(node: AstNode): node is ObjectExpressionNode {
  return node.type === "ObjectExpression";
}

export function isPropertyNode(node: AstNode): node is PropertyNode {
  return node.type === "Property" || node.type === "ObjectProperty";
}

export function getPropertyKey(node: AstNode): string | null {
  if (node.type === "Identifier" && typeof node.name === "string") {
    return node.name;
  }
  if (node.type === "Literal") {
    const value = (node as LiteralNode).value;
    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }
  }
  return null;
}

export function isArrayExpression(
  node: AstNode,
): node is { type: "ArrayExpression"; elements: (AstNode | null)[] } {
  return node.type === "ArrayExpression" &&
    Array.isArray((node as { elements?: unknown }).elements);
}

export function isUnaryExpression(
  node: AstNode,
): node is { type: "UnaryExpression"; operator: string; argument: AstNode } {
  return node.type === "UnaryExpression";
}

export function getLiteralValue(node: AstNode): unknown {
  return (node as { value?: unknown }).value;
}

export function getModuleAst(mod: { $ast: unknown }): ModuleAst {
  return mod.$ast as unknown as ModuleAst;
}
