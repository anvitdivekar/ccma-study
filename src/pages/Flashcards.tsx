import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Tag } from 'lucide-react';
import type { Card } from '../types';
import { getMasteryStates, setMasteryState, updateStreak } from '../store/storage';
import { FilterBar } from '../components/ui/FilterBar';

export function Flashcards({ cards }: { cards: Card[] }) {
  const [filtered, setFiltered] = useState<Card[]>(cards);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const mastery = getMasteryStates();

  const card = filtered[idx];

  const go = useCallback((dir: 1 | -1) => {
    setFlipped(false);
    setTimeout(() => setIdx((i) => Math.max(0, Math.min(filtered.length - 1, i + dir))), flipped ? 200 : 0);
  }, [filtered.length, flipped]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped((f) => !f); }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  function mark(status: 'mastered' | 'learning') {
    if (!card) return;
    const m = mastery[card.id] ?? { cardId: card.id, status: 'new', correctCount: 0, incorrectCount: 0 };
    setMasteryState({
      ...m,
      status,
      correctCount: status === 'mastered' ? m.correctCount + 1 : m.correctCount,
      incorrectCount: status === 'learning' ? m.incorrectCount + 1 : m.incorrectCount,
    });
    updateStreak();
    go(1);
  }

  if (!card) return (
    <div className="text-center py-20 text-gray-500">
      No cards match your filters.
      <FilterBar cards={cards} onChange={(c) => { setFiltered(c); setIdx(0); }} />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-20 sm:pb-0">
      <FilterBar cards={cards} onChange={(c) => { setFiltered(c); setIdx(0); setFlipped(false); }} />

      <div className="text-center text-xs text-gray-400">{idx + 1} / {filtered.length}</div>

      {/* Flip card */}
      <div className="card-flip h-64 cursor-pointer select-none" onClick={() => setFlipped((f) => !f)}>
        <div className={`card-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div className="card-face w-full h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center p-6 gap-2">
            <span className="text-xs text-indigo-500 font-medium uppercase tracking-wide flex items-center gap-1">
              <Tag size={11} /> {card.category}
            </span>
            <p className="text-xl font-semibold text-center">{card.term || card.definition}</p>
            <span className="text-xs text-gray-400 mt-2">tap or press Space to flip</span>
          </div>
          {/* Back */}
          <div className="card-face card-back w-full h-full bg-indigo-50 dark:bg-indigo-950 rounded-2xl border border-indigo-200 dark:border-indigo-800 shadow-sm flex flex-col items-center justify-center p-6">
            <p className="text-base text-center text-gray-800 dark:text-gray-200 leading-relaxed">
              {card.definition || card.term}
            </p>
            {card.type !== 'term' && (
              <span className="mt-3 text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 uppercase">
                {card.type}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Nav + mark */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => go(-1)} disabled={idx === 0} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors">
          <ChevronLeft size={20} />
        </button>

        {flipped ? (
          <div className="flex gap-2 flex-1 justify-center">
            <button onClick={() => mark('learning')} className="flex-1 py-2 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-medium text-sm hover:bg-rose-200 dark:hover:bg-rose-900 transition-colors">
              Still Learning
            </button>
            <button onClick={() => mark('mastered')} className="flex-1 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium text-sm hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors">
              Got It ✓
            </button>
          </div>
        ) : (
          <button onClick={() => setFlipped(true)} className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors">
            Flip Card
          </button>
        )}

        <button onClick={() => go(1)} disabled={idx === filtered.length - 1} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      <button onClick={() => { setIdx(0); setFlipped(false); }} className="w-full py-2 text-sm text-gray-500 flex items-center justify-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
        <RotateCcw size={14} /> Restart
      </button>
    </div>
  );
}
