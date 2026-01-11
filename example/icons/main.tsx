import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { icons, Meta } from "./_index";

type IconItem = {
  meta: Meta;
  Component: React.ComponentType<{ size?: number }>;
};

function IconCard({ meta, Component }: IconItem) {
  const [copied, setCopied] = useState(false);

  const copyName = () => {
    navigator.clipboard.writeText(meta.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={copyName}
    >
      <div className="flex items-center justify-center h-16 mb-3">
        <Component size={32} />
      </div>
      <div className="text-center">
        <p className="font-medium text-gray-900 text-sm">{meta.name}</p>
        <p className="text-xs text-gray-500 mt-1">{meta.category}</p>
        {copied && (
          <p className="text-xs text-green-600 mt-1">Copied!</p>
        )}
      </div>
    </div>
  );
}

function App() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [...new Set(icons.map((icon) => icon.meta.category))];

  const filteredIcons = icons.filter((icon) => {
    const matchesSearch =
      icon.meta.name.toLowerCase().includes(search.toLowerCase()) ||
      icon.meta.tags.some((tag) =>
        tag.toLowerCase().includes(search.toLowerCase())
      );
    const matchesCategory =
      !selectedCategory || icon.meta.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Icon Gallery</h1>
        <p className="text-gray-600">
          {icons.length} icons • Click to copy name
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedCategory
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredIcons.map((icon) => (
          <IconCard
            key={icon.meta.name}
            meta={icon.meta}
            Component={icon.Component}
          />
        ))}
      </div>

      {filteredIcons.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No icons found matching "{search}"
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
