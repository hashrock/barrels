import React, { useState } from "react";
export function CreateFileModal({ onCreateFile, onClose }) {
    const [fileName, setFileName] = useState("");
    const [title, setTitle] = useState("");
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!fileName)
            return;
        const today = new Date().toISOString().split("T")[0];
        onCreateFile(fileName, {
            title: title || fileName,
            createdAt: today,
        });
    };
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Create New File
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File Name
            </label>
            <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="e.g., my-post" className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" autoFocus/>
            <p className="mt-1 text-xs text-gray-500">
              Extension will be added automatically (.tsx or .jsx)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., My First Post" className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!fileName} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>);
}
