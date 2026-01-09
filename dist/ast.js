export function isExportNamedDeclaration(node) {
    return node.type === "ExportNamedDeclaration";
}
export function isVariableDeclaration(node) {
    return node.type === "VariableDeclaration";
}
export function isObjectExpression(node) {
    return node.type === "ObjectExpression";
}
export function isPropertyNode(node) {
    return node.type === "Property" || node.type === "ObjectProperty";
}
export function getPropertyKey(node) {
    if (node.type === "Identifier" && typeof node.name === "string") {
        return node.name;
    }
    if (node.type === "Literal") {
        const value = node.value;
        if (typeof value === "string" || typeof value === "number") {
            return String(value);
        }
    }
    return null;
}
export function isArrayExpression(node) {
    return node.type === "ArrayExpression" &&
        Array.isArray(node.elements);
}
export function isUnaryExpression(node) {
    return node.type === "UnaryExpression";
}
export function getLiteralValue(node) {
    return node.value;
}
export function getModuleAst(mod) {
    return mod.$ast;
}
