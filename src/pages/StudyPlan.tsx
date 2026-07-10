import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Card } from '../types';

const EXAM_DATE = '2026-07-16';
const PLAN_KEY = 'ccma:plan';

function getChecked(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(PLAN_KEY) ?? '{}'); } catch { return {}; }
}

export function StudyPlan({ cards }: { cards: Card[] }) {
  const [checked, setChecked] = useState<Record<string, boolean>>(getChecked);

  const { daysLeft, plan, today } = useMemo(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const exam = new Date(EXAM_DATE + 'T00:00:00');
    const daysLeft = Math.max(1, Math.ceil((exam.getTime() - now.getTime()) / 86400000));
    const todayStr = now.toISOString().split('T')[0];

    // Group by category
    const catMap: Record<string, number> = {};
    for (const c of cards) catMap[c.category] = (catMap[c.category] ?? 0) + 1;
    const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]); // most cards first

    // Distribute categories across days
    const plan: { date: string; cats: string[]; total: number }[] = [];
    for (let i = 0; i < daysLeft; i++) {
      const d = new Date(now); d.setDate(d.getDate() + i);
      plan.push({ date: d.toISOString().split('T')[0], cats: [], total: 0 });
    }
    cats.forEach(([cat, count], i) => {
      const day = plan[i % daysLeft];
      day.cats.push(cat);
      day.total += count;
    });

    return { daysLeft, plan, today: todayStr };
  }, [cards]);

  function toggle(date: string) {
    const next = { ...checked, [date]: !checked[date] };
    setChecked(next);
    localStorage.setItem(PLAN_KEY, JSON.stringify(next));
  }

  return (
    <div className="space-y-4 pb-20 sm:pb-0">
      <div className="bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-300 dark:border-indigo-700 rounded-xl p-4">
        <p className="font-semibold text-sm">Exam: July 16, 2026</p>
        <p className="text-xs opacity-70 mt-0.5">{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</p>
      </div>

      <div className="space-y-2">
        {plan.map(({ date, cats, total }) => {
          const isToday = date === today;
          const done = !!checked[date];
          return (
            <div key={date} className={`rounded-xl border p-4 transition-colors ${isToday ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-950' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'} ${done ? 'opacity-50' : ''}`}>
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={done} onChange={() => toggle(date)}
                  className="mt-0.5 accent-indigo-600 w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{date}</span>
                    {isToday && <span className="text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">Today</span>}
                    <span className="text-xs text-gray-500">{total} cards</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{cats.join(', ') || 'Rest day'}</p>
                  {isToday && cats.length > 0 && (
                    <Link to="/flashcards" className="inline-block mt-2 text-xs px-3 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                      Start Today's Session →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
