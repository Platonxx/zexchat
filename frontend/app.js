import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

function App() {
  const [inChat, setInChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("랜덤 채팅 시작을 누르세요.");
  const chatBoxRef = useRef(null);

  useEffect(() => {
    socket.on("match_found", () => setStatus("상대방과 연결되었습니다."));
    socket.on("receive_message", (message) => {
      setMessages((prev) => [...prev, { text: message, type: "received" }]);
    });
    socket.on("partner_disconnected", () => setStatus("상대방이 떠났습니다."));

    return () => {
      socket.off("match_found");
      socket.off("receive_message");
      socket.off("partner_disconnected");
    };
  }, []);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const startChat = () => {
    setMessages([]);
    setStatus("상대방을 찾는 중...");
    setInChat(true);
    socket.emit("find_partner");
  };

  const sendMessage = () => {
    if (input.trim()) {
      socket.emit("send_message", input);
      setMessages((prev) => [...prev, { text: input, type: "sent" }]);
      setInput("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  const nextChat = () => {
    setMessages([]);
    setStatus("새로운 상대를 찾는 중...");
    socket.emit("find_new_partner");
  };

  return (
    <Container>
      {!inChat ? (
        <MainScreen>
          <h1>랜덤 채팅</h1>
          <Button onClick={startChat}>랜덤 채팅 시작</Button>
        </MainScreen>
      ) : (
        <ChatScreen>
          <Status>{status}</Status>
          <ChatBox ref={chatBoxRef}>
            {messages.map((msg, idx) => (
              <MessageContainer key={idx} type={msg.type}>
                <Message type={msg.type}>{msg.text}</Message>
              </MessageContainer>
            ))}
          </ChatBox>
          <InputArea>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="메시지를 입력하세요..."
            />
            <Button onClick={sendMessage}>전송</Button>
          </InputArea>
          <ChatControls>
            <Button onClick={nextChat} variant="green">다음 상대</Button>
            <Button onClick={() => setInChat(false)} variant="red">나가기</Button>
          </ChatControls>
        </ChatScreen>
      )}
    </Container>
  );
}

export default App;