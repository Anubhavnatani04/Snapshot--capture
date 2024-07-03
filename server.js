const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const sharp = require('sharp');
const robot = require('robotjs');

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

const isEntireScreen = async (screenshotBuffer, scalingFactor) => {
    const screenshot = await sharp(screenshotBuffer).metadata();
    const screenSize = robot.getScreenSize();
    const screenWidth = screenSize.width * scalingFactor;
    const screenHeight = screenSize.height * scalingFactor;

    // Allow a small tolerance (e.g., 5 pixels)
    const tolerance = 5;

    const widthMatches = Math.abs(screenshot.width - screenWidth) <= tolerance;
    const heightMatches = Math.abs(screenshot.height - screenHeight) <= tolerance;

    console.log(`Screenshot Dimensions: ${screenshot.width}x${screenshot.height}`);
    console.log(`Screen Dimensions (Adjusted): ${screenWidth}x${screenHeight}`);
    console.log(`Width Matches: ${widthMatches}, Height Matches: ${heightMatches}`);

    return widthMatches && heightMatches;
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

    socket.on('initialScreenshot', async (data) => {
        const { email, dataUrl, scalingFactor } = data;
        const screenshotBuffer = Buffer.from(dataUrl.split(',')[1], 'base64');
        const isFullScreen = await isEntireScreen(screenshotBuffer, scalingFactor);

        if (isFullScreen) {
            socket.emit('initialScreenshotResult', { success: true });
        } else {
            socket.emit('initialScreenshotResult', { success: false });
        }
    });

    socket.on('screenSharingStopped', (data) => {
        const { email } = data;
        if (connectedStudents[email]) {
            delete connectedStudents[email];
            socket.disconnect(true); // Force disconnect the client
            updateTeacherStudentList();
            console.log(`Student ${email} logged out due to stopping screen sharing`);
        }
    });
});

server.listen(3000, () => {
    console.log('Listening on port 3000');
});
