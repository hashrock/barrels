import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { getBarrels } from "../api.js";
import { CollectionList } from "./components/CollectionList.js";
import { TableView } from "./components/TableView.js";
import { ItemEditor } from "./components/ItemEditor.js";
export function App({ baseDir }) {
    const { exit } = useApp();
    const [barrels, setBarrels] = useState([]);
    const [selectedBarrelIndex, setSelectedBarrelIndex] = useState(0);
    const [selectedFileIndex, setSelectedFileIndex] = useState(0);
    const [view, setView] = useState("collections");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const loadBarrels = () => {
        setLoading(true);
        try {
            const data = getBarrels(baseDir);
            setBarrels(data);
        }
        catch (err) {
            setMessage(`Error: ${err}`);
        }
        setLoading(false);
    };
    useEffect(() => {
        loadBarrels();
    }, [baseDir]);
    useInput((input, key) => {
        if (input === "q") {
            exit();
            return;
        }
        if (key.escape) {
            if (view === "editor") {
                setView("table");
            }
            else if (view === "table") {
                setView("collections");
                setSelectedFileIndex(0);
            }
            return;
        }
    });
    if (loading) {
        return (_jsx(Box, { children: _jsx(Text, { children: "Loading..." }) }));
    }
    if (barrels.length === 0) {
        return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { color: "yellow", children: ["No collections found in ", baseDir] }), _jsx(Text, { dimColor: true, children: "Press q to quit" })] }));
    }
    const selectedBarrel = barrels[selectedBarrelIndex];
    if (view === "collections") {
        return (_jsx(CollectionList, { barrels: barrels, selectedIndex: selectedBarrelIndex, onSelect: (index) => {
                setSelectedBarrelIndex(index);
                setSelectedFileIndex(0);
                setView("table");
            }, onNavigate: setSelectedBarrelIndex }));
    }
    if (view === "table") {
        return (_jsx(TableView, { barrel: selectedBarrel, selectedIndex: selectedFileIndex, onNavigate: setSelectedFileIndex, onEdit: (index) => {
                setSelectedFileIndex(index);
                setView("editor");
            }, onBack: () => setView("collections"), onRefresh: loadBarrels, message: message, setMessage: setMessage }));
    }
    if (view === "editor" && selectedBarrel?.files[selectedFileIndex]) {
        return (_jsx(ItemEditor, { file: selectedBarrel.files[selectedFileIndex], barrelDir: selectedBarrel.dir, onSave: () => {
                loadBarrels();
                setView("table");
                setMessage("Saved successfully");
            }, onCancel: () => setView("table") }));
    }
    return null;
}
