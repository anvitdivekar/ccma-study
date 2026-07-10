import { useState, useEffect } from 'react';
import type { Card, CardType } from '../../types';

interface Props {
  cards: Card[];
  onChange: (filtered: Card[]) => void;
}

export function FilterBar({ cards, onChange }: Props) {
  const categories = [...new Set(cards.map((c) => c.category))].sort();
  const [cat, setCat] = useState('All');
  const [type, setType] = useState<CardType | 'All'>('All');

  useEffect(() => {
    let result = cards;
    if (cat !== 'All') result = result.filter((c) => c.category === cat);
    if (type !== 'All') result = result.filter((c) => c.type === type);
    onChange(result);
  }, [cat, type, cards]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex gap-2 flex-wrap">
      <select
        value={cat}
        onChange={(e) => setCat(e.target.value)}
        className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
      >
        <option value="All">All Categories</option>
        {categories.map((c) => <option key={c}>{c}</option>)}
      </select>
      <select
        value={type}
        onChange={(e) => setType(e.target.value as CardType | 'All')}
        className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
      >
        <option value="All">All Types</option>
        <option value="term">Term</option>
        <option value="note">Note</option>
        <option value="mnemonic">Mnemonic</option>
      </select>
    </div>
  );
}
