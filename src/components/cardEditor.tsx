import React from "react";
import {
  AppUiProvider,
  Box,
  Columns,
  Rows,
  TypographyCard,
  TextInput,
  Button,
  Title,
  Text,
} from "@canva/app-ui-kit";
import "@canva/app-ui-kit/styles.css";

interface Card {
  title: string;
  description: string;
}

interface CardPageProps {
  cards: Card[];
}

export default function CardPage({ cards }: CardPageProps) {
  return (
    <AppUiProvider>
      {/* Full‐page wrapper using only documented Box props:
          background="page" and padding="2u" :contentReference[oaicite:6]{index=6} */}
      <Box background="page" padding="2u" display="flex" flexDirection="column">
        {/* Header row (spacing="2u") :contentReference[oaicite:7]{index=7} */}
        <Rows spacing="2u">
          <Title>Card Collection</Title>
        </Rows>

        {/* Spacer: empty Box with 2u padding on all sides :contentReference[oaicite:8]{index=8} */}
        <Box padding="2u" />

        {/* Cards grid using Columns (spacing="2u", wrap) :contentReference[oaicite:9]{index=9} */}
        <Rows spacing="2u">
          {cards.map((card, idx) => (
            // Each card container only uses Box‐props: background="canvas", padding="2u" :contentReference[oaicite:10]{index=10}
            <Box key={idx} background="canvas" padding="2u">
              <TypographyCard>
                <Text variant="bold" size="large">
                  {card.title}
                </Text>
                <Text size="medium">{card.description}</Text>
              </TypographyCard>
            </Box>
          ))}
        </Rows>

        {/* Spacer: empty Box with 2u padding :contentReference[oaicite:11]{index=11} */}
        <Box padding="2u" />

        {/* Controls row (spacing="2u", align="center") :contentReference[oaicite:12]{index=12} */}
        <Rows spacing="2u" align="center">
          <Button variant="primary">Add Card</Button>
          <TextInput placeholder="Enter your message…" />
          <Button variant="secondary">Send</Button>
        </Rows>
      </Box>
    </AppUiProvider>
  );
}
