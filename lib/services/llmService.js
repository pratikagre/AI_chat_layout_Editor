import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
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

export async function callLLM(systemPrompt, history, userMessage, originalLayout = { rootNodes: [], nodes: {} }) {
  if (!hasApiKey) {
    console.log("Mock LLM call with prompt:", userMessage);
    
    let explanation = "I received your instruction, but no GEMINI_API_KEY is set in Vercel. This is a mock response.";
    let updatedLayout = structuredClone(originalLayout);
    
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
      temperature: 0.1,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          explanation: {
            type: SchemaType.STRING,
            description: "A short, friendly explanation of the changes made"
          },
          updatedNodes: {
            type: SchemaType.OBJECT,
            description: "A dictionary where keys are node IDs and values are the updated property objects (e.g., style, text, etc.)"
          }
        },
        required: ["explanation", "updatedNodes"]
      }
    }
  });

  const response = await chat.sendMessage(userMessage);
  const text = response.response.text();
  
  try {
    let cleanText = text.trim();
    let parsed;
    
    // Smart dynamic auto-closing JSON parser to gracefully handle Gemini's early EOF truncation bug
    try {
      parsed = JSON5.parse(cleanText);
    } catch (err) {
      if (err.message.includes('end of input') || err.message.includes('Expected') || err.message.includes('invalid character')) {
        let t = cleanText.trim();
        
        // 1. Fix unclosed trailing string quotes
        let unescapedQuotes = 0;
        for (let i = 0; i < t.length; i++) {
          if (t[i] === '"' && (i === 0 || t[i-1] !== '\\')) {
            unescapedQuotes++;
          }
        }
        if (unescapedQuotes % 2 !== 0) {
          t += '"';
        }
        
        // 2. Build closing stack for braces and brackets
        let stack = [];
        let inString = false;
        for (let i = 0; i < t.length; i++) {
          if (t[i] === '"' && (i === 0 || t[i-1] !== '\\')) {
            inString = !inString;
          }
          if (!inString) {
            if (t[i] === '{') stack.push('}');
            if (t[i] === '[') stack.push(']');
            if (t[i] === '}') stack.pop();
            if (t[i] === ']') stack.pop();
          }
        }
        
        let closure = '';
        while (stack.length > 0) {
          closure += stack.pop();
        }
        
        try {
          parsed = JSON5.parse(t + closure);
          console.log("Dynamically auto-closed truncated JSON with:", closure);
        } catch (e) {
          // Absolute last-resort fallback endings
          let fixed = false;
          const endings = ['}', ']}', '}}', '}}}', '"]}', '""}', '"]}}', '"]}}}', '"}}', '"}}}', '"}}}}'];
          for (const end of endings) {
            try {
              parsed = JSON5.parse(t + end);
              fixed = true;
              console.log("Recovered truncated JSON with fallback ending:", end);
              break;
            } catch (e2) {}
          }
          if (!fixed) throw err;
        }
      } else {
        throw err;
      }
    }
    
    let finalLayout = structuredClone(originalLayout);
    
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
        return JSON5.parse(jsonMatch[1].trim());
      }
    } catch (e) {}
    throw new Error(`JSON Parse Error: ${error.message} | Raw text: ${text.substring(0, 150)}...`);
  }
}
