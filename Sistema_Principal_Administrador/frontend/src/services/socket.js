import { io } from 'socket.io-client';

const socket = io('http://localhost:3006', {
  transports: ['websocket', 'polling']
});

export default socket;
