import React, { useState, useEffect, useCallback } from "react";
import type { BarrelInfo } from "./types";
import { fetchBarrels, updateFileMeta, createFile, deleteFile } from "./api";
import { BarrelList } from "./components/BarrelList";
import { FileTable } from "./components/FileTable";

export function App() {
  const [barrels, setBarrels] = useState<BarrelInfo[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBarrels = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchBarrels();
      setBarrels(data);
      if (data.length > 0 && !selectedPath) {
        setSelectedPath(data[0].relativePath);
      }
    } catch (err) {
      setError("Failed to load barrels");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedPath]);

  useEffect(() => {
    loadBarrels();
  }, [loadBarrels]);

  const selectedBarrel = barrels.find((b) => b.relativePath === selectedPath);

  const handleUpdateMeta = async (
    fileName: string,
    meta: Record<string, unknown>
  ) => {
    if (!selectedPath) return;
    try {
      await updateFileMeta(selectedPath, fileName, meta);
      await loadBarrels();
    } catch (err) {
      setError("Failed to update file");
      console.error(err);
    }
  };

  const handleCreateFile = async (
    fileName: string,
    meta: Record<string, unknown>
  ) => {
    if (!selectedPath) return;
    try {
      await createFile(selectedPath, fileName, meta);
      await loadBarrels();
    } catch (err) {
      setError("Failed to create file");
      console.error(err);
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    if (!selectedPath) return;
    try {
      await deleteFile(selectedPath, fileName);
      await loadBarrels();
    } catch (err) {
      setError("Failed to delete file");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Metacolle Studio</h1>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <BarrelList
              barrels={barrels}
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
            />
          </div>
          <div className="col-span-9">
            {selectedBarrel ? (
              <FileTable
                barrel={selectedBarrel}
                onUpdateMeta={handleUpdateMeta}
                onCreateFile={handleCreateFile}
                onDeleteFile={handleDeleteFile}
              />
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                Select a collection to view files
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
