import { useState } from 'react';
import axios from 'axios';
import initialLayout from '../data/initialLayout.json';

export function useLayoutAgent() {
  const [layout, setLayout] = useState(initialLayout);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am your layout transformation agent. Ask me to change the layout (e.g. "Convert this to 9:16").' }
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text) => {
    const newUserMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, newUserMsg]);
    setLoading(true);

    try {
      const { data } = await axios.post(
        import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/chat` : '/api/chat', 
        {
          message: text,
          layout,
          history: messages.slice(-6) // context
        }
      );

      setLayout(data.updatedLayout);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.explanation }
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Check your backend and API keys.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return { layout, messages, loading, sendMessage };
}
