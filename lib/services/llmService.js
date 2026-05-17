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
        parts: [{ text: "System Instructions: " + systemPrompt + "\nCRITICAL: All newlines inside JSON string values MUST be escaped as \\n. NEVER use literal newlines inside strings." }]
      },
      {
        role: "model",
        parts: [{ text: "Understood. I will strictly output valid JSON and escape all newlines as \\n." }]
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
    // Replace actual newlines with spaces to prevent unterminated string errors
    const noNewlinesText = text.replace(/[\r\n]+/g, ' ');
    const cleanText = noNewlinesText.replace(/,\s*([\}\]])/g, '$1');
    return JSON.parse(cleanText.trim());
  } catch (error) {
    console.error("Failed to parse LLM response as JSON:", text);
    try {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const cleanInner = jsonMatch[1].replace(/,\s*([\}\]])/g, '$1');
        return JSON.parse(cleanInner.trim());
      }
    } catch (e) {}
    throw new Error(`JSON Parse Error: ${error.message} | Raw text: ${text.substring(0, 150)}...`);
  }
}
