import React from 'react';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import JsonViewer from './components/JsonViewer';
import WireframePreview from './components/WireframePreview';
import { useLayoutAgent } from './hooks/useLayoutAgent';

function App() {
  const { layout, messages, loading, sendMessage } = useLayoutAgent();

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Left Column: Chat UI */}
      <div className="w-1/3 min-w-[350px] flex flex-col bg-white border-r border-gray-200 shadow-md">
        <div className="p-4 bg-blue-600 text-white shadow-md z-10">
          <h1 className="text-xl font-bold">Layout Agent</h1>
          <p className="text-sm opacity-80">Chat to modify the design</p>
        </div>
        
        <ChatWindow messages={messages} loading={loading} />
        <ChatInput onSend={sendMessage} loading={loading} />
      </div>

      {/* Right Column: Preview & JSON */}
      <div className="w-2/3 flex flex-col p-6 overflow-y-auto gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Wireframe Preview</h2>
          <WireframePreview layout={layout} />
        </div>
        
        <div className="flex-1">
          <JsonViewer layout={layout} />
        </div>
      </div>
    </div>
  );
}

export default App;
