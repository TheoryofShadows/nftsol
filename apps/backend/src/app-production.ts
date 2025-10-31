import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import securityMiddleware from './middleware/security';
import echoRouter from './routes/echo';
import { db } from './db';
import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(securityMiddleware);

// API
app.use('/api/echo', echoRouter);

// Health
app.get('/health', (_, res) => res.json({ ok: true, ts: Date.now() }));

// ───── Socket.io ─────
const server = http.createServer(app);

const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim());

const io = new SocketIOServer(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

if (process.env.REDIS_URL) {
  const pub = new Redis(process.env.REDIS_URL);
  const sub = pub.duplicate();
  io.adapter(createAdapter(pub, sub));
}

// make io globally reachable for services
(global as any).io = io;

io.on('connection', (socket) => {
  socket.on('joinEcho', (ledgerId: string) => {
    socket.join(`echo-room:${ledgerId}`);
  });
});

export { app, server, io };
