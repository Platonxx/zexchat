require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: 'https://zexchat.onrender.com',
  methods: ['GET', 'POST'],
  credentials: true,
}));

const io = new Server(server, {
  cors: {
    origin: 'https://zexchat.onrender.com',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Zexchat Backend Running');
});

let waitingUser = null;

function updateOnlineCount() {
  const onlineCount = io.sockets.sockets.size;
  io.emit('onlineCount', onlineCount);
}

io.on('connection', (socket) => {
  socket.nickname = `Stranger${Math.floor(Math.random() * 1000)}`;
  socket.color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  socket.status = 'online';
  console.log(`${socket.nickname} connected`);
  updateOnlineCount();

  if (!waitingUser) {
    waitingUser = socket;
    socket.emit('waiting');
  } else {
    const partner = waitingUser;
    waitingUser = null;
    socket.partner = partner;
    partner.partner = socket;
    socket.emit('matched', { partner: partner.nickname });
    partner.emit('matched', { partner: socket.nickname });
  }

  socket.on('message', (msg) => {
    if (socket.partner) {
      socket.partner.emit('message', {
        text: msg,
        sender: socket.nickname,
        color: socket.color,
        id: socket.id,
      });
      socket.emit('messageSent', msg);
    } else {
      console.log('No partner found for', socket.nickname);
    }
  });

  socket.on('typing', () => {
    if (socket.partner) socket.partner.emit('partnerStatus', 'typing');
  });

  socket.on('stopTyping', () => {
    if (socket.partner) socket.partner.emit('partnerStatus', 'online');
  });

  socket.on('read', (msgId) => {
    if (socket.partner) socket.partner.emit('messageRead', msgId);
  });

  socket.on('next', () => {
    if (socket.partner) {
      socket.partner.emit('disconnected');
      socket.partner.partner = null;
      socket.partner = null;
    }
    if (!waitingUser) {
      waitingUser = socket;
      socket.emit('waiting');
    } else {
      const partner = waitingUser;
      waitingUser = null;
      socket.partner = partner;
      partner.partner = socket;
      socket.emit('matched', { partner: partner.nickname });
      partner.emit('matched', { partner: socket.nickname });
    }
  });

  socket.on('disconnect', () => {
    console.log(`${socket.nickname} disconnected`);
    if (socket === waitingUser) waitingUser = null;
    if (socket.partner) {
      socket.partner.emit('disconnected');
      socket.partner.partner = null;
      socket.partner = null;
    }
    updateOnlineCount();
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});