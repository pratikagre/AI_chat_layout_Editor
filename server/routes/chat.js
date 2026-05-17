import express from 'express';
import { callLLM } from '../services/llmService.js';
import { validateLayout } from '../utils/jsonValidator.js';
import { buildSystemPrompt } from '../prompts/systemPrompt.js';
import { resizeArtboard, moveNode, resizeNode, changeColor } from '../services/layoutTransforms.js';

const router = express.Router();

router.post('*', async (req, res) => {
  try {
    const { message, layout, history } = req.body;

    if (!message || !layout) {
      return res.status(400).json({ error: 'Message and layout are required' });
    }

    validateLayout(layout);

    const systemPrompt = buildSystemPrompt(layout);
    
    // Call LLM
    const llmResponse = await callLLM(systemPrompt, history || [], message);
    
    let updatedLayout = llmResponse.updatedLayout || layout;
    
    // Validate returned layout
    validateLayout(updatedLayout);

    res.json({
      updatedLayout,
      explanation: llmResponse.explanation || 'Layout updated.'
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'An error occurred processing your request',
      details: error.message 
    });
  }
});

export default router;
