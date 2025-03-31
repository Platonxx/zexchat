import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./style.css"; // 스타일 분리

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

  const sendMessage = (e) => {
    e.preventDefault(); // Enter 키를 눌렀을 때도 동작하도록 변경
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
    <div className="container">
      {!inChat ? (
        <div className="mainScreen">
          <h1>랜덤 채팅</h1>
          <button onClick={startChat}>랜덤 채팅 시작</button>
        </div>
      ) : (
        <div className="chatScreen">
          <div className="status">{status}</div>
          <div className="chatBox" ref={chatBoxRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.type}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <form className="inputArea" onSubmit={sendMessage}>
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="메시지를 입력하세요..." 
            />
            <button type="submit">전송</button>
          </form>
          <div className="chatControls">
            <button onClick={nextChat}>다음 상대</button>
            <button onClick={() => setInChat(false)}>나가기</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;