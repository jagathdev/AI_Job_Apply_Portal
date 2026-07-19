import express from 'express';
import path from 'path';
import 'dotenv/config';
import cors from 'cors';
import { connectDB } from './config/db.js';
import apiRouter from './routes/api.js';
import { errorHandler } from './middlewares/error.js';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // 1. Initialize MongoDB
  await connectDB();

  // 2. Middlewares
  app.use(cors({
    origin: ['http://localhost:5173', 'https://ai-job-apply-portal.vercel.app'],
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 3. Mount API Routes
  app.use('/api', apiRouter);

  // Health check
  app.get('/api-health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
  });

  // 4. Central Error Handling Middleware
  app.use(errorHandler as any);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Fatal Server Boot Error:', error);
});
