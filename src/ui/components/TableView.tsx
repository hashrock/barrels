import React from "react";
import { Box, Text, useInput } from "ink";
import { BarrelInfo } from "../../api.js";
import { generateBarrel } from "../../index.js";

interface TableViewProps {
  barrel: BarrelInfo;
  selectedIndex: number;
  onNavigate: (index: number) => void;
  onEdit: (index: number) => void;
  onBack: () => void;
  onRefresh: () => void;
  message: string | null;
  setMessage: (msg: string | null) => void;
}

export function TableView({
  barrel,
  selectedIndex,
  onNavigate,
  onEdit,
  onBack,
  onRefresh,
  message,
  setMessage,
}: TableViewProps) {
  // Collect all unique meta keys
  const allKeys = new Set<string>();
  for (const file of barrel.files) {
    for (const key of Object.keys(file.meta)) {
      allKeys.add(key);
    }
  }
  const columns = ["name", ...Array.from(allKeys).sort()];

  // Calculate column widths
  const columnWidths: Record<string, number> = {};
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
    } else if (key.downArrow || input === "j") {
      onNavigate(Math.min(barrel.files.length - 1, selectedIndex + 1));
    } else if (key.return || input === "e") {
      if (barrel.files.length > 0) {
        onEdit(selectedIndex);
      }
    } else if (key.escape || input === "b") {
      onBack();
    } else if (input === "r") {
      generateBarrel(barrel.dir);
      onRefresh();
      setMessage("Regenerated index file");
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">{barrel.relativePath || "."}</Text>
        <Text dimColor> ({barrel.files.length} files)</Text>
      </Box>

      {message && (
        <Box marginBottom={1}>
          <Text color="green">{message}</Text>
        </Box>
      )}

      {barrel.files.length === 0 ? (
        <Text dimColor>No files in this collection</Text>
      ) : (
        <>
          {/* Header */}
          <Box>
            {columns.map((col) => (
              <Box key={col} width={columnWidths[col]}>
                <Text bold color="blue">{truncate(col, columnWidths[col] - 2)}</Text>
              </Box>
            ))}
          </Box>

          {/* Separator */}
          <Box>
            <Text dimColor>
              {columns.map((col) => "─".repeat(columnWidths[col] - 1)).join("┼")}
            </Text>
          </Box>

          {/* Rows */}
          {barrel.files.map((file, index) => (
            <Box key={file.name}>
              {columns.map((col) => {
                const value = col === "name" ? file.name : file.meta[col];
                const str = formatValue(value);
                return (
                  <Box key={col} width={columnWidths[col]}>
                    <Text
                      color={index === selectedIndex ? "green" : undefined}
                      bold={index === selectedIndex}
                    >
                      {index === selectedIndex && col === columns[0] ? "> " : ""}
                      {truncate(str, columnWidths[col] - (index === selectedIndex && col === columns[0] ? 4 : 2))}
                    </Text>
                  </Box>
                );
              })}
            </Box>
          ))}
        </>
      )}

      <Box marginTop={1} flexDirection="column">
        <Text dimColor>j/k: navigate | e/Enter: edit | r: regenerate | b/Esc: back | q: quit</Text>
      </Box>
    </Box>
  );
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.join(", ");
  return JSON.stringify(value);
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}
