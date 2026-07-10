import { useState, useEffect, useCallback } from 'react';
import type { Card } from '../types';
import { addHistory, updateStreak } from '../store/storage';
import { Timer } from 'lucide-react';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

function buildQuestion(card: Card, all: Card[]) {
  const pool = shuffle(all.filter((c) => c.id !== card.id && c.term));
  const distractors = pool.slice(0, 3).map((c) => c.term);
  return { question: card.definition, correct: card.term, choices: shuffle([card.term, ...distractors]) };
}

const EXAM_SIZE = 25;
const EXAM_MINUTES = 30;

export function ExamSim({ cards }: { cards: Card[] }) {
  const eligible = cards.filter((c) => c.term && c.definition);
  const [started, setStarted] = useState(false);
  const [queue, setQueue] = useState<Card[]>([]);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(EXAM_MINUTES * 60);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!started || submitted) return;
    const t = setInterval(() => setSecondsLeft((s) => {
      if (s <= 1) { clearInterval(t); submit(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [started, submitted]); // eslint-disable-line react-hooks/exhaustive-deps

  function start() {
    const q = shuffle(eligible).slice(0, EXAM_SIZE);
    setQueue(q);
    setAnswers(new Array(q.length).fill(null));
    setSecondsLeft(EXAM_MINUTES * 60);
    setSubmitted(false);
    setStarted(true);
  }

  const submit = useCallback(() => {
    setSubmitted(true);
    updateStreak();
  }, []);

  if (!started) return (
    <div className="max-w-lg mx-auto text-center py-16 space-y-4">
      <div className="text-4xl">📋</div>
      <h2 className="text-xl font-semibold">Exam Simulation</h2>
      <p className="text-gray-500 text-sm">{EXAM_SIZE} questions · {EXAM_MINUTES} minutes · Multiple choice</p>
      {eligible.length < EXAM_SIZE && <p className="text-amber-500 text-xs">Only {eligible.length} cards available; exam will use all of them.</p>}
      <button onClick={start} className="px-8 py-3 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors">
        Start Exam
      </button>
    </div>
  );

  if (submitted) {
    const score = answers.filter((a, i) => a === buildQuestion(queue[i], eligible).correct).length;
    const catScores: Record<string, { correct: number; total: number }> = {};
    queue.forEach((card, i) => {
      const q = buildQuestion(card, eligible);
      const cat = card.category;
      if (!catScores[cat]) catScores[cat] = { correct: 0, total: 0 };
      catScores[cat].total++;
      if (answers[i] === q.correct) catScores[cat].correct++;
    });
    addHistory({ id: crypto.randomUUID(), date: new Date().toISOString(), mode: 'Exam Sim', score, total: queue.length, categories: catScores });

    return (
      <div className="max-w-lg mx-auto space-y-4 pb-20 sm:pb-0">
        <div className="text-center py-6">
          <div className={`text-6xl font-bold mb-1 ${score / queue.length >= 0.7 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {Math.round((score / queue.length) * 100)}%
          </div>
          <p className="text-gray-500">{score} / {queue.length} correct</p>
          {score / queue.length >= 0.7 ? <p className="text-emerald-600 text-sm mt-1">✓ Passing score!</p> : <p className="text-rose-500 text-sm mt-1">Keep studying — aim for 70%+</p>}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-2">
          <p className="text-sm font-medium">Category Breakdown</p>
          {Object.entries(catScores).sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total)).map(([cat, { correct, total }]) => (
            <div key={cat} className="flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">{cat}</span>
              <span className={correct / total >= 0.7 ? 'text-emerald-500' : 'text-rose-500'}>{correct}/{total} ({Math.round(correct/total*100)}%)</span>
            </div>
          ))}
        </div>

        <button onClick={start} className="w-full py-2 rounded-xl bg-rose-600 text-white font-medium text-sm hover:bg-rose-700 transition-colors">Retake Exam</button>
      </div>
    );
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const answered = answers.filter((a) => a !== null).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24 sm:pb-0">
      {/* Sticky header */}
      <div className="sticky top-14 z-10 bg-gray-50 dark:bg-gray-950 py-2 flex items-center justify-between">
        <span className="text-sm text-gray-500">{answered}/{queue.length} answered</span>
        <span className={`flex items-center gap-1 font-mono font-medium text-sm ${secondsLeft < 300 ? 'text-rose-500' : 'text-gray-700 dark:text-gray-300'}`}>
          <Timer size={14} />{mm}:{ss}
        </span>
        <button onClick={submit} className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition-colors">
          Submit
        </button>
      </div>

      {queue.map((card, i) => {
        const q = buildQuestion(card, eligible);
        return (
          <div key={card.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-400 mb-1">Q{i + 1} · {card.category}</p>
            <p className="text-sm font-medium mb-3 leading-relaxed">{q.question}</p>
            <div className="grid grid-cols-1 gap-1.5">
              {q.choices.map((choice) => (
                <button key={choice} onClick={() => setAnswers((prev) => { const n = [...prev]; n[i] = choice; return n; })}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    answers[i] === choice
                      ? 'bg-rose-100 dark:bg-rose-900/40 border border-rose-400 text-rose-700 dark:text-rose-300'
                      : 'border border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-700'
                  }`}>
                  {choice}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <button onClick={submit} className="w-full py-3 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors">
        Submit Exam
      </button>
    </div>
  );
}
