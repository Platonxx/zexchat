document.addEventListener("DOMContentLoaded", function () {
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-btn");
    const chatContainer = document.getElementById("chat-container");

    sendButton.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            sendMessage();
        }
    });

    function sendMessage() {
        const message = messageInput.value.trim();
        if (message === "") return;

        displayMessage("You", message, "user-message");
        sendToServer(message);

        messageInput.value = "";
    }

    function displayMessage(sender, text, className) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message", className);
        messageElement.innerHTML = `<strong>${sender}:</strong> ${text}`;
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
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