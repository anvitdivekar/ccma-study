import { useMemo } from 'react';
import baseCards from '../data/cards.json';
import { getOverlay } from '../store/storage';
import type { Card } from '../types';

export function useCards(): Card[] {
  return useMemo(() => {
    const overlay = getOverlay();
    const patched = (baseCards as Card[]).map((card) => {
      const patch = overlay[card.id];
      if (!patch) return card;
      if (patch.deleted) return null;
      return { ...card, ...patch } as Card;
    }).filter(Boolean) as Card[];

    // Add any new cards created in the editor (ids not in base)
    const baseIds = new Set((baseCards as Card[]).map((c) => c.id));
    for (const [id, patch] of Object.entries(overlay)) {
      if (!baseIds.has(id) && !patch.deleted) {
        patched.push({ id, term: '', definition: '', type: 'term', category: 'Uncategorized', difficulty: 'unrated', ...patch } as Card);
      }
    }
    return patched;
  }, []); // overlay is read synchronously on mount
}

export function useCategories(cards: Card[]): string[] {
  return useMemo(() => [...new Set(cards.map((c) => c.category))].sort(), [cards]);
}
