require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://zexchat.onrender.com', // 프론트엔드 도메인 허용
    methods: ['GET', 'POST'],
  },
});
const AES_KEY = process.env.AES_KEY || 'fallback-key-123';
const PORT = process.env.PORT || 3000;

app.use(express.static('../frontend')); // 정적 파일 제공 (필요 시 수정)

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

  if (waitingUser) {
    socket.partner = waitingUser;
    waitingUser.partner = socket;
    socket.emit('matched', { msg: 'Connected with an opponent!', partner: waitingUser.nickname });
    waitingUser.emit('matched', { msg: 'Connected with an opponent!', partner: socket.nickname });
    socket.emit('partnerStatus', waitingUser.status);
    waitingUser.emit('partnerStatus', socket.status);
    waitingUser = null;
  } else {
    waitingUser = socket;
    socket.emit('waiting', 'Finding an opponent...');
  }

  socket.on('message', (encryptedMsg) => {
    if (socket.partner) {
      const decrypted = CryptoJS.AES.decrypt(encryptedMsg, AES_KEY).toString(CryptoJS.enc.Utf8);
      socket.partner.emit('message', { text: encryptedMsg, id: socket.id, sender: socket.nickname, color: socket.color });
      socket.emit('messageSent', decrypted);
    }
  });

  socket.on('typing', () => {
    if (socket.partner) {
      socket.status = 'typing';
      socket.partner.emit('partnerStatus', socket.status);
    }
  });

  socket.on('stopTyping', () => {
    if (socket.partner) {
      socket.status = 'online';
      socket.partner.emit('partnerStatus', socket.status);
    }
  });

  socket.on('read', (msgId) => {
    if (socket.partner) socket.partner.emit('messageRead', msgId);
  });

  socket.on('next', () => {
    if (socket.partner) {
      socket.partner.emit('disconnected', 'Your opponent ended the chat.');
      socket.partner.emit('partnerStatus', 'offline');
      socket.partner.partner = null;
      socket.partner = null;
    }
    if (waitingUser && waitingUser !== socket) {
      socket.partner = waitingUser;
      waitingUser.partner = socket;
      socket.emit('matched', { msg: 'Connected with a new opponent!', partner: waitingUser.nickname });
      waitingUser.emit('matched', { msg: 'Connected with a new opponent!', partner: socket.nickname });
      socket.emit('partnerStatus', waitingUser.status);
      waitingUser.emit('partnerStatus', socket.status);
      waitingUser = null;
    } else {
      waitingUser = socket;
      socket.emit('waiting', 'Finding an opponent...');
    }
  });

  socket.on('disconnect', () => {
    if (socket.partner) {
      socket.partner.emit('disconnected', 'Your opponent has left.');
      socket.partner.emit('partnerStatus', 'offline');
      socket.partner.partner = null;
    } else if (waitingUser === socket) {
      waitingUser = null;
    }
    console.log(`${socket.nickname} disconnected`);
    updateOnlineCount();
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});