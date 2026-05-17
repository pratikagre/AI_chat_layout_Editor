import React, { useState } from 'react';

export default function JsonViewer({ layout }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-gray-900 text-gray-300 p-4 rounded-lg overflow-hidden flex flex-col max-h-[500px]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-white">Layout JSON</h3>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
        >
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>
      {!collapsed && (
        <pre className="text-xs overflow-auto p-2 bg-gray-800 rounded flex-1">
          {JSON.stringify(layout, null, 2)}
        </pre>
      )}
    </div>
  );
}
