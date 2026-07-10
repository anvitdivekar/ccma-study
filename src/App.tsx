import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/ui/Layout';
import { ShortcutsModal } from './components/ui/ShortcutsModal';
import { Dashboard } from './pages/Dashboard';
import { Flashcards } from './pages/Flashcards';
import { SpacedRep } from './pages/SpacedRep';
import { MultipleChoice } from './pages/MultipleChoice';
import { TypedAnswer } from './pages/TypedAnswer';
import { Matching } from './pages/Matching';
import { ExamSim } from './pages/ExamSim';
import { Editor } from './pages/Editor';
import { WeakCards } from './pages/WeakCards';
import { CramMode } from './pages/CramMode';
import { Heatmap } from './pages/Heatmap';
import { StudyPlan } from './pages/StudyPlan';
import { CardView } from './pages/CardView';
import { useCards } from './hooks/useCards';
import { useDarkMode } from './hooks/useDarkMode';

export default function App() {
  const [dark, toggleDark] = useDarkMode();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const cards = useCards();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        setShowShortcuts((s) => !s);
      }
      if (e.key === 'Escape') setShowShortcuts(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
          <Route path="/weak" element={<WeakCards cards={cards} />} />
          <Route path="/cram" element={<CramMode cards={cards} />} />
          <Route path="/heatmap" element={<Heatmap cards={cards} />} />
          <Route path="/plan" element={<StudyPlan cards={cards} />} />
          <Route path="/card/:id" element={<CardView cards={cards} />} />
        </Routes>
      </Layout>
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </BrowserRouter>
  );
}
