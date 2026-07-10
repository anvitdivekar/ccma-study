import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Tag, Volume2, Flag, Share2 } from 'lucide-react';
import type { Card } from '../types';
import { getMasteryStates, setMasteryState, updateStreak, getFlags, toggleFlag } from '../store/storage';
import { FilterBar } from '../components/ui/FilterBar';

const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function Flashcards({ cards }: { cards: Card[] }) {
  const [filtered, setFiltered] = useState<Card[]>(cards);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [flags, setFlags] = useState<string[]>(getFlags);
  const [toast, setToast] = useState(false);
  const mastery = getMasteryStates();
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const card = filtered[idx];

  const go = useCallback((dir: 1 | -1) => {
    setFlipped(false);
    setTimeout(() => setIdx((i) => Math.max(0, Math.min(filtered.length - 1, i + dir))), flipped ? 200 : 0);
  }, [filtered.length, flipped]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped((f) => !f); }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(-1);
      if (e.key === 'g' || e.key === 'G') { if (flipped) mark('mastered'); }
      if (e.key === 'l' || e.key === 'L') { if (flipped) mark('learning'); }
      if (e.key === 'f' || e.key === 'F') { if (card) setFlags(toggleFlag(card.id)); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, flipped, card]);

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

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (!flipped) {
      if (Math.abs(dy) > 50 && Math.abs(dy) > Math.abs(dx)) setFlipped(true);
      return;
    }
    if (Math.abs(dx) < 50) return;
    if (dx > 0) mark('mastered');
    else mark('learning');
  }

  function speak() {
    if (!hasSpeech || !card) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(card.term || card.definition));
  }

  function share() {
    if (!card) return;
    navigator.clipboard.writeText(`${window.location.origin}/ccma-study/#card/${card.id}`);
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  }

  if (!card) return (
    <div className="text-center py-20 text-gray-500">
      No cards match your filters.
      <FilterBar cards={cards} onChange={(c) => { setFiltered(c); setIdx(0); }} />
    </div>
  );

  const isFlagged = flags.includes(card.id);

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-20 sm:pb-0 relative">
      <FilterBar cards={cards} onChange={(c) => { setFiltered(c); setIdx(0); setFlipped(false); }} />

      <div className="text-center text-xs text-gray-400">{idx + 1} / {filtered.length}</div>

      {/* Flip card */}
      <div
        className="card-flip h-64 cursor-pointer select-none"
        onClick={() => setFlipped((f) => !f)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className={`card-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div className="card-face w-full h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center p-6 gap-2">
            <span className="text-xs text-indigo-500 font-medium uppercase tracking-wide flex items-center gap-1">
              <Tag size={11} /> {card.category}
            </span>
            <p className="text-xl font-semibold text-center">{card.term || card.definition}</p>
            <div className="flex items-center gap-3 mt-2">
              {hasSpeech && (
                <button onClick={(e) => { e.stopPropagation(); speak(); }} className="text-gray-400 hover:text-indigo-500 transition-colors" title="Pronounce">
                  <Volume2 size={16} />
                </button>
              )}
              <span className="text-xs text-gray-400">tap or press Space to flip</span>
              <button onClick={(e) => { e.stopPropagation(); setFlags(toggleFlag(card.id)); }} className={`transition-colors ${isFlagged ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`} title="Flag">
                <Flag size={16} fill={isFlagged ? 'currentColor' : 'none'} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); share(); }} className="text-gray-400 hover:text-indigo-500 transition-colors" title="Share">
                <Share2 size={16} />
              </button>
            </div>
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
            <p className="mt-3 text-xs text-gray-400 hidden sm:block">← Still Learning · Got It →</p>
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

      {/* Copied toast */}
      {toast && (
        <div className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
          Copied!
        </div>
      )}
    </div>
  );
}
