import { useState, useRef, useEffect } from 'react';
import type { Card } from '../types';
import { fuzzyMatch } from '../utils/fuzzy';
import { addHistory, updateStreak } from '../store/storage';
import { FilterBar } from '../components/ui/FilterBar';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

export function TypedAnswer({ cards }: { cards: Card[] }) {
  const eligible = cards.filter((c) => c.term && c.definition);
  const [filtered, setFiltered] = useState<Card[]>(eligible);
  const [queue, setQueue] = useState<Card[]>(() => shuffle(eligible).slice(0, 20));
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [catScores, setCatScores] = useState<Record<string, { correct: number; total: number }>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const card = queue[idx];
  useEffect(() => { inputRef.current?.focus(); }, [idx]);

  function start(source: Card[]) {
    setQueue(shuffle(source).slice(0, 20));
    setIdx(0); setInput(''); setResult(null); setScore(0); setDone(false); setCatScores({});
  }

  function submit() {
    if (!card || result !== null) return;
    const correct = fuzzyMatch(input, card.term);
    setResult(correct ? 'correct' : 'wrong');
    if (correct) setScore((s) => s + 1);
    setCatScores((prev) => {
      const cur = prev[card.category] ?? { correct: 0, total: 0 };
      return { ...prev, [card.category]: { correct: cur.correct + (correct ? 1 : 0), total: cur.total + 1 } };
    });
  }

  function next() {
    if (idx + 1 >= queue.length) { setDone(true); updateStreak(); return; }
    setIdx((i) => i + 1);
    setInput(''); setResult(null);
  }

  if (!filtered.length) return <div className="text-center py-20 text-gray-500">No cards.<FilterBar cards={eligible} onChange={setFiltered} /></div>;

  if (done) {
    addHistory({ id: crypto.randomUUID(), date: new Date().toISOString(), mode: 'Typed Answer', score, total: queue.length, categories: catScores });
    return (
      <div className="max-w-lg mx-auto text-center py-10 space-y-4">
        <div className="text-5xl font-bold text-emerald-600">{Math.round((score / queue.length) * 100)}%</div>
        <p className="text-gray-600 dark:text-gray-400">{score} / {queue.length} correct</p>
        <button onClick={() => start(filtered)} className="px-6 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">Try Again</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-20 sm:pb-0">
      <FilterBar cards={eligible} onChange={(c) => { setFiltered(c); start(c); }} />
      <div className="flex justify-between text-xs text-gray-400"><span>Q {idx + 1}/{queue.length}</span><span>Score: {score}</span></div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 min-h-32 flex flex-col justify-center">
        <span className="text-xs text-emerald-500 mb-2">{card?.category}</span>
        <p className="text-base font-medium leading-relaxed">{card?.definition}</p>
        <p className="text-xs text-gray-400 mt-2">What is the term?</p>
      </div>

      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') result === null ? submit() : next(); }}
        disabled={result !== null}
        placeholder="Type your answer…"
        className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors ${
          result === 'correct' ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
          : result === 'wrong' ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
        }`}
      />

      {result && (
        <div className={`rounded-xl p-3 text-sm ${result === 'correct' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'}`}>
          {result === 'correct' ? '✓ Correct!' : `✗ Answer: ${card?.term}`}
        </div>
      )}

      {result === null
        ? <button onClick={submit} className="w-full py-2 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors">Submit (Enter)</button>
        : <button onClick={next} className="w-full py-2 rounded-xl bg-gray-700 text-white font-medium text-sm hover:bg-gray-800 transition-colors">Next (Enter)</button>
      }
    </div>
  );
}
