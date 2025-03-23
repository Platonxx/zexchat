document.addEventListener("DOMContentLoaded", function () {
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-btn");

    sendButton.addEventListener("click", function () {
        sendMessage();
    });

    // Enter 키로도 메시지 전송 가능하게 설정
    messageInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            sendMessage();
        }
    });

    function sendMessage() {
        const message = messageInput.value.trim();
        if (message === "") return; // 빈 메시지 방지

        console.log("메시지 전송됨:", message); // 메시지 로그 출력 (테스트용)
        
        // 🚀 실제 메시지 전송 로직 (서버 API 요청 or WebSocket)
        // sendToServer(message);

        // 입력창 비우기
        messageInput.value = "";
    }
});