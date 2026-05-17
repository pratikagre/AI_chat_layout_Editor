import { GoogleGenerativeAI } from '@google/generative-ai';
import JSON5 from 'json5';

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

  const strictInstructions = `
${systemPrompt}

CRITICAL JSON RULES:
1. Output ONLY valid JSON.
2. DO NOT output the full layout. You must only output the specific node properties that changed.
3. The expected output shape is:
{
  "explanation": "Short friendly message",
  "updatedNodes": {
    "node_id_here": {
      "style": { "visual": { "color": "red" } }
    }
  }
}
4. DO NOT use literal newlines inside string values.
5. You MUST output MINIFIED JSON.
`;

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "System Instructions: " + strictInstructions }]
      },
      {
        role: "model",
        parts: [{ text: "Understood. I will strictly output minified JSON with only the updatedNodes." }]
      },
      ...geminiHistory
    ],
    generationConfig: {
      temperature: 0.1, // Lowered temperature to make it more predictable
      maxOutputTokens: 8192,
      responseMimeType: "application/json"
    }
  });

  const response = await chat.sendMessage(userMessage);
  const text = response.response.text();
  
  try {
    const cleanText = text.replace(/,\s*([\}\]])/g, '$1');
    const parsed = JSON5.parse(cleanText.trim());
    
    // Extract original layout from system prompt to merge updates
    const layoutMatch = systemPrompt.match(/CURRENT LAYOUT:\s*(\{[\s\S]*?\})/);
    let finalLayout = layoutMatch ? JSON.parse(layoutMatch[1]) : { rootNodes: [], nodes: {} };
    
    if (parsed.updatedNodes && finalLayout.nodes) {
      for (const [nodeId, updates] of Object.entries(parsed.updatedNodes)) {
        if (finalLayout.nodes[nodeId]) {
          const node = finalLayout.nodes[nodeId];
          for (const [k, v] of Object.entries(updates)) {
            if (k === 'style' && typeof v === 'object' && node.style) {
              if (v.visual) node.style.visual = { ...node.style.visual, ...v.visual };
              if (v.layout) node.style.layout = { ...node.style.layout, ...v.layout };
              if (v.text) node.style.text = { ...node.style.text, ...v.text };
            } else {
              node[k] = v;
            }
          }
        }
      }
    }
    
    return {
      explanation: parsed.explanation || "Layout updated.",
      updatedLayout: parsed.updatedLayout || finalLayout
    };
  } catch (error) {
    console.error("Failed to parse LLM response as JSON:", text);
    try {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const cleanInner = jsonMatch[1].replace(/,\s*([\}\]])/g, '$1');
        return JSON5.parse(cleanInner.trim());
      }
    } catch (e) {}
    throw new Error(`JSON Parse Error: ${error.message} | Raw text: ${text.substring(0, 150)}...`);
  }
}
