const socket = io();

const mainScreen = document.getElementById("mainScreen");
const chatScreen = document.getElementById("chatScreen");
const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendMessage = document.getElementById("sendMessage");
const startChat = document.getElementById("startChat");
const nextChat = document.getElementById("nextChat");
const exitChat = document.getElementById("exitChat");

startChat.addEventListener("click", () => {
  mainScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
  chatBox.innerHTML = `<div class="status">상대방을 찾는 중...</div>`;
  socket.emit("find_partner");
});

sendMessage.addEventListener("click", () => {
  const message = messageInput.value.trim();
  if (message) {
    chatBox.innerHTML += `<div class="message sent">${message}</div>`;
    socket.emit("send_message", message);
    messageInput.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

socket.on("receive_message", (message) => {
  chatBox.innerHTML += `<div class="message received">${message}</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on("match_found", () => {
  chatBox.innerHTML = `<div class="status">상대방과 연결되었습니다.</div>`;
});

socket.on("partner_disconnected", () => {
  chatBox.innerHTML += `<div class="status">상대방이 떠났습니다.</div>`;
});

nextChat.addEventListener("click", () => {
  chatBox.innerHTML = `<div class="status">새로운 상대를 찾는 중...</div>`;
  socket.emit("find_new_partner");
});

exitChat.addEventListener("click", () => {
  chatScreen.classList.add("hidden");
  mainScreen.classList.remove("hidden");
  chatBox.innerHTML = "";
  socket.emit("disconnect");
});