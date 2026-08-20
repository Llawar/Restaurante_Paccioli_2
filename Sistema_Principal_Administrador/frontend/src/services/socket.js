import { io } from 'socket.io-client';

const HOST = window.location.hostname;
const API_URL = import.meta.env.VITE_API_URL || `http://${HOST}:3006/api`;

const socket = io(API_URL.replace('/api', ''), {
  transports: ['websocket', 'polling']
});

export default socket;
