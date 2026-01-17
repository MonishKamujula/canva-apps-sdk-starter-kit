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
  addElementAtPoint,
  getCurrentPageContext,
  addPage,
} from "@canva/design";
import { Card, CardEditorProps, CardItemProps } from "../types";
import { uploadImage, delay } from "../utils/canva";
import { generatePresentation } from "../utils/api";

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
 * Card Editor component for managing and generating presentation slides
 */
export default function CardEditor({ cards, setCards }: CardEditorProps) {
  const [localCards, setLocalCards] = useState<Card[]>([...cards]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync with parent when cards prop changes
  useEffect(() => {
    setLocalCards([...cards]);
  }, [cards]);

  /**
   * Adds a single card as a new page in the Canva design
   */
  async function addCardToDesign(card: Card): Promise<void> {
    const currentDimensions = await getCurrentPageContext();
    const elements = await generatePresentation(card, currentDimensions);

    for (const element of elements) {
      console.log("Processing element:", element);
      // Upload images if needed
      if (element.type === "image" && element.ref) {
        console.log("Uploading image:", element.ref);
        const newRef = await uploadImage(element.ref);
        console.log("Upload complete, new ref:", newRef);
        element.ref = newRef;
      }
      console.log("Adding element to point:", element);
      await addElementAtPoint(element as Parameters<typeof addElementAtPoint>[0]);
    }
  }

  /**
   * Generates all slides from the cards
   */
  async function handleConfirm(): Promise<void> {
    if (localCards.length === 0) {
      setError("No cards to generate. Add at least one card.");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      // Sync local cards to parent state
      setCards(localCards);

      // Generate each card as a page
      for (let i = 0; i < localCards.length; i++) {
        await addCardToDesign(localCards[i]);
        console.log(`Page ${i + 1} completed`);

        // Add new page for subsequent cards
        if (i < localCards.length - 1) {
          await addPage();
          await delay(2000);
        }
      }
    } catch (err) {
      console.error("Failed to generate presentation:", err);
      setError("Failed to generate presentation. Please try again.");
    } finally {
      setIsGenerating(false);
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
