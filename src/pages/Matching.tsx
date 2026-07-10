import { useState, useCallback } from 'react';
import type { Card } from '../types';
import { updateStreak } from '../store/storage';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

type Tile = { id: string; text: string; side: 'term' | 'def'; matched: boolean };

function buildTiles(cards: Card[]): Tile[] {
  const set = shuffle(cards).slice(0, 6);
  const terms: Tile[] = set.map((c) => ({ id: c.id, text: c.term || c.definition, side: 'term', matched: false }));
  const defs: Tile[] = set.map((c) => ({ id: c.id, text: c.definition || c.term, side: 'def', matched: false }));
  return shuffle([...terms, ...defs]);
}

export function Matching({ cards }: { cards: Card[] }) {
  const eligible = cards.filter((c) => c.term && c.definition);
  const [tiles, setTiles] = useState<Tile[]>(() => buildTiles(eligible));
  const [selected, setSelected] = useState<number | null>(null);
  const [wrong, setWrong] = useState<[number, number] | null>(null);
  const [matchedCount, setMatchedCount] = useState(0);

  const total = tiles.length / 2;
  const done = matchedCount === total;

  const pick = useCallback((i: number) => {
    const tile = tiles[i];
    if (tile.matched || wrong !== null) return;
    if (selected === null) { setSelected(i); return; }
    if (selected === i) { setSelected(null); return; }

    const sel = tiles[selected];
    if (sel.id === tile.id && sel.side !== tile.side) {
      // Match!
      setTiles((prev) => prev.map((t, idx) => (idx === i || idx === selected) ? { ...t, matched: true } : t));
      setMatchedCount((c) => c + 1);
      setSelected(null);
      if (matchedCount + 1 === total) updateStreak();
    } else {
      // Wrong
      setWrong([selected, i]);
      setTimeout(() => { setWrong(null); setSelected(null); }, 800);
    }
  }, [tiles, selected, wrong, matchedCount, total]);

  function restart() {
    setTiles(buildTiles(eligible));
    setSelected(null); setWrong(null); setMatchedCount(0);
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-20 sm:pb-0">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{matchedCount}/{total} matched</span>
        <button onClick={restart} className="text-xs px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">New Set</button>
      </div>

      {done ? (
        <div className="text-center py-10">
          <div className="text-4xl mb-2">🎯</div>
          <h2 className="text-xl font-semibold mb-4">Matched all {total}!</h2>
          <button onClick={restart} className="px-6 py-2 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors">Play Again</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {tiles.map((tile, i) => {
            const isSelected = selected === i;
            const isWrong = wrong?.includes(i);
            let cls = 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-amber-400 cursor-pointer';
            if (tile.matched) cls = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 opacity-50 cursor-default';
            else if (isWrong) cls = 'border-rose-400 bg-rose-50 dark:bg-rose-900/30';
            else if (isSelected) cls = 'border-amber-400 bg-amber-50 dark:bg-amber-900/30 shadow-md';
            return (
              <button key={`${tile.id}-${tile.side}`} onClick={() => pick(i)}
                className={`rounded-xl p-3 text-sm text-center transition-all min-h-16 flex items-center justify-center leading-snug ${cls}`}>
                {tile.text}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
