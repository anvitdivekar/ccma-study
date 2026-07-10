import { useMemo } from 'react';
import type { Card } from '../types';
import { getMasteryStates } from '../store/storage';

export function Heatmap({ cards }: { cards: Card[] }) {
  const mastery = getMasteryStates();

  const cats = useMemo(() => {
    const m: Record<string, { total: number; mastered: number }> = {};
    for (const c of cards) {
      if (!m[c.category]) m[c.category] = { total: 0, mastered: 0 };
      m[c.category].total++;
      if (mastery[c.id]?.status === 'mastered') m[c.category].mastered++;
    }
    return Object.entries(m)
      .map(([cat, { total, mastered }]) => ({ cat, total, mastered, pct: total ? Math.round((mastered / total) * 100) : 0 }))
      .sort((a, b) => a.pct - b.pct);
  }, [cards, mastery]);

  function tileColor(pct: number) {
    if (pct >= 70) return 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200';
    if (pct >= 40) return 'bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200';
    return 'bg-rose-100 dark:bg-rose-900/50 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200';
  }

  return (
    <div className="space-y-4 pb-20 sm:pb-0">
      <h2 className="text-lg font-semibold">Category Confidence Heatmap</h2>

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-200 dark:bg-rose-800 border border-rose-300 dark:border-rose-700 inline-block" /> &lt;40% Needs work</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-200 dark:bg-amber-800 border border-amber-300 dark:border-amber-700 inline-block" /> 40-69% Getting there</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-200 dark:bg-emerald-800 border border-emerald-300 dark:border-emerald-700 inline-block" /> 70%+ Strong</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cats.map(({ cat, total, mastered, pct }) => (
          <div key={cat} className={`rounded-xl border p-4 ${tileColor(pct)}`}>
            <div className="text-2xl font-bold">{pct}%</div>
            <div className="text-sm font-medium mt-1 leading-tight">{cat}</div>
            <div className="text-xs opacity-70 mt-1">{mastered}/{total} cards</div>
          </div>
        ))}
      </div>
    </div>
  );
}
