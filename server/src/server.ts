import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes';
import applicationRoutes from './routes/applicationRoutes';
import aiRoutes from './routes/aiRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Job Tracker API is running' });
});

// ── Start server immediately so port is always open ───────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// ── Connect to MongoDB (non-fatal so server stays up for debugging) ───────────
mongoose
  .connect(process.env.MONGO_URI as string)
  .then((conn) => {
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    console.error('⚠️  API routes will fail until MONGO_URI is set correctly in server/.env');
  });

export default app;
