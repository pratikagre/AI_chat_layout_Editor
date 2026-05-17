import { GoogleGenerativeAI } from '@google/generative-ai';

const hasApiKey = !!process.env.GEMINI_API_KEY;
let genAI;
let model;

if (hasApiKey) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
} else {
  console.warn("No GEMINI_API_KEY provided. The agent will use a dummy fallback.");
}

export async function callLLM(systemPrompt, history, userMessage) {
  if (!hasApiKey) {
    console.log("Mock LLM call with prompt:", userMessage);
    
    const layoutMatch = systemPrompt.match(/CURRENT LAYOUT:\s*(\{[\s\S]*?\})/);
    let layout;
    try {
      layout = layoutMatch ? JSON.parse(layoutMatch[1]) : {};
    } catch (e) {
      layout = {};
    }
    
    let explanation = "I received your instruction, but no GEMINI_API_KEY is set in Vercel. This is a mock response.";
    let updatedLayout = structuredClone(layout);
    
    return {
      explanation,
      updatedLayout
    };
  }

  // Format history for Gemini (user -> model -> user -> model)
  const geminiHistory = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "System Instructions: " + systemPrompt }]
      },
      {
        role: "model",
        parts: [{ text: "Understood. I will strictly follow these instructions and only output JSON." }]
      },
      ...geminiHistory
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096,
      responseMimeType: "application/json"
    }
  });

  const response = await chat.sendMessage(userMessage);
  const text = response.response.text();
  
  try {
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Failed to parse LLM response as JSON:", text);
    // Fallback: try to extract from markdown if it somehow ignored the mime type
    try {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) return JSON.parse(jsonMatch[1].trim());
    } catch (e) {}
    throw new Error(`Invalid JSON returned by Gemini API: ${text.substring(0, 100)}...`);
  }
}
