import { io } from 'socket.io-client';

const HOST = window.location.hostname;

const API_URL = import.meta.env.VITE_API_URL || `http://${HOST}:3006/api`;

const socket = io(API_URL.replace('/api', ''), {
  transports: ['websocket', 'polling']
});

/* No tocar
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `http://${HOST}:3006`;

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling']
});
*/

export default socket;
