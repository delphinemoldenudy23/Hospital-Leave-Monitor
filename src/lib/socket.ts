import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let connectionCount = 0;

export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001', {
      transports: ['websocket'], // Use only websocket for better performance
      reconnection: true,
      reconnectionAttempts: 3, // Reduced from 5 to 3
      reconnectionDelay: 1000,
      forceNew: false, // Reuse existing connection
    });
  }
  connectionCount++;
  return socket;
};

export const disconnectSocket = () => {
  connectionCount--;
  if (connectionCount <= 0 && socket) {
    socket.disconnect();
    socket = null;
    connectionCount = 0;
  }
};

export const forceDisconnect = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    connectionCount = 0;
  }
};