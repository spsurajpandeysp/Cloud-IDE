const http = require('http');
const express = require('express');
const { Server: SocketServer } = require('socket.io');
const os = require('os');
const pty = require('node-pty');

const app = express();
const server = http.createServer(app);

const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

// Initialize Socket.IO
const io = new SocketServer(server, {
    cors: {
        origin: "*", // Allow all origins (adjust as needed for security)
        methods: ["GET", "POST"]
    }
});

// Set up PTY (Pseudo Terminal)
const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.INIT_CWD || process.cwd(), // Fallback to current working directory
    env: process.env
});

// Listen for data from PTY and emit to client
ptyProcess.onData((data) => {
    io.emit('terminal:data', data);
});

// Handle client connections
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Write data to the PTY when received from the client
    socket.on('terminal:write', (data) => {
        ptyProcess.write(data);
    });
});

// Start the server
server.listen(9000, () => {
    console.log('Docker server running on port: 9000');
});
