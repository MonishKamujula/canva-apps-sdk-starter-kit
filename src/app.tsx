import { Button, Rows, Text } from "@canva/app-ui-kit";
import { requestOpenExternalUrl } from "@canva/platform";
import { useIntl } from "react-intl";
import * as styles from "styles/components.css";
import { useAddElement } from "utils/use_add_element";
import React from "react";

export const DOCS_URL = "https://www.canva.dev/docs/apps/";

export const App = () => {
  const addElement = useAddElement();
  const onClick = () => {
    addElement({
      type: "text",
      children: ["Hello world!"],
    });
  };

  const openExternalUrl = async (url: string) => {
    const response = await requestOpenExternalUrl({
      url,
    });

    if (response.status === "aborted") {
      // user decided not to navigate to the link
    }
  };

  const intl = useIntl();

  const [messages, setMessages] = React.useState([
    { user: "hello", system: "world" },
    { user: "hello", system: "world" },
    { user: "hello", system: "world" },
  ]);

  return (
    <div className={styles.scrollContainer}>
      <div className={styles.messageHistory}>
        {messages.map((message, index) => (
          <p
            key={index}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.5rem",
              borderBottom: "1px solid #ddd",
            }}
          >
            <span className={styles.system}>{message.system}</span>
            <span className={styles.user}>{message.user}</span>
          </p>
        ))}
      </div>
      <Rows spacing="2u">
        <Button variant="primary" onClick={onClick} stretch>
          {intl.formatMessage({
            defaultMessage: "Do something cool",
            description:
              "Button text to do something cool. Creates a new text element when pressed.",
          })}
        </Button>
        <Button variant="secondary" onClick={() => openExternalUrl(DOCS_URL)}>
          {intl.formatMessage({
            defaultMessage: "Open Canva Apps SDK docs",
            description:
              "Button text to open Canva Apps SDK docs. Opens an external URL when pressed.",
          })}
        </Button>
      </Rows>
    </div>
  );
};
