import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let connectionCount = 0;
let isConnecting = false;

export const getSocket = () => {
  if (!socket && !isConnecting) {
    isConnecting = true;
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001', {
      transports: ['websocket'], // Use only websocket for better performance
      reconnection: true,
      reconnectionAttempts: 2, // Reduced for faster fallback
      reconnectionDelay: 500, // Faster reconnection
      reconnectionDelayMax: 2000,
      timeout: 5000, // Connection timeout
      forceNew: false, // Reuse existing connection
    });
    
    socket.on('connect', () => {
      isConnecting = false;
    });
    
    socket.on('connect_error', () => {
      isConnecting = false;
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
    isConnecting = false;
  }
};

export const forceDisconnect = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    connectionCount = 0;
    isConnecting = false;
  }
};