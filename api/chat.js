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
    
    // Safety fallback: if LLM returned a string, parse it
    if (typeof updatedLayout === 'string') {
      try {
        updatedLayout = JSON.parse(updatedLayout);
      } catch (e) {
        console.error("Could not parse updatedLayout string");
      }
    }

    // Safety fallback: if LLM stripped rootNodes or imageUrl, restore them
    if (updatedLayout && typeof updatedLayout === 'object') {
      if (!updatedLayout.rootNodes) updatedLayout.rootNodes = layout.rootNodes;
      if (!updatedLayout.imageUrl) updatedLayout.imageUrl = layout.imageUrl;
      if (!updatedLayout.nodes) updatedLayout.nodes = layout.nodes;
    }

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
