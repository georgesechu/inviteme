import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import guestRoutes from './routes/guests';
import cardDesignRoutes from './routes/cardDesigns';
import invitationRoutes from './routes/invitations';
import paymentRoutes from './routes/payments';

// Load environment variables
dotenv.config();

export const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (_req: Request, res: Response) => {
  res.json({ message: 'InviteMe API v1.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/card-designs', cardDesignRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/payments', paymentRoutes);

