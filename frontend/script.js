// Socket.IO 연결
const socket = io({
  reconnectionAttempts: 5, // 재연결 시도 횟수 제한
  reconnectionDelay: 1000, // 재연결 대기 시간
});

// DOM 요소 참조
const elements = {
  mainScreen: document.getElementById("mainScreen"),
  chatScreen: document.getElementById("chatScreen"),
  chatBox: document.getElementById("chatBox"),
  messageInput: document.getElementById("messageInput"),
  sendMessage: document.getElementById("sendMessage"),
  startChat: document.getElementById("startChat"),
  nextChat: document.getElementById("nextChat"),
  exitChat: document.getElementById("exitChat"),
};

// 상태 관리
let isConnected = false;

// 유틸리티 함수
const addStatusMessage = (text) => {
  elements.chatBox.innerHTML += `<div class="status">${text}</div>`;
  elements.chatBox.scrollTop = elements.chatBox.scrollHeight;
};

const addMessage = (text, type) => {
  elements.chatBox.innerHTML += `<div class="message ${type}">${text}</div>`;
  elements.chatBox.scrollTop = elements.chatBox.scrollHeight;
};

const toggleScreen = (showMain = true) => {
  elements.mainScreen.classList.toggle("hidden", !showMain);
  elements.chatScreen.classList.toggle("hidden", showMain);
};

// 이벤트 리스너
elements.startChat.addEventListener("click", () => {
  toggleScreen(false);
  addStatusMessage("상대방을 찾는 중...");
  socket.emit("find_partner");
  elements.startChat.disabled = true; // 중복 클릭 방지
});

elements.sendMessage.addEventListener("click", () => {
  const message = elements.messageInput.value.trim();
  if (!message) {
    addStatusMessage("메시지를 입력해주세요.");
    return;
  }
  if (!isConnected) {
    addStatusMessage("상대방과 연결되지 않았습니다.");
    return;
  }
  addMessage(message, "sent");
  socket.emit("send_message", message);
  elements.messageInput.value = "";
});

elements.messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") elements.sendMessage.click();
});

elements.nextChat.addEventListener("click", () => {
  addStatusMessage("새로운 상대를 찾는 중...");
  socket.emit("find_new_partner");
  elements.nextChat.disabled = true; // 중복 클릭 방지
});

elements.exitChat.addEventListener("click", () => {
  toggleScreen(true);
  elements.chatBox.innerHTML = "";
  socket.emit("exit_chat");
  elements.startChat.disabled = false;
  elements.nextChat.disabled = false;
  isConnected = false;
});

// Socket.IO 이벤트 핸들러
socket.on("connect", () => {
  console.log("서버에 연결되었습니다.");
  addStatusMessage("서버에 연결되었습니다.");
});

socket.on("receive_message", (message) => {
  addMessage(message, "received");
});

socket.on("match_found", () => {
  addStatusMessage("상대방과 연결되었습니다.");
  isConnected = true;
  elements.nextChat.disabled = false;
});

socket.on("partner_disconnected", () => {
  addStatusMessage("상대방이 떠났습니다.");
  isConnected = false;
});

socket.on("error", (err) => {
  addStatusMessage(`오류: ${err.message || "알 수 없는 오류"}`);
});

socket.on("disconnect", () => {
  addStatusMessage("서버와의 연결이 끊어졌습니다.");
  isConnected = false;
  elements.startChat.disabled = false;
});

socket.on("reconnect", () => {
  addStatusMessage("서버에 다시 연결되었습니다.");
});