import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import chatRoute from '../lib/routes/chat.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Vercel routes this file to /api/chat based on its filename
app.use('/api/chat', chatRoute);
app.use('*', chatRoute); // Catch-all for safety

export default app;
