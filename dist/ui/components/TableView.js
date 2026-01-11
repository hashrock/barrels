import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Text, useInput } from "ink";
import { generateBarrel } from "../../index.js";
export function TableView({ barrel, selectedIndex, onNavigate, onEdit, onBack, onRefresh, message, setMessage, }) {
    // Collect all unique meta keys
    const allKeys = new Set();
    for (const file of barrel.files) {
        for (const key of Object.keys(file.meta)) {
            allKeys.add(key);
        }
    }
    const columns = ["name", ...Array.from(allKeys).sort()];
    // Calculate column widths
    const columnWidths = {};
    for (const col of columns) {
        let maxWidth = col.length;
        for (const file of barrel.files) {
            const value = col === "name" ? file.name : file.meta[col];
            const str = formatValue(value);
            maxWidth = Math.max(maxWidth, str.length);
        }
        columnWidths[col] = Math.min(maxWidth + 2, 30);
    }
    useInput((input, key) => {
        if (key.upArrow || input === "k") {
            onNavigate(Math.max(0, selectedIndex - 1));
        }
        else if (key.downArrow || input === "j") {
            onNavigate(Math.min(barrel.files.length - 1, selectedIndex + 1));
        }
        else if (key.return || input === "e") {
            if (barrel.files.length > 0) {
                onEdit(selectedIndex);
            }
        }
        else if (key.escape || input === "b") {
            onBack();
        }
        else if (input === "r") {
            generateBarrel(barrel.dir);
            onRefresh();
            setMessage("Regenerated index file");
        }
    });
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: barrel.relativePath || "." }), _jsxs(Text, { dimColor: true, children: [" (", barrel.files.length, " files)"] })] }), message && (_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: "green", children: message }) })), barrel.files.length === 0 ? (_jsx(Text, { dimColor: true, children: "No files in this collection" })) : (_jsxs(_Fragment, { children: [_jsx(Box, { children: columns.map((col) => (_jsx(Box, { width: columnWidths[col], children: _jsx(Text, { bold: true, color: "blue", children: truncate(col, columnWidths[col] - 2) }) }, col))) }), _jsx(Box, { children: _jsx(Text, { dimColor: true, children: columns.map((col) => "─".repeat(columnWidths[col] - 1)).join("┼") }) }), barrel.files.map((file, index) => (_jsx(Box, { children: columns.map((col) => {
                            const value = col === "name" ? file.name : file.meta[col];
                            const str = formatValue(value);
                            return (_jsx(Box, { width: columnWidths[col], children: _jsxs(Text, { color: index === selectedIndex ? "green" : undefined, bold: index === selectedIndex, children: [index === selectedIndex && col === columns[0] ? "> " : "", truncate(str, columnWidths[col] - (index === selectedIndex && col === columns[0] ? 4 : 2))] }) }, col));
                        }) }, file.name)))] })), _jsx(Box, { marginTop: 1, flexDirection: "column", children: _jsx(Text, { dimColor: true, children: "j/k: navigate | e/Enter: edit | r: regenerate | b/Esc: back | q: quit" }) })] }));
}
function formatValue(value) {
    if (value === undefined || value === null)
        return "";
    if (typeof value === "string")
        return value;
    if (typeof value === "number" || typeof value === "boolean")
        return String(value);
    if (Array.isArray(value))
        return value.join(", ");
    return JSON.stringify(value);
}
function truncate(str, maxLen) {
    if (str.length <= maxLen)
        return str;
    return str.slice(0, maxLen - 1) + "…";
}
