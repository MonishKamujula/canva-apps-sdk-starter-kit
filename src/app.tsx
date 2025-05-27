import { Button, Rows, TextInput } from "@canva/app-ui-kit";
import { useIntl } from "react-intl";
import * as styles from "styles/components.css";
import { useAddElement } from "utils/use_add_element";
import { addElementAtPoint, getCurrentPageContext } from "@canva/design";
import React, { useState } from "react";
import { nanoid } from "nanoid";
import { upload } from "@canva/asset";

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
      const response = await fetch(
        "https://mp6pysekt2hxl46zto2ucvs5ky0pfusj.lambda-url.ap-south-1.on.aws/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            message: input,
          }),
        },
      );

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

  async function uploadImage(img_url) {
    const res = await upload({
      type: "image",
      url: img_url,
      mimeType: "image/jpeg",
      thumbnailUrl: img_url,
      aiDisclosure: "none",
    });
    await res.whenUploaded();
    return res.ref;
  }
  async function handleClick() {
    // Upload an image
    const response = await fetch("http://127.0.0.1:5000/canvarequest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_input: input,
        page_dimensions: getCurrentPageContext(),
      }),
    });
    const data = await response.json();
    alert(data);
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < data.length; i++) {
      const data_json = data[i];
      if (data_json.type === "image") {
        data_json.ref = await uploadImage(data_json.ref);
      }
      await addElementAtPoint(data_json);
    }

    // const imageUrl =
    //   "https://images.pexels.com/photos/32248966/pexels-photo-32248966.jpeg";
    // const mimeType = "image/jpeg";
    // const thumbnailUrl = imageUrl;

    // const { ref, whenUploaded } = await upload({
    //   type: "image",
    //   url: imageUrl,
    //   mimeType,
    //   thumbnailUrl,
    //   aiDisclosure: "none",
    // });

    // await whenUploaded();

    // await addElementAtPoint({
    //   type: "image",
    //   top: 0,
    //   left: 0,
    //   width: 200,
    //   height: 150,
    //   altText: {
    //     text: "hello world",
    //     decorative: false,
    //   },
    //   ref,
    // });
  }

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

        <Button variant="tertiary" onClick={handleClick}>
          {intl.formatMessage({
            defaultMessage: "Add 'Hello World' Text",
            description: "Adds a sample text element to the design",
          })}
        </Button>
      </Rows>
    </div>
  );
};
