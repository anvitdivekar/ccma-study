import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/ui/Layout';
import { Dashboard } from './pages/Dashboard';
import { Flashcards } from './pages/Flashcards';
import { SpacedRep } from './pages/SpacedRep';
import { MultipleChoice } from './pages/MultipleChoice';
import { TypedAnswer } from './pages/TypedAnswer';
import { Matching } from './pages/Matching';
import { ExamSim } from './pages/ExamSim';
import { Editor } from './pages/Editor';
import { useCards } from './hooks/useCards';
import { useDarkMode } from './hooks/useDarkMode';

export default function App() {
  const [dark, toggleDark] = useDarkMode();
  const [refreshKey, setRefreshKey] = useState(0);
  const cards = useCards();

  return (
    <BrowserRouter basename="/ccma-study">
      <Layout dark={dark} onToggleDark={() => toggleDark((d) => !d)}>
        <Routes>
          <Route path="/" element={<Dashboard key={refreshKey} cards={cards} />} />
          <Route path="/flashcards" element={<Flashcards cards={cards} />} />
          <Route path="/spaced" element={<SpacedRep cards={cards} />} />
          <Route path="/quiz/mc" element={<MultipleChoice cards={cards} />} />
          <Route path="/quiz/typed" element={<TypedAnswer cards={cards} />} />
          <Route path="/quiz/match" element={<Matching cards={cards} />} />
          <Route path="/quiz/exam" element={<ExamSim cards={cards} />} />
          <Route path="/editor" element={<Editor cards={cards} onRefresh={() => setRefreshKey((k) => k + 1)} />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
