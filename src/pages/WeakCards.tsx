import { useState, useCallback } from 'react';
import { RotateCcw, Tag } from 'lucide-react';
import type { Card } from '../types';
import { getSRStates, getMasteryStates, setMasteryState, updateStreak } from '../store/storage';

export function WeakCards({ cards }: { cards: Card[] }) {
  const srStates = getSRStates();
  const masteryStates = getMasteryStates();

  const weakCards = cards.filter((c) => {
    const sr = srStates[c.id];
    const m = masteryStates[c.id];
    return (sr && sr.lastRating !== undefined && sr.lastRating <= 1) || m?.status === 'learning';
  });

  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = weakCards[idx];

  const go = useCallback((dir: 1 | -1) => {
    setFlipped(false);
    setTimeout(() => setIdx((i) => Math.max(0, Math.min(weakCards.length - 1, i + dir))), 200);
  }, [weakCards.length]);

  function mark(status: 'mastered' | 'learning') {
    if (!card) return;
    const m = masteryStates[card.id] ?? { cardId: card.id, status: 'new', correctCount: 0, incorrectCount: 0 };
    setMasteryState({
      ...m,
      status,
      correctCount: status === 'mastered' ? m.correctCount + 1 : m.correctCount,
      incorrectCount: status === 'learning' ? m.incorrectCount + 1 : m.incorrectCount,
    });
    updateStreak();
    go(1);
  }

  if (!weakCards.length) return (
    <div className="text-center py-20">
      <div className="text-4xl mb-3">🌟</div>
      <h2 className="text-xl font-semibold mb-2">No weak cards!</h2>
      <p className="text-gray-500 text-sm">You're crushing it — no cards rated Again or Hard.</p>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-20 sm:pb-0">
      <p className="text-sm text-rose-500 font-medium">{weakCards.length} weak cards to review</p>
      <div className="text-center text-xs text-gray-400">{idx + 1} / {weakCards.length}</div>

      <div className="card-flip h-64 cursor-pointer select-none" onClick={() => setFlipped((f) => !f)}>
        <div className={`card-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
          <div className="card-face w-full h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center p-6 gap-2">
            <span className="text-xs text-indigo-500 font-medium uppercase tracking-wide flex items-center gap-1">
              <Tag size={11} /> {card.category}
            </span>
            <p className="text-xl font-semibold text-center">{card.term || card.definition}</p>
            <span className="text-xs text-gray-400 mt-2">tap to flip</span>
          </div>
          <div className="card-face card-back w-full h-full bg-rose-50 dark:bg-rose-950 rounded-2xl border border-rose-200 dark:border-rose-800 shadow-sm flex flex-col items-center justify-center p-6">
            <p className="text-base text-center text-gray-800 dark:text-gray-200 leading-relaxed">
              {card.definition || card.term}
            </p>
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="flex gap-2">
          <button onClick={() => mark('learning')} className="flex-1 py-2 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-medium text-sm hover:bg-rose-200 dark:hover:bg-rose-900 transition-colors">
            Still Learning
          </button>
          <button onClick={() => mark('mastered')} className="flex-1 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium text-sm hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors">
            Got It ✓
          </button>
        </div>
      ) : (
        <button onClick={() => setFlipped(true)} className="w-full py-2 rounded-xl bg-rose-600 text-white font-medium text-sm hover:bg-rose-700 transition-colors">
          Flip Card
        </button>
      )}

      <button onClick={() => { setIdx(0); setFlipped(false); }} className="w-full py-2 text-sm text-gray-500 flex items-center justify-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
        <RotateCcw size={14} /> Restart
      </button>
    </div>
  );
}
