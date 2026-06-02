import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Import routes
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import guestRoutes from './routes/guests';
import ministryLeaderRoutes from './routes/ministryLeaders';
import seatingRoutes from './routes/seating';
import invitationRoutes from './routes/invitations';
import teamRoutes from './routes/team';
import checkInRoutes from './routes/checkIn';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';

// Import WebSocket handlers
import setupSocketHandlers from './socket/handlers';

const app: Express = express();
const server = http.createServer(app);

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logging
app.use(logger);

// Request validation middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.requestId = req.headers['x-request-id'] || `req-${Date.now()}`;
  next();
});

// ============================================
// SOCKET.IO CONFIGURATION
// ============================================

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Attach io to app for use in routes
app.locals.io = io;

// Setup WebSocket handlers
setupSocketHandlers(io);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/ministry-leaders', ministryLeaderRoutes);
app.use('/api/seating', seatingRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/check-in', checkInRoutes);

// ============================================
// 404 HANDLER
// ============================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║   Enterprise Event Management System - Backend         ║
║   وزارة التضامن الاجتماعي                             ║
║   الإدارة العامة للعلاقات العامة والمراسم            ║
╠════════════════════════════════════════════════════════╣
║   Server running on port: ${PORT}
║   Environment: ${process.env.NODE_ENV}
║   WebSocket: Active
╚════════════════════════════════════════════════════════╝
  `);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

// ============================================
// UNHANDLED PROMISE REJECTION
// ============================================

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

export { server, io };