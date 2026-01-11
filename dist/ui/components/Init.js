import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import TextInput from "ink-text-input";
import { initMeta, regenerateBarrel } from "../../api.js";
export function Init({ dir }) {
    const { exit } = useApp();
    const [step, setStep] = useState("fields");
    const [fields, setFields] = useState([
        { key: "title", value: "" },
        { key: "createdAt", value: new Date().toISOString().split("T")[0] },
    ]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [editMode, setEditMode] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [result, setResult] = useState(null);
    useInput((input, key) => {
        if (step === "done") {
            if (input === "q" || key.return) {
                exit();
            }
            return;
        }
        if (editMode !== null)
            return;
        if (step === "fields") {
            if (key.upArrow || input === "k") {
                setSelectedIndex(Math.max(0, selectedIndex - 1));
            }
            else if (key.downArrow || input === "j") {
                setSelectedIndex(Math.min(fields.length - 1, selectedIndex + 1));
            }
            else if (input === "e") {
                setEditValue(fields[selectedIndex].value);
                setEditMode("value");
            }
            else if (input === "K") {
                setEditValue(fields[selectedIndex].key);
                setEditMode("key");
            }
            else if (input === "a") {
                setFields([...fields, { key: "newField", value: "" }]);
                setSelectedIndex(fields.length);
            }
            else if (input === "d" && fields.length > 1) {
                const newFields = fields.filter((_, i) => i !== selectedIndex);
                setFields(newFields);
                setSelectedIndex(Math.max(0, selectedIndex - 1));
            }
            else if (key.return) {
                setStep("confirm");
            }
            else if (input === "q") {
                exit();
            }
        }
        else if (step === "confirm") {
            if (input === "y" || key.return) {
                const template = {};
                for (const field of fields) {
                    template[field.key] = parseValue(field.value);
                }
                const res = initMeta(dir, template);
                if (res.added.length > 0) {
                    regenerateBarrel(dir);
                }
                setResult(res);
                setStep("done");
            }
            else if (input === "n" || key.escape) {
                setStep("fields");
            }
        }
    });
    const handleEditSubmit = (value) => {
        const newFields = [...fields];
        if (editMode === "key") {
            newFields[selectedIndex].key = value;
        }
        else {
            newFields[selectedIndex].value = value;
        }
        setFields(newFields);
        setEditMode(null);
    };
    if (step === "done" && result) {
        return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: "cyan", children: "Init Complete" }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [result.added.length > 0 && (_jsxs(_Fragment, { children: [_jsxs(Text, { color: "green", children: ["Added meta to ", result.added.length, " files:"] }), result.added.map((f) => (_jsxs(Text, { color: "green", children: ["  + ", f] }, f)))] })), result.skipped.length > 0 && (_jsxs(_Fragment, { children: [_jsxs(Text, { color: "yellow", children: ["Skipped ", result.skipped.length, " files (already have meta):"] }), result.skipped.map((f) => (_jsxs(Text, { color: "yellow", children: ["  - ", f] }, f)))] })), result.added.length === 0 && result.skipped.length === 0 && (_jsx(Text, { dimColor: true, children: "No files found to process" }))] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "Press q or Enter to exit" }) })] }));
    }
    if (step === "confirm") {
        return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: "yellow", children: "Confirm Init" }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsxs(Text, { children: ["Directory: ", dir] }), _jsx(Text, { children: "Template fields:" }), fields.map((field) => (_jsxs(Text, { children: ["  ", field.key, ": ", field.value || "(empty)"] }, field.key)))] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "Press y to confirm, n to go back" }) })] }));
    }
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: "cyan", children: "Init Meta Template" }), _jsxs(Text, { dimColor: true, children: ["Directory: ", dir] }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { children: "Define the meta template fields:" }), fields.map((field, index) => (_jsxs(Box, { children: [_jsx(Text, { color: index === selectedIndex ? "green" : undefined, bold: index === selectedIndex, children: index === selectedIndex ? "> " : "  " }), editMode === "key" && index === selectedIndex ? (_jsxs(_Fragment, { children: [_jsx(TextInput, { value: editValue, onChange: setEditValue, onSubmit: handleEditSubmit }), _jsxs(Text, { children: [": ", field.value || "(empty)"] })] })) : editMode === "value" && index === selectedIndex ? (_jsxs(_Fragment, { children: [_jsxs(Text, { color: "blue", children: [field.key, ": "] }), _jsx(TextInput, { value: editValue, onChange: setEditValue, onSubmit: handleEditSubmit })] })) : (_jsxs(_Fragment, { children: [_jsxs(Text, { color: "blue", children: [field.key, ": "] }), _jsx(Text, { children: field.value || "(empty)" })] }))] }, index)))] }), _jsx(Box, { marginTop: 1, borderStyle: "single", borderColor: "gray", paddingX: 1, children: _jsx(Text, { dimColor: true, children: "j/k: navigate | e: edit value | K: edit key | a: add | d: delete | Enter: confirm | q: quit" }) })] }));
}
function parseValue(str) {
    const trimmed = str.trim();
    if (trimmed === "")
        return "";
    if (trimmed.startsWith("[") ||
        trimmed.startsWith("{") ||
        trimmed === "true" ||
        trimmed === "false" ||
        trimmed === "null") {
        try {
            return JSON.parse(trimmed);
        }
        catch {
            // Not valid JSON
        }
    }
    const num = Number(trimmed);
    if (!isNaN(num) && trimmed !== "") {
        return num;
    }
    return str;
}
