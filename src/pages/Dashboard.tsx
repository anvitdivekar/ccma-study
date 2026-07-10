import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BookOpen, Flame, CheckCircle, Clock, Download, Upload } from 'lucide-react';
import type { Card } from '../types';
import { getMasteryStates, getSRStates, getHistory, getStreak, exportAll, importAll } from '../store/storage';
import { isDue, defaultSRState } from '../utils/sm2';

export function Dashboard({ cards }: { cards: Card[] }) {
  const mastery = getMasteryStates();
  const srStates = getSRStates();
  const history = getHistory();
  const streak = getStreak();

  const dueToday = useMemo(() => cards.filter((c) => {
    const s = srStates[c.id] ?? defaultSRState(c.id);
    return isDue(s);
  }).length, [cards, srStates]);

  const masteredCount = Object.values(mastery).filter((m) => m.status === 'mastered').length;
  const masteryPct = cards.length ? Math.round((masteredCount / cards.length) * 100) : 0;

  const categoryStats = useMemo(() => {
    const cats: Record<string, { total: number; mastered: number }> = {};
    for (const c of cards) {
      if (!cats[c.category]) cats[c.category] = { total: 0, mastered: 0 };
      cats[c.category].total++;
      if (mastery[c.id]?.status === 'mastered') cats[c.category].mastered++;
    }
    return Object.entries(cats).sort((a, b) => a[0].localeCompare(b[0]));
  }, [cards, mastery]);

  const chartData = useMemo(() => history.slice(-20).map((r) => ({
    date: r.date.slice(5, 10),
    score: Math.round((r.score / r.total) * 100),
    mode: r.mode,
  })), [history]);

  function handleExport() {
    const data = JSON.stringify(exportAll(), null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'ccma-progress.json'; a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      file.text().then((t) => { importAll(JSON.parse(t)); window.location.reload(); });
    };
    input.click();
  }

  const MODES = [
    { to: '/flashcards', label: 'Flashcards', desc: 'Flip & mark', color: 'bg-indigo-500' },
    { to: '/spaced', label: 'Spaced Repetition', desc: 'SM-2 Anki-style', color: 'bg-violet-500' },
    { to: '/quiz/mc', label: 'Multiple Choice', desc: 'Pick the right answer', color: 'bg-sky-500' },
    { to: '/quiz/typed', label: 'Typed Answer', desc: 'Type from memory', color: 'bg-emerald-500' },
    { to: '/quiz/match', label: 'Matching', desc: 'Pair terms & defs', color: 'bg-amber-500' },
    { to: '/quiz/exam', label: 'Exam Sim', desc: 'Timed mock exam', color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<BookOpen size={18} />} label="Total Cards" value={cards.length} color="text-indigo-500" />
        <StatCard icon={<Clock size={18} />} label="Due Today" value={dueToday} color="text-amber-500" />
        <StatCard icon={<CheckCircle size={18} />} label="Mastered" value={`${masteryPct}%`} color="text-emerald-500" />
        <StatCard icon={<Flame size={18} />} label="Streak" value={`${streak.count}d`} color="text-rose-500" />
      </div>

      {/* Study mode grid */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Study Modes</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {MODES.map(({ to, label, desc, color }) => (
            <Link
              key={to}
              to={to}
              className="group p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all hover:shadow-md"
            >
              <div className={`w-2 h-2 rounded-full ${color} mb-2`} />
              <div className="font-medium text-sm">{label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Score history chart */}
      {chartData.length > 0 && (
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <h2 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Score History</h2>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v) => `${v}%`} />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* Category breakdown */}
      {categoryStats.length > 0 && (
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <h2 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Mastery by Category</h2>
          <div className="space-y-2">
            {categoryStats.map(([cat, { total, mastered }]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-700 dark:text-gray-300">{cat}</span>
                  <span className="text-gray-500">{mastered}/{total}</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${total ? (mastered / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Export / Import */}
      <div className="flex gap-3">
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <Download size={15} /> Export Progress
        </button>
        <button onClick={handleImport} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <Upload size={15} /> Import Progress
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}
