// DOM 요소 캐싱
const ELEMENTS = {
  messages: document.getElementById('messages'),
  input: document.getElementById('input'),
  status: document.getElementById('status'),
  charCount: document.getElementById('char-count'),
  themeToggle: document.getElementById('theme-toggle'),
  sendBtn: document.getElementById('send-btn'),
  onlineCount: document.getElementById('online-count'),
};

// 전역 변수 초기화
const SOCKET_URL = 'https://zexchat-backend.onrender.com'; // Render 배포 URL
const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'], // WebSocket 우선
  pingInterval: 25000,
  pingTimeout: 5000,
});
let AES_KEY = null;
let isInitialized = false; // AES 키 초기화 상태
let typingTimeout = null; // 타이핑 타이머
let isScrolledUp = false; // 스크롤 상태
let lastScrollTop = 0; // 스크롤 위치 추적
const scrollUpBtn = document.createElement('button'); // 스크롤 업 버튼 동적 생성
scrollUpBtn.id = 'scroll-up-btn';
scrollUpBtn.textContent = '↑';
scrollUpBtn.style.display = 'none';
document.body.appendChild(scrollUpBtn);

// Web Crypto API로 암호화/복호화 함수
async function encryptMessage(message, key) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const keyBuffer = encoder.encode(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  return { iv: Array.from(iv), encrypted: Array.from(new Uint8Array(encrypted)) };
}

async function decryptMessage(encryptedData, key) {
  const decoder = new TextDecoder();
  const keyBuffer = new TextEncoder().encode(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(encryptedData.iv) },
    cryptoKey,
    new Uint8Array(encryptedData.encrypted)
  );
  return decoder.decode(decrypted);
}

// 소켓 연결 이벤트
socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
  ELEMENTS.status.textContent = "Connected to server...";
});

// AES 키 초기화
socket.on('init', (data) => {
  AES_KEY = data.aesKey;
  isInitialized = true; // 초기화 완료
  console.log('AES Key initialized:', AES_KEY);
  ELEMENTS.status.textContent = "Connected and ready to chat!";
});

// 대기 상태
socket.on('waiting', () => {
  ELEMENTS.status.textContent = "Finding an opponent...";
  ELEMENTS.status.classList.add('waiting', 'fade-in');
  setTimeout(() => ELEMENTS.status.classList.remove('fade-in'), 500);
  startWaitingTimeout();
});

// 매칭 성공
socket.on('matched', (data) => {
  ELEMENTS.status.textContent = `Connected with ${data.partner}`;
  ELEMENTS.status.classList.add('fade-in', 'online');
  setTimeout(() => ELEMENTS.status.classList.remove('fade-in'), 500);
  ELEMENTS.messages.innerHTML = '';
  addMessage('Hello! Start chatting.', 'system');
});

// 메시지 수신
socket.on('message', async (data) => {
  if (!AES_KEY) {
    console.error('AES key not available for decryption');
    return;
  }
  const decrypted = await decryptMessage(data, AES_KEY);
  addMessage(`<span class="nickname" style="color: ${data.color}">${data.sender}</span>: ${decrypted}`, data.id, 'them');
  socket.emit('read', data.id);
});

// 메시지 전송 확인
socket.on('messageSent', (msg) => {
  addMessage(`<span class="nickname">Me</span>: ${msg}`, socket.id, 'me');
});

// 상대방 상태 업데이트
socket.on('partnerStatus', (partnerStatus) => {
  const partnerName = ELEMENTS.status.textContent
    .replace('Connected with ', '')
    .replace(' is typing', '')
    .replace(' is offline', '');
  if (partnerStatus === 'typing') ELEMENTS.status.textContent = `${partnerName} is typing`;
  else if (partnerStatus === 'online') ELEMENTS.status.textContent = `Connected with ${partnerName}`;
  else if (partnerStatus === 'offline') ELEMENTS.status.textContent = `${partnerName} is offline`;
  ELEMENTS.status.classList.add('fade-in');
  setTimeout(() => ELEMENTS.status.classList.remove('fade-in'), 500);
});

// 메시지 읽음 확인
socket.on('messageRead', (msgId) => {
  const messageDiv = document.querySelector(`[data-id="${msgId}"]`);
  if (messageDiv) messageDiv.innerHTML += ' <span style="color: #1e90ff;">✓✓</span>';
});

// 상대방 연결 끊김
socket.on('disconnected', () => {
  ELEMENTS.status.textContent = "Your opponent has left.";
  ELEMENTS.status.classList.add('fade-in', 'offline');
  setTimeout(() => ELEMENTS.status.classList.remove('fade-in'), 500);
  addMessage('Would you like to find a new opponent? <button onclick="nextChat()">Find new opponent</button>', 'system');
});

// 소켓 에러
socket.on('error', (err) => {
  console.error('Socket Error:', err);
  ELEMENTS.status.textContent = "Connection error. Please try again.";
});

// 온라인 사용자 수 업데이트
socket.on('onlineCount', (count) => {
  ELEMENTS.onlineCount.textContent = `Online: ${count}`;
  console.log('Online count updated:', count);
});

// 메시지 추가 함수 (DOM 조작 최적화)
function addMessage(msg, id, type) {
  if (!ELEMENTS.messages) return;
  const div = document.createElement('div');
  div.className = `message ${type} new`;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  div.innerHTML = `${msg} <span class="timestamp">${time}</span>`;
  if (id !== 'system') div.dataset.id = id;

  requestAnimationFrame(() => {
    ELEMENTS.messages.appendChild(div);
    if (!isScrolledUp) ELEMENTS.messages.scrollTop = ELEMENTS.messages.scrollHeight;
    setTimeout(() => div.classList.remove('new'), 1000);
  });
}

// 메시지 전송 함수 (Web Crypto API 사용)
async function sendMessage() {
  const msg = ELEMENTS.input.value.trim();
  if (!isInitialized || !AES_KEY) {
    console.error('AES key not initialized yet. Please wait.');
    ELEMENTS.status.textContent = "Waiting for encryption key...";
    return;
  }
  if (msg) {
    const encryptedData = await encryptMessage(msg, AES_KEY);
    socket.emit('message', encryptedData);
    ELEMENTS.input.value = '';
    ELEMENTS.charCount.textContent = '200';
    if (navigator.vibrate) navigator.vibrate([50, 50]);
  }
}

// 타이핑 이벤트 처리
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

// 다음 채팅 요청
function nextChat() {
  socket.emit('next');
  ELEMENTS.messages.innerHTML = '';
}

// 대기 타임아웃
function startWaitingTimeout() {
  setTimeout(() => {
    if (ELEMENTS.status.textContent === "Finding an opponent...") {
      ELEMENTS.status.textContent = "No opponents found. Try again?";
      addMessage('<button onclick="nextChat()">Retry</button>', 'system');
    }
  }, 30000);
}

// 스크롤 이벤트 리스너
ELEMENTS.messages.addEventListener('scroll', () => {
  isScrolledUp = ELEMENTS.messages.scrollTop + ELEMENTS.messages.clientHeight < ELEMENTS.messages.scrollHeight;
  if (isScrolledUp && ELEMENTS.messages.scrollTop !== 0) {
    lastScrollTop = ELEMENTS.messages.scrollTop;
    scrollUpBtn.style.display = 'block';
  } else {
    scrollUpBtn.style.display = 'none';
  }
});

// 입력창 포커스 이벤트
ELEMENTS.input.addEventListener('focus', () => ELEMENTS.messages.style.height = '40vh');
ELEMENTS.input.addEventListener('blur', () => {
  ELEMENTS.messages.style.height = '50vh';
  ELEMENTS.input.style.height = '40px';
});

// 테마 토글
ELEMENTS.themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  ELEMENTS.themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});

// 상태 바 추가
if (ELEMENTS.status) ELEMENTS.status.insertAdjacentHTML('afterbegin', '<span id="status-bar"></span>');

// 스크롤 업 버튼 클릭 이벤트
scrollUpBtn.addEventListener('click', () => {
  ELEMENTS.messages.scrollTop = 0;
  scrollUpBtn.style.display = 'none';
});