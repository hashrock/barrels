import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { FileInfo, updateFileMeta, regenerateBarrel } from "../../api.js";

interface ItemEditorProps {
  file: FileInfo;
  barrelDir: string;
  onSave: () => void;
  onCancel: () => void;
}

type EditMode = "navigate" | "edit" | "add-key" | "add-value";

export function ItemEditor({ file, barrelDir, onSave, onCancel }: ItemEditorProps) {
  const [meta, setMeta] = useState<Record<string, unknown>>({ ...file.meta });
  const [keys, setKeys] = useState<string[]>(Object.keys(file.meta));
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<EditMode>("navigate");
  const [editValue, setEditValue] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  useInput((input, key) => {
    if (mode !== "navigate") return;

    if (key.upArrow || input === "k") {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    } else if (key.downArrow || input === "j") {
      setSelectedIndex(Math.min(keys.length - 1, selectedIndex + 1));
    } else if (key.return || input === "e") {
      if (keys.length > 0) {
        const currentKey = keys[selectedIndex];
        setEditValue(formatForEdit(meta[currentKey]));
        setMode("edit");
      }
    } else if (input === "a") {
      setNewKey("");
      setNewValue("");
      setMode("add-key");
    } else if (input === "d") {
      if (keys.length > 0) {
        const keyToDelete = keys[selectedIndex];
        const newMeta = { ...meta };
        delete newMeta[keyToDelete];
        setMeta(newMeta);
        setKeys(keys.filter((k) => k !== keyToDelete));
        setSelectedIndex(Math.max(0, selectedIndex - 1));
      }
    } else if (input === "s") {
      updateFileMeta(file.path, meta);
      regenerateBarrel(barrelDir);
      onSave();
    } else if (key.escape || input === "c") {
      onCancel();
    }
  });

  const handleEditSubmit = (value: string) => {
    const currentKey = keys[selectedIndex];
    const parsed = parseValue(value);
    setMeta({ ...meta, [currentKey]: parsed });
    setMode("navigate");
  };

  const handleAddKeySubmit = (value: string) => {
    setNewKey(value);
    setMode("add-value");
  };

  const handleAddValueSubmit = (value: string) => {
    if (newKey) {
      const parsed = parseValue(value);
      setMeta({ ...meta, [newKey]: parsed });
      setKeys([...keys, newKey]);
      setSelectedIndex(keys.length);
    }
    setMode("navigate");
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">Editing: </Text>
        <Text>{file.name}</Text>
      </Box>

      {keys.length === 0 ? (
        <Text dimColor>No meta fields. Press 'a' to add one.</Text>
      ) : (
        keys.map((key, index) => (
          <Box key={key}>
            <Text
              color={index === selectedIndex ? "green" : undefined}
              bold={index === selectedIndex}
            >
              {index === selectedIndex ? "> " : "  "}
            </Text>
            <Box width={20}>
              <Text color="blue">{key}:</Text>
            </Box>
            {mode === "edit" && index === selectedIndex ? (
              <TextInput
                value={editValue}
                onChange={setEditValue}
                onSubmit={handleEditSubmit}
              />
            ) : (
              <Text>{formatForEdit(meta[key])}</Text>
            )}
          </Box>
        ))
      )}

      {mode === "add-key" && (
        <Box marginTop={1}>
          <Text color="yellow">New field name: </Text>
          <TextInput
            value={newKey}
            onChange={setNewKey}
            onSubmit={handleAddKeySubmit}
          />
        </Box>
      )}

      {mode === "add-value" && (
        <Box marginTop={1}>
          <Text color="yellow">{newKey}: </Text>
          <TextInput
            value={newValue}
            onChange={setNewValue}
            onSubmit={handleAddValueSubmit}
          />
        </Box>
      )}

      <Box marginTop={1} flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1}>
        <Text dimColor>
          {mode === "navigate"
            ? "j/k: navigate | e/Enter: edit | a: add field | d: delete | s: save | c/Esc: cancel"
            : "Enter: confirm | (editing...)"}
        </Text>
      </Box>
    </Box>
  );
}

function formatForEdit(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function parseValue(str: string): unknown {
  const trimmed = str.trim();

  // Try JSON first
  if (
    trimmed.startsWith("[") ||
    trimmed.startsWith("{") ||
    trimmed === "true" ||
    trimmed === "false" ||
    trimmed === "null"
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
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
