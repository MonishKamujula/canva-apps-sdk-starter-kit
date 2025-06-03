import React, { useState } from "react";
import {
  AppUiProvider,
  Box,
  Rows,
  TextInput,
  Button,
  Title,
  HorizontalCard,
} from "@canva/app-ui-kit";
import "@canva/app-ui-kit/styles.css";

interface Card {
  title: string;
  description: string;
}

interface CardPageProps {
  cards: Card[];
}

function Card({ key, card, idx, setAllCards }) {
  const [clicked, setClicked] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  return (
    <Box
      key={idx}
      background="canvas"
      padding="2u"
      display="flex"
      flexDirection="column"
    >
      {clicked ? (
        <Box padding="2u">
          <TextInput
            value={title}
            onChange={(e) => {
              setTitle(e);
            }}
          />
          <TextInput
            value={description}
            onChange={(e) => {
              setDescription(e);
            }}
          />
          <Button
            variant="secondary"
            onClick={() => {
              setClicked(!clicked);
              setAllCards((prevCards) => {
                const newCards = [...prevCards];
                newCards[idx] = { title, description };
                return newCards;
              });
            }}
          >
            Send
          </Button>
        </Box>
      ) : (
        <HorizontalCard
          ariaLabel={`Card: ${title}`}
          bottomEndVisibility="always"
          title={title}
          description={description}
          onClick={() => {
            setClicked(!clicked);
          }}
          thumbnail={{
            alt: "Thumbnail",
            url: "https://icons.veryicon.com/png/o/miscellaneous/linear-small-icon/edit-246.png",
          }}
        />
      )}
    </Box>
  );
}
export default function CardPage({ cards }: CardPageProps) {
  // Keep a local copy so that "Add Card" still works
  const [localCards, setLocalCards] = useState<Card[]>([...cards]);
  // eslint-disable-next-line no-console
  console.log(localCards);

  return (
    <AppUiProvider>
      {/* Full‐page wrapper using only documented Box props:
          background="page" and padding="2u" */}
      <Box background="page" padding="2u" display="flex" flexDirection="column">
        {/* Header row (spacing="2u") */}
        <Rows spacing="2u">
          <Title>Card Collection</Title>
        </Rows>

        {/* Spacer: empty Box with 2u padding on all sides */}
        <Box padding="1u" />

        {/* Cards grid: render each as a HorizontalCard */}
        <Rows spacing="2u">
          {localCards.map((card, idx) => (
            <Card key={idx} card={card} idx={idx} setAllCards={setLocalCards} />
          ))}
        </Rows>

        {/* Spacer: empty Box with 2u padding */}
        <Box padding="1u" />

        {/* Controls row (spacing="2u", align="center") */}
        <Rows spacing="2u" align="center">
          <Button
            variant="primary"
            onClick={() =>
              setLocalCards([
                ...localCards,
                { title: "New Card", description: "New description..." },
              ])
            }
          >
            Add Card
          </Button>

          <TextInput placeholder="Enter your message…" />

          <Button variant="secondary">Send</Button>
        </Rows>
      </Box>
    </AppUiProvider>
  );
}
