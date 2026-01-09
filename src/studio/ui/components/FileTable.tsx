import React, { useState } from "react";
import type { FileInfo, BarrelInfo } from "../types";
import { MetaEditor } from "./MetaEditor";
import { CreateFileModal } from "./CreateFileModal";

interface Props {
  barrel: BarrelInfo;
  onUpdateMeta: (fileName: string, meta: Record<string, unknown>) => void;
  onCreateFile: (fileName: string, meta: Record<string, unknown>) => void;
  onDeleteFile: (fileName: string) => void;
}

export function FileTable({
  barrel,
  onUpdateMeta,
  onCreateFile,
  onDeleteFile,
}: Props) {
  const [editingFile, setEditingFile] = useState<FileInfo | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Get all unique meta keys across all files
  const allKeys = Array.from(
    new Set(barrel.files.flatMap((f) => Object.keys(f.meta)))
  ).sort();

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          {barrel.relativePath || "Root"}
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition-colors"
        >
          + New File
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                File
              </th>
              {allKeys.map((key) => (
                <th
                  key={key}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {key}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {barrel.files.map((file) => (
              <tr key={file.name} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {file.name}
                </td>
                {allKeys.map((key) => (
                  <td
                    key={key}
                    className="px-4 py-3 whitespace-nowrap text-sm text-gray-600"
                  >
                    {formatValue(file.meta[key])}
                  </td>
                ))}
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => setEditingFile(file)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete ${file.name}?`)) {
                        onDeleteFile(file.name);
                      }
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {barrel.files.length === 0 && (
        <div className="px-4 py-8 text-center text-gray-500">
          No files in this barrel
        </div>
      )}

      {editingFile && (
        <MetaEditor
          file={editingFile}
          onSave={(meta) => {
            onUpdateMeta(editingFile.name, meta);
            setEditingFile(null);
          }}
          onClose={() => setEditingFile(null)}
        />
      )}

      {showCreateModal && (
        <CreateFileModal
          onCreateFile={(fileName, meta) => {
            onCreateFile(fileName, meta);
            setShowCreateModal(false);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null) return "-";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
