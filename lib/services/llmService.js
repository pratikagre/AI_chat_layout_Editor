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

export async function callLLM(systemPrompt, history, userMessage, originalLayout = { rootNodes: [], nodes: {} }) {
  if (!hasApiKey) {
    console.log("Mock LLM call with prompt:", userMessage);
    return {
      explanation: "I received your instruction, but no GEMINI_API_KEY is set in Vercel. This is a mock response.",
      updatedLayout: structuredClone(originalLayout)
    };
  }

  // Format history for Gemini API
  const geminiHistory = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  // Requirement 1: Improve the Gemini prompt to force strict JSON without markdown
  const strictInstructions = `
${systemPrompt}

CRITICAL RULES FOR YOUR RESPONSE:
1. Return ONLY valid JSON.
2. DO NOT include any markdown formatting.
3. DO NOT wrap the output in \`\`\`json blocks.
4. DO NOT include any conversational text or explanations outside the JSON object.
5. Use this exact response structure:
{
  "explanation": "short assistant message explaining the change",
  "updatedLayout": { ...full modified layout object here... }
}
`;

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "System Instructions: " + strictInstructions }]
      },
      {
        role: "model",
        parts: [{ text: "Understood. I will return only a raw, valid JSON object with the explanation and updatedLayout, without any markdown blocks or extra text." }]
      },
      ...geminiHistory
    ],
    // Requirement 6: Increase Gemini output token limit to avoid truncated JSON
    generationConfig: {
      temperature: 0.1, // Low temperature for consistent formatting
      maxOutputTokens: 8192, // Increased token limit
      // Note: We avoid responseSchema here to rely on the manual extraction logic requested
      responseMimeType: "application/json" 
    }
  });

  let rawText = "";

  try {
    const response = await chat.sendMessage(userMessage);
    rawText = response.response.text();
    
    // Requirement 4: Log raw Gemini response
    console.log("=== RAW GEMINI RESPONSE ===");
    console.log(rawText.substring(0, 300) + "...[truncated for logs]");
    
    // Requirement 2: Add safe JSON extraction logic (find first { and last })
    const firstBraceIndex = rawText.indexOf('{');
    const lastBraceIndex = rawText.lastIndexOf('}');
    
    if (firstBraceIndex === -1 || lastBraceIndex === -1 || lastBraceIndex < firstBraceIndex) {
      throw new Error("Could not locate valid JSON curly braces in response.");
    }
    
    // Slice the string safely
    const extractedJsonString = rawText.substring(firstBraceIndex, lastBraceIndex + 1);
    
    // Requirement 4: Log extracted JSON string
    console.log("=== EXTRACTED JSON STRING ===");
    console.log(extractedJsonString.substring(0, 300) + "...[truncated for logs]");

    // Requirement 2: Parse using standard JSON.parse()
    const parsedData = JSON.parse(extractedJsonString);
    
    // Return successfully parsed data
    return {
      explanation: parsedData.explanation || "Layout updated successfully.",
      updatedLayout: parsedData.updatedLayout || originalLayout
    };

  } catch (error) {
    // Requirement 3 & 4: Add proper try/catch and log parse errors
    console.error("=== LLM PARSE ERROR ===");
    console.error("Error Message:", error.message);
    console.error("Failed Raw Text:", rawText.substring(0, 500)); // Log part of the raw text for debugging

    // Requirement 5: If parsing fails, return fallback response
    return {
      explanation: "Failed to process layout update due to an AI formatting error.",
      updatedLayout: originalLayout // Return original layout unchanged
    };
  }
}
