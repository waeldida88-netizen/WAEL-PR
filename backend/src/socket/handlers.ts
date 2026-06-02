import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '../index';

const setupSocketHandlers = (io: SocketIOServer) => {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // ============================================
    // SEATING UPDATES
    // ============================================

    socket.on('join-event', (eventId: string) => {
      socket.join(`event-${eventId}`);
      console.log(`Client ${socket.id} joined event-${eventId}`);
    });

    socket.on('leave-event', (eventId: string) => {
      socket.leave(`event-${eventId}`);
      console.log(`Client ${socket.id} left event-${eventId}`);
    });

    socket.on('seating-layout-updated', (data) => {
      io.to(`event-${data.eventId}`).emit('seating-layout-updated', data);
    });

    // ============================================
    // REAL-TIME GUEST CHECK-IN
    // ============================================

    socket.on('guest-checked-in', (data) => {
      io.to(`event-${data.eventId}`).emit('guest-checked-in-live', {
        guestName: data.guestName,
        chairNumber: data.chairNumber,
        timestamp: new Date(),
        status: 'CHECKED_IN'
      });
    });

    // ============================================
    // REAL-TIME NOTIFICATIONS
    // ============================================

    socket.on('notify-team', (data) => {
      io.emit('team-notification', {
        message: data.message,
        type: data.type,
        timestamp: new Date()
      });
    });

    // ============================================
    // DISCONNECT
    // ============================================

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

export default setupSocketHandlers;