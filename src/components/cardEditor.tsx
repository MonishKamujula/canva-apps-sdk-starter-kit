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
  // @ts-ignore
  openDesign, 
} from "@canva/design";
import { Card, CardEditorProps, CardItemProps, CanvaElement, DesignSession, PageRef, StreamProgress } from "../types";
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
 * Uses `openDesign` with `all_pages` context to stream elements to specific pages.
 * 
 * Strategy:
 * 1. Create blank pages for all cards upfront using `addPage`.
 * 2. Open a design session to target these pages.
 * 3. Stream elements to each page sequentially, syncing after each element.
 */
export default function CardEditor({ cards, setCards }: CardEditorProps) {
  const [localCards, setLocalCards] = useState<Card[]>([...cards]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [streamProgress, setStreamProgress] = useState<StreamProgress | null>(null);

  // Sync with parent when cards prop changes
  useEffect(() => {
    setLocalCards([...cards]);
  }, [cards]);

  /**
   * Generates all slides and streams content
   */
  async function handleConfirm(): Promise<void> {
    if (localCards.length === 0) {
      setError("No cards to generate. Add at least one card.");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setProgress("Preparing design...");
      setStreamProgress(null);

      setCards(localCards);

      // Get page dimensions once
      const pageContext = await getCurrentPageContext();
      if (!pageContext.dimensions) {
        setError("This design type does not have fixed dimensions (e.g. Whiteboard or Doc). Please use a presentation design.");
        return;
      }
      const pageDimensions = { dimensions: pageContext.dimensions };

      await openDesign({ type: "all_pages" }, async (session) => {
        const pages = session.pageRefs.toArray();

        for (let i = 0; i < localCards.length; i++) {
          const card = localCards[i];

          // Reuse existing page if available
          if (i < pages.length) {
            setProgress(`Updating existing page ${i + 1}/${localCards.length}...`);
            await session.helpers.openPage(pages[i], async (pageResult) => {
              // 1. Sync Title
              pageResult.page.title = card.title;

              // 2. Stream Elements (using page-specific addElement)
              await streamCardElements(
                card,
                pageDimensions,
                {
                  onElement: async (element: CanvaElement) => {
                    await pageResult.page.addElement(element);
                    await session.sync();
                  },
                  onProgress: (count, status) => {
                    setStreamProgress({
                      cardIndex: i,
                      totalCards: localCards.length,
                      elementCount: count,
                      status: status as any,
                    });
                  },
                  onError: (msg) => {
                    setStreamProgress((prev) =>
                      prev ? { ...prev, status: "error", message: msg } : null
                    );
                    setError(`Error on slide ${i + 1}: ${msg}`);
                  },
                }
              );
            });
          } else {
            // Create new page if needed (exceeds existing count)
            setProgress(`Creating new page ${i + 1}/${localCards.length}...`);
            await addPage({
              title: card.title,
            });

            // Stream Elements (using global addElementAtPoint for active page)
            await streamCardElements(
              card,
              pageDimensions,
              {
                onElement: async (element: CanvaElement) => {
                  await addElementAtPoint(element as ElementAtPoint);
                },
                onProgress: (count, status) => {
                  setStreamProgress({
                    cardIndex: i,
                    totalCards: localCards.length,
                    elementCount: count,
                    status: status as any,
                  });
                },
                onError: (msg) => {
                  setStreamProgress((prev) =>
                    prev ? { ...prev, status: "error", message: msg } : null
                  );
                  setError(`Error on slide ${i + 1}: ${msg}`);
                },
              }
            );
          }
        }
      });
      setProgress("Generation complete!");

    } catch (err) {
      console.error("Failed to generate:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(null), 3000);
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
