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
