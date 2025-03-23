document.addEventListener("DOMContentLoaded", function () {
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-btn");
    const chatContainer = document.getElementById("chat-container");
    const statusIndicator = document.getElementById("status"); // 연결 상태 표시

    let isSending = false; // 중복 전송 방지

    // ✅ WebSocket 연결 함수 (재연결 지원)
    function connectWebSocket() {
        const SOCKET_URL = "https://zexchat-backend.onrender.com";
        const socket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
            pingInterval: 25000,
            pingTimeout: 5000,
            reconnectionAttempts: 5, // 최대 5번 재연결 시도
            reconnectionDelay: 2000, // 재연결 시 2초 대기
        });

        // ✅ 연결 상태 업데이트
        socket.on("connect", () => {
            console.log("Connected to server:", socket.id);
            statusIndicator.textContent = "🟢 Connected";
        });

        socket.on("disconnect", () => {
            console.log("Disconnected from server");
            statusIndicator.textContent = "🔴 Disconnected";
        });

        socket.on("connect_error", (err) => {
            console.error("Connection error:", err);
            statusIndicator.textContent = "⚠️ Connection failed! Retrying...";
        });

        // ✅ 메시지 입력 및 전송
        sendButton.addEventListener("click", sendMessage);
        messageInput.addEventListener("keypress", function (event) {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault(); // 기본 엔터 입력 방지
                sendMessage();
            }
        });

        function sendMessage() {
            if (isSending) return; // 중복 전송 방지

            const message = messageInput.value.trim();
            if (message === "") return;

            isSending = true; // 전송 중 플래그 설정
            sendButton.disabled = true; // 버튼 비활성화

            displayMessage("You", message, "user-message");

            // ✅ WebSocket을 사용해 메시지 전송
            socket.emit("message", { text: message });

            messageInput.value = "";
            adjustTextareaHeight(); // 입력 후 높이 초기화

            setTimeout(() => {
                isSending = false; // 0.5초 후 전송 가능
                sendButton.disabled = false;
            }, 500);
        }

        function displayMessage(sender, text, className) {
            const messageElement = document.createElement("div");
            messageElement.classList.add("message", className);
            messageElement.innerHTML = `<strong>${sender}:</strong> ${text}`;
            chatContainer.appendChild(messageElement);
            chatContainer.scrollTop = chatContainer.scrollHeight; // 스크롤 자동 이동
        }

        // ✅ 서버에서 메시지 받기
        socket.on("message", (data) => {
            displayMessage("Partner", data.text, "partner-message");
        });

        // ✅ 입력창 자동 크기 조정
        messageInput.addEventListener("input", adjustTextareaHeight);

        function adjustTextareaHeight() {
            messageInput.style.height = "auto";
            messageInput.style.height = `${Math.min(messageInput.scrollHeight, 200)}px`; // 최대 높이 200px 증가
            messageInput.style.overflowY = messageInput.scrollHeight > 200 ? "scroll" : "hidden"; // 높이 초과 시 스크롤
        }
    }

    // ✅ WebSocket 연결 실행
    connectWebSocket();
});