# Screen Snapshot Application

This application allows a teacher to capture a snapshot of a student's screen. It is designed for controlled educational environments where proper consent has been obtained from all participants.

## Prerequisites

- Node.js (v12.x or higher)
- NPM (comes with Node.js)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/screen-snapshot-app.git
   cd screen-snapshot-app
   ```

2. Install the required dependencies:
   ```bash
   npm install
   ```

## Directory Structure

```
screen-snapshot-app/
├── public/
│   ├── teacher.html
│   └── student.html
├── server.js
└── README.md
```

- `public/teacher.html`: Teacher's interface.
- `public/student.html`: Student's interface.
- `server.js`: Node.js server setup.

## Setup and Running the Application

1. **Start the server:**
   ```bash
   node server.js
   ```

2. **Access the teacher and student pages:**

   - Open a web browser and go to `http://localhost:3000/teacher.html` for the teacher's interface.
   - Open a separate web browser or incognito window and go to `http://localhost:3000/student.html` for the student's interface.

## Important Considerations

- **Privacy and Consent:** Ensure students are aware of and consent to screen capture.
- **Security:** Handle data securely to avoid misuse.
- **Legal Compliance:** Comply with local laws and regulations regarding privacy and monitoring.

## Acknowledgements

- Socket.IO for real-time communication.
- WebRTC for screen capturing.
