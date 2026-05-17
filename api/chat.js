import { callLLM } from '../lib/services/llmService.js';
import { validateLayout } from '../lib/utils/jsonValidator.js';
import { buildSystemPrompt } from '../lib/prompts/systemPrompt.js';
import cors from 'cors';

const corsMiddleware = cors();

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  await runMiddleware(req, res, corsMiddleware);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, layout, history } = req.body;

    if (!message || !layout) {
      return res.status(400).json({ error: 'Message and layout are required' });
    }

    validateLayout(layout);

    const systemPrompt = buildSystemPrompt(layout);
    
    const llmResponse = await callLLM(systemPrompt, history || [], message);
    
    let updatedLayout = llmResponse.updatedLayout || layout;
    validateLayout(updatedLayout);

    return res.status(200).json({
      updatedLayout,
      explanation: llmResponse.explanation || 'Layout updated.'
    });

  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ 
      error: 'An error occurred processing your request',
      details: error.message 
    });
  }
}
