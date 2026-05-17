import Anthropic from '@anthropic-ai/sdk';

// Let's use the provided API key or fallback to a dummy implementation if none exists
const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
let client;

if (hasApiKey) {
  client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
} else {
  console.warn("No ANTHROPIC_API_KEY provided. The agent will use a dummy fallback.");
}

export async function callLLM(systemPrompt, history, userMessage) {
  if (!hasApiKey) {
    // Dummy fallback for evaluation if the user hasn't set an API key yet
    console.log("Mock LLM call with prompt:", userMessage);
    
    // Very basic mock reasoning based on string matching
    const msg = userMessage.toLowerCase();
    
    // Extract the layout JSON from systemPrompt for mock modifications
    const layoutMatch = systemPrompt.match(/CURRENT LAYOUT:\s*(\{[\s\S]*?\})/);
    let layout;
    try {
      layout = layoutMatch ? JSON.parse(layoutMatch[1]) : {};
    } catch (e) {
      layout = {};
    }
    
    let explanation = "I received your instruction, but no API key is set. This is a mock response.";
    let updatedLayout = structuredClone(layout);
    
    return {
      explanation,
      updatedLayout
    };
  }

  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      ...history,
      { role: 'user', content: userMessage }
    ]
  });

  const text = response.content[0].text;
  
  // Try to extract JSON from the text, as LLMs might wrap it in markdown block
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse LLM response as JSON:", text);
    throw new Error("Invalid JSON returned by LLM");
  }
}
