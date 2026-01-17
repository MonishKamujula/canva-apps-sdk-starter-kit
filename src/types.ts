/**
 * Shared TypeScript types for the Canva Apps SDK frontend
 */

/**
 * Represents a single card with title and description
 */
export interface Card {
  title: string;
  description: string;
}

/**
 * Navigation view states for the app
 */
export enum AppView {
  CREATE = "create",
  EDIT = "edit",
}

/**
 * Props for the CardEditor component
 */
export interface CardEditorProps {
  cards: Card[];
  setCards: (cards: Card[]) => void;
}

/**
 * Props for an individual Card component
 */
export interface CardItemProps {
  card: Card;
  idx: number;
  setAllCards: React.Dispatch<React.SetStateAction<Card[]>>;
}

/**
 * Props for the CreateCardsChat component
 */
export interface CreateCardsChatProps {
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
  setSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentView: React.Dispatch<React.SetStateAction<AppView>>;
}
