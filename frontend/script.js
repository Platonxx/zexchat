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
let typingTimeout = null; // 타이핑 타이머
let isScrolledUp = false; // 스크롤 상태
let lastScrollTop = 0; // 스크롤 위치 추적
const scrollUpBtn = document.createElement('button'); // 스크롤 업 버튼 동적 생성
scrollUpBtn.id = 'scroll-up-btn';
scrollUpBtn.textContent = '↑';
scrollUpBtn.style.display = 'none';
document.body.appendChild(scrollUpBtn);

// 메시지 버퍼링
let messageBuffer = [];
let isRendering = false;

// 소켓 연결 이벤트
socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
  ELEMENTS.status.textContent = "Connected to server...";
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
  console.log('Matched with:', data.partner);
  ELEMENTS.status.textContent = `Connected with ${data.partner}`;
  ELEMENTS.status.classList.add('fade-in', 'online');
  setTimeout(() => ELEMENTS.status.classList.remove('fade-in'), 500);
  ELEMENTS.messages.innerHTML = '';
  addMessage('Hello! Start chatting.', 'system');
});

// 메시지 수신
socket.on('message', (data) => {
  addMessage(`<span class="nickname" style="color: ${data.color}">${data.sender}</span>: ${data.text}`, data.id, 'them');
  socket.emit('read', data.id);
});

// 메시지 전송 확인 (로컬 표시로 대체하므로 불필요)
socket.on('messageSent', (msg) => {
  console.log('Message sent confirmed:', msg);
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
  console.log('Partner disconnected');
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

// 메시지 추가 함수 (버퍼링 적용)
function addMessage(msg, id, type) {
  messageBuffer.push({ msg, id, type });
  if (!isRendering) {
    renderMessages();
  }
}

function renderMessages() {
  isRendering = true;
  requestAnimationFrame(() => {
    while (messageBuffer.length > 0) {
      const { msg, id, type } = messageBuffer.shift();
      if (!ELEMENTS.messages) {
        console.error('ELEMENTS.messages is null');
        continue;
      }
      const div = document.createElement('div');
      div.className = `message ${type} new`;
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      div.innerHTML = `${msg} <span class="timestamp">${time}</span>`;
      if (id !== 'system') div.dataset.id = id;
      ELEMENTS.messages.appendChild(div);
      if (!isScrolledUp) ELEMENTS.messages.scrollTop = ELEMENTS.messages.scrollHeight;
      setTimeout(() => div.classList.remove('new'), 1000);
    }
    isRendering = false;
  });
}

// 메시지 전송 함수 (로컬 표시 추가)
function sendMessage() {
  const msg = ELEMENTS.input.value.trim();
  if (msg) {
    console.log('Sending message:', msg);
    // 로컬에서 즉시 표시
    addMessage(`<span class="nickname">Me</span>: ${msg}`, socket.id, 'me');
    socket.emit('message', msg);
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
  console.log('Requesting next chat');
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