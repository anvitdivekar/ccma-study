import { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, RotateCcw, Shuffle } from 'lucide-react';
import type { Card, SRRating, SRState } from '../types';
import { getSRStates, setSRState, updateStreak, getStreak, getSessionLimit, setSessionLimit } from '../store/storage';
import { sm2, defaultSRState, isDue } from '../utils/sm2';

const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function overduedays(dueDate: string): number {
  const today = new Date().toISOString().split('T')[0];
  if (dueDate >= today) return 0;
  return Math.floor((new Date(today).getTime() - new Date(dueDate).getTime()) / 86400000);
}

function maturityLabel(state: SRState): { label: string; cls: string } {
  if (state.repetitions === 0) return { label: 'New', cls: 'bg-gray-100 dark:bg-gray-800 text-gray-500' };
  if (state.interval < 21) return { label: 'Young', cls: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' };
  return { label: 'Mature', cls: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' };
}

export function SpacedRep({ cards }: { cards: Card[] }) {
  const srStates = getSRStates();
  const streak = getStreak();

  const allDue = cards.filter((c) => isDue(srStates[c.id] ?? defaultSRState(c.id)));
  const categories = [...new Set(allDue.map((c) => c.category))].sort();

  const [started, setStarted] = useState(() => categories.length <= 1);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [limit, setLimit] = useState(getSessionLimit);

  const buildQueue = useCallback((cat: string, lim: number) => {
    const filtered = cat === 'All' ? allDue : allDue.filter((c) => c.category === cat);
    return shuffle(filtered).slice(0, lim);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [queue, setQueue] = useState<Card[]>(() => started ? buildQueue('All', getSessionLimit()) : []);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [ratings, setRatings] = useState<SRRating[]>([]);
  const undoStack = useRef<{ card: Card; state: SRState; idx: number }[]>([]);

  const card = queue[idx];
  const state = card ? (srStates[card.id] ?? defaultSRState(card.id)) : null;

  function startSession() {
    setSessionLimit(limit);
    const q = buildQueue(categoryFilter, limit);
    setQueue(q);
    setIdx(0);
    setFlipped(false);
    setDone(false);
    setRatings([]);
    undoStack.current = [];
    setStarted(true);
  }

  const rate = useCallback((rating: SRRating) => {
    if (!card || !state) return;
    undoStack.current.push({ card, state: { ...state }, idx });
    const newState = sm2(state, rating);
    setSRState(newState);
    updateStreak();
    setRatings((r) => [...r, rating]);

    if (rating === 0) {
      // Re-queue at end
      setQueue((q) => [...q, card]);
      setFlipped(false);
      setTimeout(() => setIdx((i) => i + 1), 200);
    } else if (idx + 1 >= queue.length) {
      setDone(true);
    } else {
      setFlipped(false);
      setTimeout(() => setIdx((i) => i + 1), 200);
    }
  }, [card, state, idx, queue.length]);

  function undo() {
    const prev = undoStack.current.pop();
    if (!prev) return;
    setSRState(prev.state);
    setRatings((r) => r.slice(0, -1));
    // If we re-queued (Again), remove the extra entry at end
    setQueue((q) => {
      const last = q[q.length - 1];
      if (prev.card.id === last?.id && q.length > prev.idx + 1) return q.slice(0, -1);
      return q;
    });
    setIdx(prev.idx);
    setFlipped(false);
    setDone(false);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undo(); return; }
      if (e.key === ' ') { e.preventDefault(); setFlipped((f) => !f); return; }
      if (!flipped) return;
      if (e.key === '1') rate(0);
      if (e.key === '2') rate(1);
      if (e.key === '3') rate(2);
      if (e.key === '4') rate(3);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, rate]);

  // --- Empty state ---
  if (!allDue.length) return (
    <div className="text-center py-20">
      <div className="text-4xl mb-3">🎉</div>
      <h2 className="text-xl font-semibold mb-2">All caught up!</h2>
      <p className="text-gray-500 text-sm">No cards due for review today.</p>
    </div>
  );

  // --- Start screen ---
  if (!started) return (
    <div className="max-w-sm mx-auto py-20 space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-1">Start Session</h2>
        <p className="text-sm text-gray-500">{allDue.length} cards due today</p>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          >
            <option value="All">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Cards per session</label>
          <input
            type="number"
            min={1}
            max={allDue.length}
            value={limit}
            onChange={(e) => setLimit(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <button
        onClick={startSession}
        className="w-full py-3 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors"
      >
        Start
      </button>
    </div>
  );

  // --- Done screen ---
  if (done) {
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0 };
    ratings.forEach((r) => counts[r]++);
    return (
      <div className="text-center py-20 max-w-sm mx-auto">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-xl font-semibold mb-4">Session Complete</h2>
        <div className="grid grid-cols-4 gap-2 mb-6 text-sm">
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-3">
            <div className="font-bold text-red-600">{counts[0]}</div>
            <div className="text-xs text-gray-500 mt-0.5">Again</div>
          </div>
          <div className="rounded-lg bg-orange-50 dark:bg-orange-900/30 p-3">
            <div className="font-bold text-orange-600">{counts[1]}</div>
            <div className="text-xs text-gray-500 mt-0.5">Hard</div>
          </div>
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 p-3">
            <div className="font-bold text-emerald-600">{counts[2]}</div>
            <div className="text-xs text-gray-500 mt-0.5">Good</div>
          </div>
          <div className="rounded-lg bg-sky-50 dark:bg-sky-900/30 p-3">
            <div className="font-bold text-sky-600">{counts[3]}</div>
            <div className="text-xs text-gray-500 mt-0.5">Easy</div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => setStarted(false)}
            className="px-5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            New Session
          </button>
          <button onClick={startSession}
            className="px-5 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors">
            Study Again
          </button>
        </div>
      </div>
    );
  }

  if (!card || !state) return null;

  const overdue = overduedays(state.dueDate);
  const maturity = maturityLabel(state);
  const progress = queue.length > 0 ? (idx / queue.length) * 100 : 0;

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-20 sm:pb-0">
      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-violet-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Header row */}
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>
          {idx + 1} / {queue.length}
          {overdue > 2 && <span className="ml-2 text-rose-500 font-medium">overdue {overdue}d</span>}
        </span>
        <span className="flex items-center gap-3">
          <span>Interval: {state.interval}d · EF: {state.easeFactor.toFixed(2)}</span>
          <button onClick={() => { setQueue((q) => shuffle(q)); }} title="Shuffle remaining" className="hover:text-violet-500 transition-colors">
            <Shuffle size={13} />
          </button>
          <button onClick={undo} disabled={undoStack.current.length === 0} title="Undo (Ctrl+Z)" className="hover:text-violet-500 transition-colors disabled:opacity-30">
            <RotateCcw size={13} />
          </button>
          <span className="text-orange-500 font-medium">🔥 {streak.count}</span>
        </span>
      </div>

      {/* Card */}
      <div className="card-flip h-64 cursor-pointer" onClick={() => setFlipped((f) => !f)}>
        <div className={`card-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
          <div className="card-face w-full h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center p-6 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-500 font-medium">{card.category}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${maturity.cls}`}>{maturity.label}</span>
            </div>
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

      {/* Rating buttons */}
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
      <p className="text-center text-xs text-gray-400">Space=flip · 1=Again 2=Hard 3=Good 4=Easy · Ctrl+Z=undo</p>
    </div>
  );
}
