import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import styled from "styled-components";

const socket = io("http://localhost:3000");

// 스타일 정의
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-family: 'Inter', sans-serif;
  background-color: #f4f4f4;
  color: #333;
`;

const Screen = styled.div`
  width: 90%;
  max-width: 600px;
  background: white;
  padding: 25px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  text-align: center;
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  margin: 10px 0;
  border: none;
  cursor: pointer;
  font-size: 18px;
  border-radius: 5px;
  transition: 0.3s;
  background: ${(props) => props.bg || "#007bff"};
  color: white;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
`;

const ChatBox = styled.div`
  height: 60vh;
  max-height: 500px;
  overflow-y: auto;
  background: #f0f2f5;
  padding: 10px;
  border-radius: 5px;
`;

const InputArea = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const Input = styled.input`
  flex-grow: 1;
  padding: 14px;
  font-size: 16px;
  border-radius: 5px;
  border: 1px solid #ccc;
`;

const Message = styled.div`
  padding: 12px;
  margin: 5px;
  border-radius: 10px;
  max-width: 80%;
  word-wrap: break-word;
  background: ${(props) => (props.type === "sent" ? "#007bff" : "#e2e2e2")};
  color: ${(props) => (props.type === "sent" ? "white" : "#333")};
  text-align: ${(props) => (props.type === "sent" ? "right" : "left")};
  margin-left: ${(props) => (props.type === "sent" ? "auto" : "0")};
`;

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
      setMessages([...messages, { text: input, type: "sent" }]);
      setInput("");
    }
  };

  const nextChat = () => {
    setMessages([]);
    setStatus("새로운 상대를 찾는 중...");
    socket.emit("find_new_partner");
  };

  return (
    <Container>
      {!inChat ? (
        <Screen>
          <h1>랜덤 채팅</h1>
          <Button onClick={startChat}>랜덤 채팅 시작</Button>
        </Screen>
      ) : (
        <Screen>
          <div className="status">{status}</div>
          <ChatBox ref={chatBoxRef}>
            {messages.map((msg, idx) => (
              <Message key={idx} type={msg.type}>
                {msg.text}
              </Message>
            ))}
          </ChatBox>
          <InputArea>
            <Input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="메시지를 입력하세요..." 
              onKeyPress={(e) => e.key === "Enter" && sendMessage()} 
            />
            <Button onClick={sendMessage}>전송</Button>
          </InputArea>
          <Button bg="#28a745" onClick={nextChat}>다음 상대</Button>
          <Button bg="#dc3545" onClick={() => setInChat(false)}>나가기</Button>
        </Screen>
      )}
    </Container>
  );
}

export default App;