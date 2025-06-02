import {
  Box,
  Rows,
  FormField,
  TextInput,
  Button,
  Scrollable,
} from "@canva/app-ui-kit";
import { useIntl } from "react-intl";
import * as styles from "styles/components.css";
import {
  addElementAtPoint,
  getCurrentPageContext,
  addPage,
} from "@canva/design";
import { openDesign } from "@canva/design";
import React, { useState } from "react";
import { nanoid } from "nanoid";
import { upload } from "@canva/asset";
import axios from "axios";
import CardEditor from "./components/cardEditor";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const DOCS_URL = "https://www.canva.dev/docs/apps/";

export const App = () => {
  const intl = useIntl();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>(nanoid());
  const [debug, setDebug] = useState("");

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
  async function getImageFileType(imageUrl: string): Promise<string | null> {
    const response = await axios.get(imageUrl);
    const contentType = response.headers["content-type"];

    return contentType;
  }
  async function uploadImage(img_url) {
    const res = await upload({
      type: "image",
      url: img_url,
      mimeType: await getImageFileType(img_url),
      thumbnailUrl: img_url,
      aiDisclosure: "none",
    });
    await res.whenUploaded();
    return res.ref;
  }
  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  async function handleClick() {
    // Upload an image
    // addPage();

    const currentDimensions = await getCurrentPageContext();
    let currentPage = null;
    await openDesign({ type: "current_page" }, async (draft) => {
      // eslint-disable-next-line no-console
      console.log("Page: ", draft.page);

      if (draft.page === undefined) {
        currentPage = "NULL";
      }
      currentPage = draft.page;
    });
    let openDesignTimeout = 0;
    while (currentPage === null) {
      if (openDesignTimeout > 10) {
        openDesignTimeout = 0;
        break;
      } else {
        openDesignTimeout++;
        await delay(1000);
      }
    }
    // eslint-disable-next-line no-console
    console.log("Final Current Page", currentPage);
    const response = await fetch("http://127.0.0.1:5000/canvarequest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page_dimensions: currentDimensions,
        current_page: currentPage,
        user_input: input,
      }),
    });
    const data = await response.json();
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < data.length; i++) {
      const data_json = data[i];
      if (data_json.type === "image") {
        data_json.ref = await uploadImage(data_json.ref);
      }
      await addElementAtPoint(data_json);
    }
  }

  const cards_list = [
    {
      title: "Topic 1",
      description: "Description 1",
    },
    {
      title: "Title 2",
      description: "Description 2",
    },
    {
      title: "Title 3",
      description: "Description 3",
    },
    {
      title: "Title 4",
      description: "Description 4",
    },
    {
      title: "Title 5",
      description: "Description 5",
    },
  ];

  return <CardEditor cards={cards_list} />;
};
