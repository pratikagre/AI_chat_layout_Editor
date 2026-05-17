import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import chatRoute from './routes/chat.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/chat', chatRoute);

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'production' || process.env.RUN_LOCAL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
