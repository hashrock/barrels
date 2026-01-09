import React, { useState } from "react";
import type { FileInfo } from "../types";

interface Props {
  file: FileInfo;
  onSave: (meta: Record<string, unknown>) => void;
  onClose: () => void;
}

export function MetaEditor({ file, onSave, onClose }: Props) {
  const [meta, setMeta] = useState<Record<string, unknown>>({ ...file.meta });
  const [newKey, setNewKey] = useState("");

  const handleChange = (key: string, value: string) => {
    // Try to parse as JSON for arrays/objects, otherwise keep as string
    let parsed: unknown = value;
    if (value.startsWith("[") || value.startsWith("{")) {
      try {
        parsed = JSON.parse(value);
      } catch {
        // Keep as string if invalid JSON
      }
    } else if (value === "true") {
      parsed = true;
    } else if (value === "false") {
      parsed = false;
    } else if (/^-?\d+(\.\d+)?$/.test(value)) {
      parsed = Number(value);
    }
    setMeta({ ...meta, [key]: parsed });
  };

  const handleAddKey = () => {
    if (newKey && !(newKey in meta)) {
      setMeta({ ...meta, [newKey]: "" });
      setNewKey("");
    }
  };

  const handleRemoveKey = (key: string) => {
    const { [key]: _, ...rest } = meta;
    setMeta(rest);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Edit: {file.name}
          </h3>
        </div>

        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
          {Object.entries(meta).map(([key, value]) => (
            <div key={key} className="flex gap-2 items-start">
              <label className="w-32 flex-shrink-0 text-sm font-medium text-gray-700 py-2">
                {key}
              </label>
              <input
                type="text"
                value={formatForInput(value)}
                onChange={(e) => handleChange(key, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <button
                onClick={() => handleRemoveKey(key)}
                className="px-2 py-2 text-red-600 hover:text-red-800"
                title="Remove field"
              >
                x
              </button>
            </div>
          ))}

          <div className="flex gap-2 items-center pt-2 border-t border-gray-200">
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddKey()}
              placeholder="New field name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <button
              onClick={handleAddKey}
              disabled={!newKey || newKey in meta}
              className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Add Field
            </button>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(meta)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function formatForInput(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value) || typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}
