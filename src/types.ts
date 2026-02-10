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

// ─── WebSocket Message Types (mirrors backend consumers.py protocol) ─────

/**
 * Element message streamed from backend
 */
export interface WsElementMessage {
  type: "element";
  index: number;
  data: CanvaElement;
}

/**
 * Completion message indicating all elements have been sent
 */
export interface WsCompleteMessage {
  type: "complete";
  total_elements: number;
}

/**
 * Error message from backend
 */
export interface WsErrorMessage {
  type: "error";
  message: string;
}

/**
 * Union of all WebSocket message types
 */
export type WsMessage = WsElementMessage | WsCompleteMessage | WsErrorMessage;

/**
 * Element shape from backend (matches Canva ElementAtPoint types).
 * Uses index signature for additional properties like fontStyle, decoration, etc.
 */
export interface CanvaElement {
  type: "text" | "image" | "embed" | "shape" | "video";
  ref?: string;
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  children?: string[];
  fontSize?: number;
  color?: string;
  textAlign?: string;
  fontWeight?: string;
  url?: string;
  [key: string]: unknown;
}

/**
 * Progress state for real-time streaming UI feedback
 */
export interface StreamProgress {
  cardIndex: number;
  totalCards: number;
  elementCount: number;
  status:
    | "connecting"
    | "streaming"
    | "uploading_images"
    | "adding_page"
    | "complete"
    | "error";
  message?: string;
}
