import React, { useState, useEffect } from "react";
import {
  Box,
  Rows,
  TextInput,
  Button,
  Title,
  Text,
  HorizontalCard,
} from "@canva/app-ui-kit";
import {
  getCurrentPageContext,
  addPage,
} from "@canva/design";
import type { ElementAtPoint } from "@canva/design";
import { Card, CardEditorProps, CardItemProps } from "../types";
import { streamCardElements } from "../utils/websocket";

/** Default thumbnail icon for edit mode */
const EDIT_THUMBNAIL_URL = "https://icons.veryicon.com/png/o/miscellaneous/linear-small-icon/edit-246.png";

/**
 * Individual editable card component
 */
function CardItem({ card, idx, setAllCards }: CardItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);

  const handleSave = () => {
    setIsEditing(false);
    setAllCards((prevCards) => {
      const newCards = [...prevCards];
      newCards[idx] = { title, description };
      return newCards;
    });
  };

  if (isEditing) {
    return (
      <Box background="canvas" padding="2u" display="flex" flexDirection="column">
        <Box padding="2u">
          <Rows spacing="1u">
            <TextInput
              value={title}
              onChange={(e) => setTitle(e)}
              placeholder="Card title"
            />
            <TextInput
              value={description}
              onChange={(e) => setDescription(e)}
              placeholder="Card description"
            />
            <Button variant="secondary" onClick={handleSave}>
              Save
            </Button>
          </Rows>
        </Box>
      </Box>
    );
  }

  return (
    <Box background="canvas" padding="2u" display="flex" flexDirection="column">
      <HorizontalCard
        ariaLabel={`Card: ${title}`}
        bottomEndVisibility="always"
        title={title}
        description={description}
        onClick={() => setIsEditing(true)}
        thumbnail={{
          alt: "Edit card",
          url: EDIT_THUMBNAIL_URL,
        }}
      />
    </Box>
  );
}

/**
 * Card Editor component for managing and generating presentation slides.
 *
 * Uses WebSocket streaming to receive elements in real-time, then
 * addPage() to atomically create each slide (page-switch safe).
 */
export default function CardEditor({ cards, setCards }: CardEditorProps) {
  const [localCards, setLocalCards] = useState<Card[]>([...cards]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  // Sync with parent when cards prop changes
  useEffect(() => {
    setLocalCards([...cards]);
  }, [cards]);

  /**
   * Generates all slides from the cards using WebSocket streaming + addPage()
   */
  async function handleConfirm(): Promise<void> {
    if (localCards.length === 0) {
      setError("No cards to generate. Add at least one card.");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setProgress("Starting generation...");

      // Sync local cards to parent state
      setCards(localCards);

      // Get page dimensions once (used for all cards)
      const pageContext = await getCurrentPageContext();

      if (!pageContext.dimensions) {
        setError("This design type does not have fixed dimensions (e.g. Whiteboard or Doc). Please use a presentation design.");
        return;
      }

      const pageDimensions = { dimensions: pageContext.dimensions };

      for (let i = 0; i < localCards.length; i++) {
        const card = localCards[i];
        setProgress(`Slide ${i + 1}/${localCards.length}: Connecting...`);

        // 1. Stream + buffer elements from WebSocket
        const elements = await streamCardElements(
          card,
          pageDimensions,
          (elementCount, status) => {
            setProgress(
              `Slide ${i + 1}/${localCards.length}: ${status} (${elementCount} elements)`
            );
          }
        );

        // 2. Atomically create page with all elements (page-switch safe!)
        setProgress(`Slide ${i + 1}/${localCards.length}: Adding to design...`);
        console.log(`Creating page ${i + 1} with ${elements.length} elements`);

        await addPage({
          elements: elements as ElementAtPoint[],
          title: card.title,
        });

        console.log(`Page ${i + 1} completed`);
      }

      setProgress(null);
    } catch (err) {
      console.error("Failed to generate presentation:", err);
      setError(
        err instanceof Error
          ? `Generation failed: ${err.message}`
          : "Failed to generate presentation. Please try again."
      );
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  }

  const handleAddCard = () => {
    setLocalCards([
      ...localCards,
      { title: "New Card", description: "New description..." },
    ]);
  };

  return (
    <Box background="page" padding="2u" display="flex" flexDirection="column">
      <Rows spacing="2u">
        <Title>Card Collection</Title>
      </Rows>

      <Box padding="1u" />

      {error && (
        <Box padding="1u" borderRadius="standard">
          <Text tone="critical">{error}</Text>
        </Box>
      )}

      {progress && (
        <Box padding="1u" borderRadius="standard">
          <Text>{progress}</Text>
        </Box>
      )}

      <Rows spacing="2u">
        {localCards.map((card, idx) => (
          <CardItem
            key={idx}
            card={card}
            idx={idx}
            setAllCards={setLocalCards}
          />
        ))}
      </Rows>

      <Box padding="1u" />

      <Rows spacing="2u" align="center">
        <Button variant="secondary" onClick={handleAddCard}>
          Add Card
        </Button>

        <Button
          variant="primary"
          onClick={handleConfirm}
          loading={isGenerating}
        >
          Confirm
        </Button>
      </Rows>
    </Box>
  );
}
