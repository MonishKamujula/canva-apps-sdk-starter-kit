import { Button, Rows, TextInput } from "@canva/app-ui-kit";
import { useIntl } from "react-intl";
import * as styles from "styles/components.css";
import { useAddElement } from "utils/use_add_element";
import React, { useState } from "react";
import { nanoid } from "nanoid";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const DOCS_URL = "https://www.canva.dev/docs/apps/";

export const App = () => {
  const intl = useIntl();
  const addElement = useAddElement();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>(nanoid());

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newUserMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("YOUR_BACKEND_URL", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: input,
        }),
      });

      const data = await response.json();
      const assistantMessages: Message[] = data.messages;

      setMessages((prev) => [...prev, ...assistantMessages]);
    } catch (error) {
      alert("Error fetching chatbot response:");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className={styles.scrollContainer}>
      <div className={styles.messageHistory}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              padding: "0.5rem",
            }}
          >
            <div
              style={{
                background: msg.role === "user" ? "#007bff" : "#f0f0f0",
                color: msg.role === "user" ? "#fff" : "#000",
                borderRadius: "12px",
                padding: "10px",
                maxWidth: "75%",
                wordBreak: "break-word",
              }}
            >
              <code style={{ whiteSpace: "pre-wrap" }}>{msg.content}</code>
            </div>
          </div>
        ))}
        {loading && (
          <p style={{ textAlign: "center", color: "#888" }}>⏳ Thinking...</p>
        )}
      </div>

      <Rows spacing="2u">
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <TextInput
            type="text"
            value={input}
            onChange={(e) => setInput(e)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something..."
          />
          <Button variant="primary" onClick={sendMessage}>
            {intl.formatMessage({
              defaultMessage: "Send",
              description: "Chat send button",
            })}
          </Button>
        </div>

        <Button
          variant="tertiary"
          onClick={() =>
            addElement({
              type: "text",
              children: ["Hello world!"],
            })
          }
        >
          {intl.formatMessage({
            defaultMessage: "Add 'Hello World' Text",
            description: "Adds a sample text element to the design",
          })}
        </Button>
      </Rows>
    </div>
  );
};
