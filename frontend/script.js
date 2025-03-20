const ELEMENTS = {
  messages: document.getElementById('messages'),
  input: document.getElementById('input'),
  status: document.getElementById('status'),
  charCount: document.getElementById('char-count'),
  themeToggle: document.getElementById('theme-toggle'),
  sendBtn: document.getElementById('send-btn'),
  onlineCount: document.getElementById('online-count'),
};

const SOCKET_URL = 'https://zexchat.onrender.com'; // 배포 후 'https://zexchat-xxx.onrender.com'
const socket = io(SOCKET_URL);
let AES_KEY = null;
let typingTimeout;
let isScrolledUp = false;
let lastScrollTop = 0;

const scrollUpBtn = (() => {
  const btn = document.createElement('button');
  btn.id = 'scroll-up';
  btn.textContent = '↑';
  btn.onclick = () => {
    ELEMENTS.messages.scrollTop = lastScrollTop;
    btn.style.display = 'none';
  };
  ELEMENTS.messages.appendChild(btn);
  return btn;
})();

// 초기화 대기 상태 관리
let isInitialized = false;

socket.on('init', (data) => {
  AES_KEY = data.aesKey;
  isInitialized = true;
  console.log('AES Key initialized:', AES_KEY);
  ELEMENTS.status.textContent = "Connected to server. Ready to chat!";
});

socket.on('waiting', () => {
  ELEMENTS.status.textContent = "Finding an opponent...";
  ELEMENTS.status.classList.add('waiting', 'fade-in');
  setTimeout(() => ELEMENTS.status.classList.remove('fade-in'), 500);
  startWaitingTimeout();
});

socket.on('matched', (data) => {
  ELEMENTS.status.textContent = `Connected with ${data.partner}`;
  ELEMENTS.status.classList.add('fade-in', 'online');
  setTimeout(() => ELEMENTS.status.classList.remove('fade-in'), 500);
  ELEMENTS.messages.innerHTML = '';
  addMessage('Hello! Start chatting.', 'system');
});

socket.on('message', (data) => {
  if (!AES_KEY) {
    console.error('AES key not available for decryption');
    return;
  }
  const decrypted = CryptoJS.AES.decrypt(data.text, AES_KEY).toString(CryptoJS.enc.Utf8);
  addMessage(`<span class="nickname" style="color: ${data.color}">${data.sender}</span>: ${decrypted}`, data.id, 'them');
  socket.emit('read', data.id);
});

socket.on('messageSent', (msg) => {
  addMessage(`<span class="nickname">Me</span>: ${msg}`, socket.id, 'me');
});

socket.on('partnerStatus', (partnerStatus) => {
  const partnerName = ELEMENTS.status.textContent.replace('Connected with ', '').replace(' is typing', '').replace(' is offline', '');
  if (partnerStatus === 'typing') ELEMENTS.status.textContent = `${partnerName} is typing`;
  else if (partnerStatus === 'online') ELEMENTS.status.textContent = `Connected with ${partnerName}`;
  else if (partnerStatus === 'offline') ELEMENTS.status.textContent = `${partnerName} is offline`;
  ELEMENTS.status.classList.add('fade-in');
  setTimeout(() => ELEMENTS.status.classList.remove('fade-in'), 500);
});

socket.on('messageRead', (msgId) => {
  const messageDiv = document.querySelector(`[data-id="${msgId}"]`);
  if (messageDiv) messageDiv.innerHTML += ' <span style="color: #1e90ff;">✓✓</span>';
});

socket.on('disconnected', () => {
  ELEMENTS.status.textContent = "Your opponent has left.";
  ELEMENTS.status.classList.add('fade-in', 'offline');
  setTimeout(() => ELEMENTS.status.classList.remove('fade-in'), 500);
  addMessage('Would you like to find a new opponent? <button onclick="nextChat()">Find new opponent</button>', 'system');
});

socket.on('error', (err) => {
  console.error('Socket Error:', err);
  ELEMENTS.status.textContent = "Connection error. Please try again.";
});

socket.on('onlineCount', (count) => {
  ELEMENTS.onlineCount.textContent = `Online: ${count}`;
  console.log('Online count updated:', count);
});

function addMessage(msg, id, type) {
  if (!ELEMENTS.messages) return;
  const div = document.createElement('div');
  div.className = `message ${type} new`;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  div.innerHTML = `${msg} <span class="timestamp">${time}</span>`;
  if (id !== 'system') div.dataset.id = id;
  ELEMENTS.messages.appendChild(div);
  if (!isScrolledUp) ELEMENTS.messages.scrollTop = ELEMENTS.messages.scrollHeight;
  setTimeout(() => div.classList.remove('new'), 1000);
}

function sendMessage() {
  const msg = ELEMENTS.input.value.trim();
  if (!isInitialized || !AES_KEY) {
    console.error('AES key not initialized yet. Please wait.');
    ELEMENTS.status.textContent = "Waiting for encryption key...";
    return;
  }
  if (msg) {
    const encrypted = CryptoJS.AES.encrypt(msg, AES_KEY).toString();
    socket.emit('message', encrypted);
    ELEMENTS.input.value = '';
    ELEMENTS.charCount.textContent = '200';
    if (navigator.vibrate) navigator.vibrate([50, 50]);
  }
}

function handleTyping(event) {
  socket.emit('typing');
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => socket.emit('stopTyping'), 1000);
  ELEMENTS.charCount.textContent = 200 - ELEMENTS.input.value.length;
  ELEMENTS.input.style.height = 'auto';
  ELEMENTS.input.style.height = `${Math.min(ELEMENTS.input.scrollHeight, 100)}px`;
  if (event.key === 'Enter') {
    console.log('Enter key pressed');
    sendMessage();
  }
}

function nextChat() {
  socket.emit('next');
  ELEMENTS.messages.innerHTML = '';
}

function startWaitingTimeout() {
  setTimeout(() => {
    if (ELEMENTS.status.textContent === "Finding an opponent...") {
      ELEMENTS.status.textContent = "No opponents found. Try again?";
      addMessage('<button onclick="nextChat()">Retry</button>', 'system');
    }
  }, 30000);
}

ELEMENTS.messages.addEventListener('scroll', () => {
  isScrolledUp = ELEMENTS.messages.scrollTop + ELEMENTS.messages.clientHeight < ELEMENTS.messages.scrollHeight;
  if (isScrolledUp && ELEMENTS.messages.scrollTop !== 0) {
    lastScrollTop = ELEMENTS.messages.scrollTop;
    scrollUpBtn.style.display = 'block';
  } else {
    scrollUpBtn.style.display = 'none';
  }
});

ELEMENTS.input.addEventListener('focus', () => ELEMENTS.messages.style.height = '40vh');
ELEMENTS.input.addEventListener('blur', () => {
  ELEMENTS.messages.style.height = '50vh';
  ELEMENTS.input.style.height = '40px';
});

ELEMENTS.themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  ELEMENTS.themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});

if (ELEMENTS.status) ELEMENTS.status.insertAdjacentHTML('afterbegin', '<span id="status-bar"></span>');