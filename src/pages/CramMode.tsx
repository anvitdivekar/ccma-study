import { useState } from 'react';
import { Tag } from 'lucide-react';
import type { Card } from '../types';
import { getSRStates } from '../store/storage';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function CramMode({ cards }: { cards: Card[] }) {
  const srStates = getSRStates();

  const cramCards = cards.filter((c) => {
    const sr = srStates[c.id];
    return !sr || sr.lastRating === undefined || sr.lastRating <= 1;
  });

  const [queue, setQueue] = useState<Card[]>(() => shuffle(cramCards));
  const [flipped, setFlipped] = useState(false);
  const [cleared, setCleared] = useState(0);

  const card = queue[0];

  function gotIt() {
    setFlipped(false);
    setCleared((c) => c + 1);
    setTimeout(() => setQueue((q) => q.slice(1)), 200);
  }

  function stillLearning() {
    setFlipped(false);
    setTimeout(() => setQueue((q) => [...q.slice(1), q[0]]), 200);
  }

  if (!cramCards.length) return (
    <div className="text-center py-20">
      <div className="text-4xl mb-3">🎓</div>
      <h2 className="text-xl font-semibold mb-2">Nothing to cram!</h2>
      <p className="text-gray-500 text-sm">All cards have been rated Good or Easy in spaced rep.</p>
    </div>
  );

  if (!card) return (
    <div className="text-center py-20">
      <div className="text-4xl mb-3">🏆</div>
      <h2 className="text-xl font-semibold mb-2">Queue cleared!</h2>
      <p className="text-gray-500 text-sm">You cleared {cleared} cards.</p>
      <button onClick={() => { setQueue(shuffle(cramCards)); setCleared(0); setFlipped(false); }}
        className="mt-6 px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
        Cram Again
      </button>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-20 sm:pb-0">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{queue.length} remaining</span>
        <span>{cleared} cleared</span>
      </div>

      <div className="card-flip h-64 cursor-pointer select-none" onClick={() => setFlipped((f) => !f)}>
        <div className={`card-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
          <div className="card-face w-full h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center p-6 gap-2">
            <span className="text-xs text-indigo-500 font-medium uppercase tracking-wide flex items-center gap-1">
              <Tag size={11} /> {card.category}
            </span>
            <p className="text-xl font-semibold text-center">{card.term || card.definition}</p>
            <span className="text-xs text-gray-400 mt-2">tap to flip</span>
          </div>
          <div className="card-face card-back w-full h-full bg-amber-50 dark:bg-amber-950 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-sm flex flex-col items-center justify-center p-6">
            <p className="text-base text-center text-gray-800 dark:text-gray-200 leading-relaxed">
              {card.definition || card.term}
            </p>
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="flex gap-2">
          <button onClick={stillLearning} className="flex-1 py-2 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-medium text-sm hover:bg-rose-200 dark:hover:bg-rose-900 transition-colors">
            Still Learning
          </button>
          <button onClick={gotIt} className="flex-1 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium text-sm hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors">
            Got It ✓
          </button>
        </div>
      ) : (
        <button onClick={() => setFlipped(true)} className="w-full py-2 rounded-xl bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 transition-colors">
          Flip Card
        </button>
      )}
    </div>
  );
}
