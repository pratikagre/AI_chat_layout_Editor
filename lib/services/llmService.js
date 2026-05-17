import OpenAI from 'openai';

const hasApiKey = !!process.env.OPENAI_API_KEY;
let openai;

if (hasApiKey) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else {
  console.warn("No OPENAI_API_KEY provided. The agent will use a dummy fallback.");
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
    
    let explanation = "I received your instruction, but no OPENAI_API_KEY is set in Vercel. This is a mock response.";
    let updatedLayout = structuredClone(layout);
    
    return {
      explanation,
      updatedLayout
    };
  }

  // Ensure system prompt is perfectly formatted for JSON mode
  const jsonSystemPrompt = systemPrompt + "\n\nYou MUST output a valid JSON object matching the requested schema. No markdown wrapping.";

  const openAiHistory = history.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content
  }));

  const messages = [
    { role: "system", content: jsonSystemPrompt },
    ...openAiHistory,
    { role: "user", content: userMessage }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 4096,
    });

    const text = response.choices[0].message.content;
    
    return JSON.parse(text);
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error(`OpenAI Error: ${error.message}`);
  }
}
