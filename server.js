// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });

    // Handle snapshot request from teacher
    socket.on('requestSnapshot', () => {
        socket.broadcast.emit('takeSnapshot');
    });

    // Receive snapshot from student
    socket.on('snapshot', (data) => {
        // Send the snapshot data to the teacher
        io.emit('snapshotData', data);
    });
});

server.listen(3000, () => {
    console.log('Listening on port 3000');
});
