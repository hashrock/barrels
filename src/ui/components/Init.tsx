import React, { useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import TextInput from "ink-text-input";
import { initMeta, regenerateBarrel } from "../../api.js";

interface InitProps {
  dir: string;
}

type Step = "fields" | "confirm" | "done";

interface Field {
  key: string;
  value: string;
}

export function Init({ dir }: InitProps) {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>("fields");
  const [fields, setFields] = useState<Field[]>([
    { key: "title", value: "" },
    { key: "createdAt", value: new Date().toISOString().split("T")[0] },
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editMode, setEditMode] = useState<"key" | "value" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [result, setResult] = useState<{ added: string[]; skipped: string[] } | null>(null);

  useInput((input, key) => {
    if (step === "done") {
      if (input === "q" || key.return) {
        exit();
      }
      return;
    }

    if (editMode !== null) return;

    if (step === "fields") {
      if (key.upArrow || input === "k") {
        setSelectedIndex(Math.max(0, selectedIndex - 1));
      } else if (key.downArrow || input === "j") {
        setSelectedIndex(Math.min(fields.length - 1, selectedIndex + 1));
      } else if (input === "e") {
        setEditValue(fields[selectedIndex].value);
        setEditMode("value");
      } else if (input === "K") {
        setEditValue(fields[selectedIndex].key);
        setEditMode("key");
      } else if (input === "a") {
        setFields([...fields, { key: "newField", value: "" }]);
        setSelectedIndex(fields.length);
      } else if (input === "d" && fields.length > 1) {
        const newFields = fields.filter((_, i) => i !== selectedIndex);
        setFields(newFields);
        setSelectedIndex(Math.max(0, selectedIndex - 1));
      } else if (key.return) {
        setStep("confirm");
      } else if (input === "q") {
        exit();
      }
    } else if (step === "confirm") {
      if (input === "y" || key.return) {
        const template: Record<string, unknown> = {};
        for (const field of fields) {
          template[field.key] = parseValue(field.value);
        }
        const res = initMeta(dir, template);
        if (res.added.length > 0) {
          regenerateBarrel(dir);
        }
        setResult(res);
        setStep("done");
      } else if (input === "n" || key.escape) {
        setStep("fields");
      }
    }
  });

  const handleEditSubmit = (value: string) => {
    const newFields = [...fields];
    if (editMode === "key") {
      newFields[selectedIndex].key = value;
    } else {
      newFields[selectedIndex].value = value;
    }
    setFields(newFields);
    setEditMode(null);
  };

  if (step === "done" && result) {
    return (
      <Box flexDirection="column">
        <Text bold color="cyan">Init Complete</Text>
        <Box marginTop={1} flexDirection="column">
          {result.added.length > 0 && (
            <>
              <Text color="green">Added meta to {result.added.length} files:</Text>
              {result.added.map((f) => (
                <Text key={f} color="green">  + {f}</Text>
              ))}
            </>
          )}
          {result.skipped.length > 0 && (
            <>
              <Text color="yellow">Skipped {result.skipped.length} files (already have meta):</Text>
              {result.skipped.map((f) => (
                <Text key={f} color="yellow">  - {f}</Text>
              ))}
            </>
          )}
          {result.added.length === 0 && result.skipped.length === 0 && (
            <Text dimColor>No files found to process</Text>
          )}
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Press q or Enter to exit</Text>
        </Box>
      </Box>
    );
  }

  if (step === "confirm") {
    return (
      <Box flexDirection="column">
        <Text bold color="yellow">Confirm Init</Text>
        <Box marginTop={1} flexDirection="column">
          <Text>Directory: {dir}</Text>
          <Text>Template fields:</Text>
          {fields.map((field) => (
            <Text key={field.key}>  {field.key}: {field.value || "(empty)"}</Text>
          ))}
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Press y to confirm, n to go back</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">Init Meta Template</Text>
      <Text dimColor>Directory: {dir}</Text>

      <Box marginTop={1} flexDirection="column">
        <Text>Define the meta template fields:</Text>
        {fields.map((field, index) => (
          <Box key={index}>
            <Text
              color={index === selectedIndex ? "green" : undefined}
              bold={index === selectedIndex}
            >
              {index === selectedIndex ? "> " : "  "}
            </Text>
            {editMode === "key" && index === selectedIndex ? (
              <>
                <TextInput
                  value={editValue}
                  onChange={setEditValue}
                  onSubmit={handleEditSubmit}
                />
                <Text>: {field.value || "(empty)"}</Text>
              </>
            ) : editMode === "value" && index === selectedIndex ? (
              <>
                <Text color="blue">{field.key}: </Text>
                <TextInput
                  value={editValue}
                  onChange={setEditValue}
                  onSubmit={handleEditSubmit}
                />
              </>
            ) : (
              <>
                <Text color="blue">{field.key}: </Text>
                <Text>{field.value || "(empty)"}</Text>
              </>
            )}
          </Box>
        ))}
      </Box>

      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text dimColor>
          j/k: navigate | e: edit value | K: edit key | a: add | d: delete | Enter: confirm | q: quit
        </Text>
      </Box>
    </Box>
  );
}

function parseValue(str: string): unknown {
  const trimmed = str.trim();
  if (trimmed === "") return "";

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
      // Not valid JSON
    }
  }

  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== "") {
    return num;
  }

  return str;
}
