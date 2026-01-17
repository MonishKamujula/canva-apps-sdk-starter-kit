import { useState } from "react";
import {
  Box,
  Rows,
  Text,
  MultilineInput,
  Button,
} from "@canva/app-ui-kit";
import { createCards } from "../utils/api";
import { CreateCardsChatProps, AppView } from "../types";

export default function CreateCardsChat({
  setCards,
  setSessionId,
  setCurrentView,
}: CreateCardsChatProps) {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!inputValue.trim()) {
      setError("Please enter some text to generate cards.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await createCards(inputValue);
      setCards(result.cards);
      setSessionId(result.sessionId);
      setCurrentView(AppView.EDIT);
    } catch (err) {
      console.error("Failed to create cards:", err);
      setError("Failed to create cards. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box padding="2u">
      <Rows spacing="2u">
        <Text variant="bold">Instant PPT Generator</Text>
        <Text variant="regular">
          Enter your text here and click send to generate a PPT.
        </Text>
        
        {error && (
          <Box padding="1u" borderRadius="standard">
            <Text variant="regular" tone="critical">{error}</Text>
          </Box>
        )}
        
        <MultilineInput
          value={inputValue}
          onChange={(e) => setInputValue(e)}
          placeholder="Enter your text here"
          minRows={4}
        />
        
        <Button
          variant="primary"
          stretch
          onClick={handleSend}
          loading={loading}
        >
          Send
        </Button>
      </Rows>
    </Box>
  );
}
