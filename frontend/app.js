document.addEventListener("DOMContentLoaded", function () {
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-btn");
    const chatContainer = document.getElementById("chat-container"); // 채팅 표시할 영역

    sendButton.addEventListener("click", function () {
        sendMessage();
    });

    messageInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            sendMessage();
        }
    });

    function sendMessage() {
        const message = messageInput.value.trim();
        if (message === "") return; // 빈 메시지 방지

        displayMessage("You", message); // 화면에 메시지 표시
        sendToServer(message); // 서버로 전송

        messageInput.value = ""; // 입력창 초기화
    }

    function displayMessage(sender, text) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message");
        messageElement.innerHTML = `<strong>${sender}:</strong> ${text}`;
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight; // 최신 메시지로 스크롤 이동
    }

    function sendToServer(message) {
        fetch("/api/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: message })
        })
        .then(response => response.json())
        .then(data => console.log("서버 응답:", data))
        .catch(error => console.error("메시지 전송 오류:", error));
    }
});