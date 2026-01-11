import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text, useInput } from "ink";
export function CollectionList({ barrels, selectedIndex, onSelect, onNavigate, }) {
    useInput((input, key) => {
        if (key.upArrow || input === "k") {
            onNavigate(Math.max(0, selectedIndex - 1));
        }
        else if (key.downArrow || input === "j") {
            onNavigate(Math.min(barrels.length - 1, selectedIndex + 1));
        }
        else if (key.return) {
            onSelect(selectedIndex);
        }
    });
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "Collections" }), _jsxs(Text, { dimColor: true, children: [" (", barrels.length, " found)"] })] }), barrels.map((barrel, index) => (_jsxs(Box, { children: [_jsxs(Text, { color: index === selectedIndex ? "green" : undefined, bold: index === selectedIndex, children: [index === selectedIndex ? "> " : "  ", barrel.relativePath || "."] }), _jsxs(Text, { dimColor: true, children: [" (", barrel.files.length, " files)"] })] }, barrel.dir))), _jsx(Box, { marginTop: 1, flexDirection: "column", children: _jsx(Text, { dimColor: true, children: "j/k or arrows: navigate | Enter: select | q: quit" }) })] }));
}
