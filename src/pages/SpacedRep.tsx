import { useState, useEffect, useCallback } from 'react';
import { Volume2 } from 'lucide-react';
import type { Card, SRRating } from '../types';
import { getSRStates, setSRState, updateStreak } from '../store/storage';
import { sm2, defaultSRState, isDue } from '../utils/sm2';

const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function SpacedRep({ cards }: { cards: Card[] }) {
  const srStates = getSRStates();

  const dueCards = cards.filter((c) => {
    const s = srStates[c.id] ?? defaultSRState(c.id);
    return isDue(s);
  });

  const [queue, setQueue] = useState<Card[]>(() => [...dueCards]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  const card = queue[idx];

  const rate = useCallback((rating: SRRating) => {
    if (!card) return;
    const state = srStates[card.id] ?? defaultSRState(card.id);
    setSRState(sm2(state, rating));
    updateStreak();
    if (idx + 1 >= queue.length) {
      setDone(true);
    } else {
      setFlipped(false);
      setTimeout(() => setIdx((i) => i + 1), 200);
    }
  }, [card, idx, queue.length, srStates]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!flipped) { if (e.key === ' ') { e.preventDefault(); setFlipped(true); } return; }
      if (e.key === '1') rate(0);
      if (e.key === '2') rate(1);
      if (e.key === '3') rate(2);
      if (e.key === '4') rate(3);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, rate]);

  if (!dueCards.length) return (
    <div className="text-center py-20">
      <div className="text-4xl mb-3">🎉</div>
      <h2 className="text-xl font-semibold mb-2">All caught up!</h2>
      <p className="text-gray-500 text-sm">No cards due for review today.</p>
    </div>
  );

  if (done) return (
    <div className="text-center py-20">
      <div className="text-4xl mb-3">✅</div>
      <h2 className="text-xl font-semibold mb-2">Session Complete</h2>
      <p className="text-gray-500 text-sm">You reviewed {queue.length} cards.</p>
      <button onClick={() => { setQueue([...dueCards]); setIdx(0); setFlipped(false); setDone(false); }}
        className="mt-6 px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
        Study Again
      </button>
    </div>
  );

  const state = srStates[card.id] ?? defaultSRState(card.id);

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-20 sm:pb-0">
      <div className="flex justify-between text-xs text-gray-400">
        <span>Card {idx + 1} of {queue.length}</span>
        <span>Interval: {state.interval}d · EF: {state.easeFactor.toFixed(2)}</span>
      </div>

      <div className="card-flip h-64 cursor-pointer select-none" onClick={() => !flipped && setFlipped(true)}>
        <div className={`card-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
          <div className="card-face w-full h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center p-6 gap-3">
            <span className="text-xs text-indigo-500 font-medium">{card.category}</span>
            <p className="text-xl font-semibold text-center">{card.term || card.definition}</p>
            <div className="flex items-center gap-2">
              {hasSpeech && (
                <button onClick={(e) => { e.stopPropagation(); window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(card.term || card.definition)); }}
                  className="text-gray-400 hover:text-violet-500 transition-colors" title="Pronounce">
                  <Volume2 size={16} />
                </button>
              )}
              <span className="text-xs text-gray-400">tap or Space to reveal</span>
            </div>
          </div>
          <div className="card-face card-back w-full h-full bg-violet-50 dark:bg-violet-950 rounded-2xl border border-violet-200 dark:border-violet-800 shadow-sm flex items-center justify-center p-6">
            <p className="text-base text-center leading-relaxed">{card.definition || card.term}</p>
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="grid grid-cols-4 gap-2">
          {([
            { label: 'Again', sub: '<1d', rating: 0, cls: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200' },
            { label: 'Hard', sub: `~${Math.max(1, Math.round(state.interval * 1.2))}d`, rating: 1, cls: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 hover:bg-orange-200' },
            { label: 'Good', sub: `~${state.interval <= 1 ? 1 : Math.round(state.interval * state.easeFactor)}d`, rating: 2, cls: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200' },
            { label: 'Easy', sub: `~${Math.round(state.interval * state.easeFactor * 1.3)}d`, rating: 3, cls: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 hover:bg-sky-200' },
          ] as const).map(({ label, sub, rating, cls }) => (
            <button key={label} onClick={() => rate(rating as SRRating)}
              className={`py-3 rounded-xl text-sm font-medium transition-colors ${cls}`}>
              <div>{label}</div>
              <div className="text-xs opacity-70 mt-0.5">{sub}</div>
            </button>
          ))}
        </div>
      ) : (
        <button onClick={() => setFlipped(true)} className="w-full py-3 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors">
          Show Answer
        </button>
      )}
      <p className="text-center text-xs text-gray-400">Keys: Space=flip · 1=Again 2=Hard 3=Good 4=Easy</p>
    </div>
  );
}
