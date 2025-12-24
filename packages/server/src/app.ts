import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import guestRoutes from './routes/guests';
import eventRoutes from './routes/events';
import cardDesignRoutes from './routes/cardDesigns';
import invitationRoutes from './routes/invitations';
import paymentRoutes from './routes/payments';
import uploadRoutes from './routes/upload';
import accountRoutes from './routes/account';
import webhookRoutes from './routes/webhooks';
import path from 'path';

// Load environment variables
dotenv.config();

export const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
// For Twilio webhooks, we need to handle URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
app.use('/cards', express.static(path.join(process.cwd(), 'public', 'cards')));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (_req: Request, res: Response) => {
  res.json({ message: 'InviteMe API v1.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/events/:eventId/guests', guestRoutes);
app.use('/api/card-designs', cardDesignRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/webhooks', webhookRoutes);

