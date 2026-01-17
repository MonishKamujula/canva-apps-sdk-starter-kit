import { useState } from "react";
import CardEditor from "./components/cardEditor";
import CreateCardsChat from "./components/createCardsChat";
import { Card, AppView } from "./types";

export const App = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CREATE);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);

  return currentView === AppView.CREATE ? (
    <CreateCardsChat
      setCards={setCards}
      setSessionId={setSessionId}
      setCurrentView={setCurrentView}
    />
  ) : (
    <CardEditor cards={cards} setCards={setCards} />
  );
};
