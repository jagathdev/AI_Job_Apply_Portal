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

  // 2. Middlewares - Read CORS allowed origins dynamically from environment variables
  const envOrigins = [
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
    process.env.ALLOWED_ORIGINS
  ];

  const allowedOrigins: string[] = envOrigins
    .filter((url): url is string => Boolean(url && url.trim()))
    .flatMap((url) => url.split(','))
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.length === 0 || allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  }));

  // Enable preflight for all routes
  app.options('*', cors() as any);

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
    console.log(`Server is running successfully on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Fatal Server Boot Error:', error);
});
