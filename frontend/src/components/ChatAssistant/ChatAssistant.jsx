import { useEffect, useRef, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { chatApi } from "../../services/api";
import "./ChatAssistant.css";

const INITIAL_SUGGESTIONS = [
  "Summarize the dashboard",
  "Which university needs attention?",
  "Show recent negative posts",
  "What are the top weak topics?",
];

function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: "Ask me about sentiment, topics, events, or university comparisons.",
    },
  ]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState(INITIAL_SUGGESTIONS);
  const [isSending, setIsSending] = useState(false);
  const messageListRef = useRef(null);

  useEffect(() => {
    if (!messageListRef.current) {
      return;
    }

    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages, isSending]);

  const sendMessage = async (message) => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    setIsOpen(true);
    setInput("");
    setIsSending(true);
    setMessages((currentMessages) => [
      ...currentMessages,
      { id: `user-${Date.now()}`, role: "user", content: trimmedMessage },
    ]);

    try {
      const response = await chatApi.send(trimmedMessage);

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.answer || "I could not find an answer for that yet.",
        },
      ]);
      setSuggestions(response.suggestions?.length ? response.suggestions : INITIAL_SUGGESTIONS);
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: error.message || "I could not reach the assistant right now.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <section className={`chat-assistant ${isOpen ? "is-open" : ""}`} aria-label="Ask UniPulse">
      {isOpen && (
        <div className="chat-panel">
          <header className="chat-header">
            <div>
              <span>
                <Bot size={16} />
              </span>
              <div>
                <h2>Ask UniPulse</h2>
                <p>Sentiment assistant</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close assistant">
              <X size={18} />
            </button>
          </header>

          <div className="chat-messages" ref={messageListRef}>
            {messages.map((message) => (
              <article className={`chat-message is-${message.role}`} key={message.id}>
                <p>{message.content}</p>
              </article>
            ))}
            {isSending && (
              <article className="chat-message is-assistant">
                <p>Checking the latest dashboard data...</p>
              </article>
            )}
          </div>

          <div className="chat-suggestions" aria-label="Suggested questions">
            {suggestions.map((suggestion) => (
              <button
                type="button"
                key={suggestion}
                onClick={() => sendMessage(suggestion)}
                disabled={isSending}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <form className="chat-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about sentiment..."
              disabled={isSending}
            />
            <button type="submit" aria-label="Send message" disabled={isSending || !input.trim()}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="chat-launcher"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        aria-label={isOpen ? "Close assistant" : "Open assistant"}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </section>
  );
}

export default ChatAssistant;
