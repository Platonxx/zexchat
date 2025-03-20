require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors'); // CORS 패키지 추가

const app = express();
const server = http.createServer(app);

// Express에 CORS 미들웨어 추가
app.use(cors({
  origin: 'https://zexchat.onrender.com', // 프론트엔드 도메인 허용
  methods: ['GET', 'POST'],
  credentials: true, // 필요 시
}));

// Socket.IO에 CORS 설정
const io = new Server(server, {
  cors: {
    origin: 'https://zexchat.onrender.com',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const AES_KEY = process.env.AES_KEY || 'fallback-key-123';
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
  console.log('AES_KEY:', AES_KEY);
  socket.emit('init', { aesKey: AES_KEY });
  console.log('Sent AES key to client:', socket.id);

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

  socket.on('message', (encrypted) => {
    if (socket.partner) {
      socket.partner.emit('message', {
        text: encrypted,
        sender: socket.nickname,
        color: socket.color,
        id: socket.id,
      });
      socket.emit('messageSent', CryptoJS.AES.decrypt(encrypted, AES_KEY).toString(CryptoJS.enc.Utf8));
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