import React from "react";
export function BarrelList({ barrels, selectedPath, onSelect }) {
    return (<div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Barrels</h2>
      </div>
      <ul className="divide-y divide-gray-100">
        {barrels.map((barrel) => (<li key={barrel.relativePath}>
            <button onClick={() => onSelect(barrel.relativePath)} className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${selectedPath === barrel.relativePath
                ? "bg-blue-50 border-l-4 border-blue-500"
                : ""}`}>
              <div className="font-medium text-gray-900">
                {barrel.relativePath || "."}
              </div>
              <div className="text-sm text-gray-500">
                {barrel.files.length} files
              </div>
            </button>
          </li>))}
      </ul>
      {barrels.length === 0 && (<div className="px-4 py-8 text-center text-gray-500">
          No barrel files found
        </div>)}
    </div>);
}
