import React from "react";
import { Box, Text, useInput } from "ink";
import { BarrelInfo } from "../../api.js";

interface CollectionListProps {
  barrels: BarrelInfo[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onNavigate: (index: number) => void;
}

export function CollectionList({
  barrels,
  selectedIndex,
  onSelect,
  onNavigate,
}: CollectionListProps) {
  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      onNavigate(Math.max(0, selectedIndex - 1));
    } else if (key.downArrow || input === "j") {
      onNavigate(Math.min(barrels.length - 1, selectedIndex + 1));
    } else if (key.return) {
      onSelect(selectedIndex);
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">Collections</Text>
        <Text dimColor> ({barrels.length} found)</Text>
      </Box>

      {barrels.map((barrel, index) => (
        <Box key={barrel.dir}>
          <Text
            color={index === selectedIndex ? "green" : undefined}
            bold={index === selectedIndex}
          >
            {index === selectedIndex ? "> " : "  "}
            {barrel.relativePath || "."}
          </Text>
          <Text dimColor> ({barrel.files.length} files)</Text>
        </Box>
      ))}

      <Box marginTop={1} flexDirection="column">
        <Text dimColor>j/k or arrows: navigate | Enter: select | q: quit</Text>
      </Box>
    </Box>
  );
}
