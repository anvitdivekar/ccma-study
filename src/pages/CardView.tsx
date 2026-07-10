import { Link, useParams } from 'react-router-dom';
import type { Card } from '../types';

export function CardView({ cards }: { cards: Card[] }) {
  const { id } = useParams<{ id: string }>();
  const card = cards.find((c) => c.id === id);

  if (!card) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Card not found.</p>
      <Link to="/flashcards" className="mt-4 inline-block text-indigo-600 text-sm hover:underline">← Back to Flashcards</Link>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-20 sm:pb-0">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
        <div className="text-xs text-indigo-500 font-medium uppercase tracking-wide">{card.category}</div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Term</p>
          <p className="text-xl font-semibold">{card.term || card.definition}</p>
        </div>
        <hr className="border-gray-100 dark:border-gray-800" />
        <div>
          <p className="text-xs text-gray-400 mb-1">Definition</p>
          <p className="text-base text-gray-800 dark:text-gray-200 leading-relaxed">{card.definition || card.term}</p>
        </div>
        {card.type !== 'term' && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 uppercase">{card.type}</span>
        )}
      </div>
      <Link to="/flashcards" className="block w-full py-2 rounded-xl bg-indigo-600 text-white text-center text-sm font-medium hover:bg-indigo-700 transition-colors">
        Study this card →
      </Link>
    </div>
  );
}
