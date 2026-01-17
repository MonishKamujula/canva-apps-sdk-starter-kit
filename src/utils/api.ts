/**
 * API utility functions for backend communication
 */
import { CONFIG } from "../config";
import { Card } from "../types";

/**
 * Creates cards from user input via the backend API
 * @param userInput - The text input from the user
 * @param nCards - Number of cards to generate (default: 5)
 * @returns Promise resolving to the created cards
 */
export async function createCards(userInput: string, nCards: number = 5): Promise<{ cards: Card[]; sessionId: string }> {
  const sessionId = crypto.randomUUID();
  
  const response = await fetch(`${CONFIG.BACKEND_URL}/cards/create_cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      user_input: userInput,
      n_cards: nCards,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create cards: ${response.statusText}`);
  }

  const cards = await response.json();
  return { cards, sessionId };
}

/**
 * Generates presentation elements for a card
 * @param card - The card to generate presentation for
 * @param pageDimensions - Current page dimensions from Canva
 * @returns Promise resolving to presentation elements
 */
export async function generatePresentation(
  card: Card,
  pageDimensions: unknown
): Promise<Array<{ type: string; ref?: string; [key: string]: unknown }>> {
  const response = await fetch(
    `${CONFIG.BACKEND_URL}/presentation_maker/canva_request`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page_dimensions: pageDimensions,
        card,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to generate presentation: ${response.statusText}`);
  }

  return response.json();
}
