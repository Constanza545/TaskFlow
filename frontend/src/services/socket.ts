import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket) return socket;
  socket = io(API_BASE_URL, {
    auth: { token },
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
