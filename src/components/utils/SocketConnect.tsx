import io from 'socket.io-client';
const socket = io('wss://wss.betmundial.com/socket-io', {
    transports: ['websocket'],
    pingInterval: 1000,
    pingTimeOut: 3000,
    reconnection: true,
    upgradeTimeout: 1000,
    EIO: 4,
    reconnectionAttempts: Infinity, // retry indefinitely
    reconnectionDelay: 1000,        // initial delay between reconnections
    reconnectionDelayMax: 3000     // maximum delay between reconnections
});



export default socket;