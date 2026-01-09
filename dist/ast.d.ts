export type AstNode = {
    type: string;
    [key: string]: unknown;
};
export type ModuleAst = {
    body: AstNode[];
};
export type IdentifierNode = {
    type: "Identifier";
    name: string;
};
export type LiteralNode = {
    type: "Literal";
    value: unknown;
};
export type PropertyNode = {
    type: "Property" | "ObjectProperty";
    key?: AstNode;
    value?: AstNode;
};
export type ObjectExpressionNode = {
    type: "ObjectExpression";
    properties: AstNode[];
};
export type VariableDeclaratorNode = AstNode & {
    id?: IdentifierNode;
    init?: AstNode;
};
export type VariableDeclarationNode = AstNode & {
    declarations: VariableDeclaratorNode[];
};
export type ExportNamedDeclarationNode = AstNode & {
    type: "ExportNamedDeclaration";
    source?: LiteralNode | null;
    declaration?: AstNode | null;
    specifiers?: AstNode[];
};
export declare function isExportNamedDeclaration(node: AstNode): node is ExportNamedDeclarationNode;
export declare function isVariableDeclaration(node: AstNode): node is VariableDeclarationNode;
export declare function isObjectExpression(node: AstNode): node is ObjectExpressionNode;
export declare function isPropertyNode(node: AstNode): node is PropertyNode;
export declare function getPropertyKey(node: AstNode): string | null;
export declare function isArrayExpression(node: AstNode): node is {
    type: "ArrayExpression";
    elements: (AstNode | null)[];
};
export declare function isUnaryExpression(node: AstNode): node is {
    type: "UnaryExpression";
    operator: string;
    argument: AstNode;
};
export declare function getLiteralValue(node: AstNode): unknown;
export declare function getModuleAst(mod: {
    $ast: unknown;
}): ModuleAst;
