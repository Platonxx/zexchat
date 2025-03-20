require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const crypto = require('crypto'); // Node.js crypto 모듈

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

const AES_KEY = process.env.AES_KEY || 'fallback-key-123';
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Zexchat Backend Running');
});

async function decryptMessage(encryptedData, key) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key),
    Buffer.from(encryptedData.iv)
  );
  let decrypted = decipher.update(Buffer.from(encryptedData.encrypted));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

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

  socket.on('message', async (encryptedData) => {
    if (socket.partner) {
      const decrypted = await decryptMessage(encryptedData, AES_KEY);
      socket.partner.emit('message', {
        text: encryptedData,
        sender: socket.nickname,
        color: socket.color,
        id: socket.id,
      });
      socket.emit('messageSent', decrypted);
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