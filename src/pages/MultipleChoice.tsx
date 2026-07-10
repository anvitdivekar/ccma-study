import { useState, useEffect, useCallback } from 'react';
import type { Card } from '../types';
import { addHistory, updateStreak } from '../store/storage';
import { FilterBar } from '../components/ui/FilterBar';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestion(card: Card, allCards: Card[]): { question: string; correct: string; choices: string[] } {
  const question = card.definition;
  const correct = card.term;
  // Distractors from same category first, then fallback to any
  const pool = allCards.filter((c) => c.id !== card.id && c.term && c.term !== correct);
  const sameCat = pool.filter((c) => c.category === card.category);
  const other = pool.filter((c) => c.category !== card.category);
  const distractors = shuffle([...sameCat, ...other]).slice(0, 3).map((c) => c.term);
  return { question, correct, choices: shuffle([correct, ...distractors]) };
}

export function MultipleChoice({ cards }: { cards: Card[] }) {
  const [filtered, setFiltered] = useState<Card[]>(cards.filter((c) => c.term && c.definition));
  const [queue, setQueue] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [catScores, setCatScores] = useState<Record<string, { correct: number; total: number }>>({});

  function start(source: Card[]) {
    setQueue(shuffle(source).slice(0, Math.min(source.length, 20)));
    setIdx(0); setSelected(null); setScore(0); setDone(false); setCatScores({});
  }

  useEffect(() => { start(filtered); }, [filtered]);

  const card = queue[idx];
  const question = card ? buildQuestion(card, filtered) : null;

  const choose = useCallback((choice: string) => {
    if (selected !== null || !card || !question) return;
    setSelected(choice);
    const correct = choice === question.correct;
    if (correct) setScore((s) => s + 1);
    setCatScores((prev) => {
      const cat = card.category;
      const cur = prev[cat] ?? { correct: 0, total: 0 };
      return { ...prev, [cat]: { correct: cur.correct + (correct ? 1 : 0), total: cur.total + 1 } };
    });
    setTimeout(() => {
      if (idx + 1 >= queue.length) {
        setDone(true);
        updateStreak();
      } else {
        setIdx((i) => i + 1);
        setSelected(null);
      }
    }, 1000);
  }, [selected, card, question, idx, queue.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!question || selected !== null) return;
      const map: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3 };
      if (e.key in map) choose(question.choices[map[e.key]]);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choose, question, selected]);

  if (!filtered.length) return <div className="text-center py-20 text-gray-500">No cards available.<FilterBar cards={cards} onChange={(c) => setFiltered(c.filter((x) => x.term && x.definition))} /></div>;

  if (done) {
    addHistory({ id: crypto.randomUUID(), date: new Date().toISOString(), mode: 'Multiple Choice', score, total: queue.length, categories: catScores });
    return (
      <div className="max-w-lg mx-auto text-center py-10 space-y-4">
        <div className="text-5xl font-bold text-indigo-600">{Math.round((score / queue.length) * 100)}%</div>
        <p className="text-gray-600 dark:text-gray-400">{score} / {queue.length} correct</p>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-left space-y-2">
          <p className="text-sm font-medium mb-2">By Category</p>
          {Object.entries(catScores).map(([cat, { correct, total }]) => (
            <div key={cat} className="flex justify-between text-sm">
              <span>{cat}</span>
              <span className={correct / total >= 0.7 ? 'text-emerald-500' : 'text-rose-500'}>{correct}/{total}</span>
            </div>
          ))}
        </div>
        <button onClick={() => start(filtered)} className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  if (!card || !question) return null;

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-20 sm:pb-0">
      <FilterBar cards={cards.filter((c) => c.term && c.definition)} onChange={(c) => setFiltered(c)} />
      <div className="flex justify-between text-xs text-gray-400">
        <span>Q {idx + 1}/{queue.length}</span><span>Score: {score}</span>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 min-h-32 flex flex-col justify-center">
        <span className="text-xs text-indigo-500 mb-2">{card.category}</span>
        <p className="text-base font-medium leading-relaxed">{question.question}</p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {question.choices.map((choice, i) => {
          let cls = 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-indigo-400 dark:hover:border-indigo-600';
          if (selected !== null) {
            if (choice === question.correct) cls = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
            else if (choice === selected) cls = 'border-rose-400 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300';
            else cls = 'border-gray-200 dark:border-gray-700 opacity-50';
          }
          return (
            <button key={choice} onClick={() => choose(choice)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${cls}`}>
              <span className="text-gray-400 mr-2 text-xs">{i + 1}.</span>{choice}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-center text-gray-400">Press 1–4 to select</p>
    </div>
  );
}
