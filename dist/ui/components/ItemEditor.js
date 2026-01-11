import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { updateFileMeta, regenerateBarrel } from "../../api.js";
export function ItemEditor({ file, barrelDir, onSave, onCancel }) {
    const [meta, setMeta] = useState({ ...file.meta });
    const [keys, setKeys] = useState(Object.keys(file.meta));
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mode, setMode] = useState("navigate");
    const [editValue, setEditValue] = useState("");
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");
    useInput((input, key) => {
        if (mode !== "navigate")
            return;
        if (key.upArrow || input === "k") {
            setSelectedIndex(Math.max(0, selectedIndex - 1));
        }
        else if (key.downArrow || input === "j") {
            setSelectedIndex(Math.min(keys.length - 1, selectedIndex + 1));
        }
        else if (key.return || input === "e") {
            if (keys.length > 0) {
                const currentKey = keys[selectedIndex];
                setEditValue(formatForEdit(meta[currentKey]));
                setMode("edit");
            }
        }
        else if (input === "a") {
            setNewKey("");
            setNewValue("");
            setMode("add-key");
        }
        else if (input === "d") {
            if (keys.length > 0) {
                const keyToDelete = keys[selectedIndex];
                const newMeta = { ...meta };
                delete newMeta[keyToDelete];
                setMeta(newMeta);
                setKeys(keys.filter((k) => k !== keyToDelete));
                setSelectedIndex(Math.max(0, selectedIndex - 1));
            }
        }
        else if (input === "s") {
            updateFileMeta(file.path, meta);
            regenerateBarrel(barrelDir);
            onSave();
        }
        else if (key.escape || input === "c") {
            onCancel();
        }
    });
    const handleEditSubmit = (value) => {
        const currentKey = keys[selectedIndex];
        const parsed = parseValue(value);
        setMeta({ ...meta, [currentKey]: parsed });
        setMode("navigate");
    };
    const handleAddKeySubmit = (value) => {
        setNewKey(value);
        setMode("add-value");
    };
    const handleAddValueSubmit = (value) => {
        if (newKey) {
            const parsed = parseValue(value);
            setMeta({ ...meta, [newKey]: parsed });
            setKeys([...keys, newKey]);
            setSelectedIndex(keys.length);
        }
        setMode("navigate");
    };
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "Editing: " }), _jsx(Text, { children: file.name })] }), keys.length === 0 ? (_jsx(Text, { dimColor: true, children: "No meta fields. Press 'a' to add one." })) : (keys.map((key, index) => (_jsxs(Box, { children: [_jsx(Text, { color: index === selectedIndex ? "green" : undefined, bold: index === selectedIndex, children: index === selectedIndex ? "> " : "  " }), _jsx(Box, { width: 20, children: _jsxs(Text, { color: "blue", children: [key, ":"] }) }), mode === "edit" && index === selectedIndex ? (_jsx(TextInput, { value: editValue, onChange: setEditValue, onSubmit: handleEditSubmit })) : (_jsx(Text, { children: formatForEdit(meta[key]) }))] }, key)))), mode === "add-key" && (_jsxs(Box, { marginTop: 1, children: [_jsx(Text, { color: "yellow", children: "New field name: " }), _jsx(TextInput, { value: newKey, onChange: setNewKey, onSubmit: handleAddKeySubmit })] })), mode === "add-value" && (_jsxs(Box, { marginTop: 1, children: [_jsxs(Text, { color: "yellow", children: [newKey, ": "] }), _jsx(TextInput, { value: newValue, onChange: setNewValue, onSubmit: handleAddValueSubmit })] })), _jsx(Box, { marginTop: 1, flexDirection: "column", borderStyle: "single", borderColor: "gray", paddingX: 1, children: _jsx(Text, { dimColor: true, children: mode === "navigate"
                        ? "j/k: navigate | e/Enter: edit | a: add field | d: delete | s: save | c/Esc: cancel"
                        : "Enter: confirm | (editing...)" }) })] }));
}
function formatForEdit(value) {
    if (value === undefined || value === null)
        return "";
    if (typeof value === "string")
        return value;
    return JSON.stringify(value);
}
function parseValue(str) {
    const trimmed = str.trim();
    // Try JSON first
    if (trimmed.startsWith("[") ||
        trimmed.startsWith("{") ||
        trimmed === "true" ||
        trimmed === "false" ||
        trimmed === "null") {
        try {
            return JSON.parse(trimmed);
        }
        catch {
            // Not valid JSON, treat as string
        }
    }
    // Try number
    const num = Number(trimmed);
    if (!isNaN(num) && trimmed !== "") {
        return num;
    }
    // Default to string
    return str;
}
