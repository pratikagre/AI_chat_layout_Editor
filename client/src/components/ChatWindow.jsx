import React from 'react';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ messages, loading }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-gray-50 border-b border-gray-200">
      {messages.map((msg, idx) => (
        <MessageBubble key={idx} role={msg.role} content={msg.content} />
      ))}
      {loading && (
        <div className="flex justify-start">
          <div className="bg-white border border-gray-200 text-gray-500 rounded-lg py-2 px-4 shadow-sm">
            Thinking...
          </div>
        </div>
      )}
    </div>
  );
}
