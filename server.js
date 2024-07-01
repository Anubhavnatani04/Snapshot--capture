const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'student_database'
});

db.connect((err) => {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('connected as id ' + db.threadId);
});

const connectedStudents = {};

const updateTeacherStudentList = () => {
    const studentList = Object.values(connectedStudents).map(student => ({
        email: student.email,
        name: student.name
    }));
    io.emit('updateStudentList', studentList);
};

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        Object.keys(connectedStudents).forEach((key) => {
            if (connectedStudents[key].socketId === socket.id) {
                delete connectedStudents[key];
                updateTeacherStudentList();
            }
        });
    });

    socket.on('login', (data) => {
        const { email, password } = data;
        db.query('SELECT * FROM students WHERE email_id = ? AND password = ?', [email, password], (err, results) => {
            if (err) throw err;
            if (results.length > 0) {
                const student = results[0];
                const permissionGranted = student.permission === 1;
                connectedStudents[student.email_id] = { socketId: socket.id, email: student.email_id, name: `${student.first_name} ${student.last_name}` };
                socket.emit('loginResult', { success: true, permissionGranted, email: student.email_id, studentName: `${student.first_name} ${student.last_name}` });
                updateTeacherStudentList();
            } else {
                socket.emit('loginResult', { success: false });
            }
        });
    });

    socket.on('savePermission', (data) => {
        const { email } = data;
        db.query('UPDATE students SET permission = 1 WHERE email_id = ?', [email], (err) => {
            if (err) throw err;
            console.log(`Permission saved for ${email}`);
        });
    });

    socket.on('checkPermission', (data) => {
        const { email } = data;
        db.query('SELECT permission FROM students WHERE email_id = ?', [email], (err, results) => {
            if (err) throw err;
            if (results.length > 0 && results[0].permission === 1) {
                socket.emit('loginResult', { success: true, permissionGranted: true, email });
            }
        });
    });

    socket.on('requestSnapshot', (data) => {
        const { studentEmail } = data;
        const student = connectedStudents[studentEmail];
        if (student) {
            io.to(student.socketId).emit('takeSnapshot', { studentEmail });
        }
    });

    socket.on('snapshot', (data) => {
        io.emit('snapshotData', data);
    });
});

server.listen(3000, () => {
    console.log('Listening on port 3000');
});
