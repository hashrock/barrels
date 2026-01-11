import React, { useState, useEffect } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { getBarrels, BarrelInfo } from "../api.js";
import { CollectionList } from "./components/CollectionList.js";
import { TableView } from "./components/TableView.js";
import { ItemEditor } from "./components/ItemEditor.js";

interface AppProps {
  baseDir: string;
}

type View = "collections" | "table" | "editor";

export function App({ baseDir }: AppProps) {
  const { exit } = useApp();
  const [barrels, setBarrels] = useState<BarrelInfo[]>([]);
  const [selectedBarrelIndex, setSelectedBarrelIndex] = useState(0);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [view, setView] = useState<View>("collections");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const loadBarrels = () => {
    setLoading(true);
    try {
      const data = getBarrels(baseDir);
      setBarrels(data);
    } catch (err) {
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
      } else if (view === "table") {
        setView("collections");
        setSelectedFileIndex(0);
      }
      return;
    }
  });

  if (loading) {
    return (
      <Box>
        <Text>Loading...</Text>
      </Box>
    );
  }

  if (barrels.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">No collections found in {baseDir}</Text>
        <Text dimColor>Press q to quit</Text>
      </Box>
    );
  }

  const selectedBarrel = barrels[selectedBarrelIndex];

  if (view === "collections") {
    return (
      <CollectionList
        barrels={barrels}
        selectedIndex={selectedBarrelIndex}
        onSelect={(index) => {
          setSelectedBarrelIndex(index);
          setSelectedFileIndex(0);
          setView("table");
        }}
        onNavigate={setSelectedBarrelIndex}
      />
    );
  }

  if (view === "table") {
    return (
      <TableView
        barrel={selectedBarrel}
        selectedIndex={selectedFileIndex}
        onNavigate={setSelectedFileIndex}
        onEdit={(index) => {
          setSelectedFileIndex(index);
          setView("editor");
        }}
        onBack={() => setView("collections")}
        onRefresh={loadBarrels}
        message={message}
        setMessage={setMessage}
      />
    );
  }

  if (view === "editor" && selectedBarrel?.files[selectedFileIndex]) {
    return (
      <ItemEditor
        file={selectedBarrel.files[selectedFileIndex]}
        barrelDir={selectedBarrel.dir}
        onSave={() => {
          loadBarrels();
          setView("table");
          setMessage("Saved successfully");
        }}
        onCancel={() => setView("table")}
      />
    );
  }

  return null;
}
