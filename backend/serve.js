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
let waitingUser = null;

app.get('/', (req, res) => {
  res.send('Zexchat Backend Running');
});

function updateOnlineCount() {
  const onlineCount = io.sockets.sockets.size;
  io.emit('onlineCount', onlineCount);
}

io.on('connection', (socket) => {
  socket.nickname = `Stranger${Math.floor(Math.random() * 1000)}`;
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

    socket.emit('match_found');
    partner.emit('match_found');
  }

  socket.on('send_message', (msg) => {
    if (socket.partner) {
      socket.partner.emit('receive_message', { text: msg, sender: socket.nickname });
      socket.emit('messageSent', msg);
    }
  });

  socket.on('next', () => {
    if (socket.partner) {
      socket.partner.emit('partner_disconnected');
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

      socket.emit('match_found');
      partner.emit('match_found');
    }
  });

  socket.on('disconnect', () => {
    console.log(`${socket.nickname} disconnected`);
    if (socket === waitingUser) waitingUser = null;
    if (socket.partner) {
      socket.partner.emit('partner_disconnected');
      socket.partner.partner = null;
      socket.partner = null;
    }
    updateOnlineCount();
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});