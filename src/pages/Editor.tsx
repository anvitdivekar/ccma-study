import { useState, useMemo } from 'react';
import type { Card, CardType, Difficulty } from '../types';
import { getOverlay, setOverlay } from '../store/storage';
import { Plus, Save, Trash2, Search } from 'lucide-react';

const CATEGORIES = [
  'Regulatory Bodies', 'Blood Draw', 'Patient Positioning', 'Vital Signs',
  'Legal/Consent', 'Infection Control', 'Anatomy', 'Medical Terminology',
  'ECG/EKG', 'Urinalysis', 'Medications', 'OSHA/Safety', 'Uncategorized',
];

export function Editor({ cards, onRefresh }: { cards: Card[]; onRefresh: () => void }) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Card | null>(null);
  const [overlay, setLocalOverlay] = useState(getOverlay);

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return cards.filter((c) => !q || c.term.toLowerCase().includes(q) || c.definition.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
  }, [cards, search]);

  function save(card: Card) {
    const { id, ...rest } = card;
    const newOverlay = { ...overlay, [id]: rest };
    setOverlay(newOverlay);
    setLocalOverlay(newOverlay);
    setEditing(null);
    onRefresh();
  }

  function deleteCard(id: string) {
    const newOverlay = { ...overlay, [id]: { ...(overlay[id] ?? {}), deleted: true } };
    setOverlay(newOverlay);
    setLocalOverlay(newOverlay);
    onRefresh();
  }

  function newCard() {
    const id = `custom-${Date.now()}`;
    setEditing({ id, term: '', definition: '', type: 'term', category: 'Uncategorized', difficulty: 'unrated' });
  }

  return (
    <div className="space-y-4 pb-20 sm:pb-0">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search cards…"
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none" />
        </div>
        <button onClick={newCard} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus size={15} /> New
        </button>
      </div>

      <p className="text-xs text-gray-400">{visible.length} cards · edits overlay base data (re-running parser won't erase them)</p>

      {editing && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-indigo-400 p-4 space-y-3">
          <p className="text-sm font-semibold">Editing card</p>
          <div className="grid grid-cols-1 gap-2">
            <Field label="Term" value={editing.term} onChange={(v) => setEditing({ ...editing, term: v })} />
            <Field label="Definition" value={editing.definition} onChange={(v) => setEditing({ ...editing, definition: v })} multiline />
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs text-gray-500">
                Type
                <select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as CardType })}
                  className="block w-full mt-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
                  <option value="term">term</option>
                  <option value="note">note</option>
                  <option value="mnemonic">mnemonic</option>
                </select>
              </label>
              <label className="text-xs text-gray-500 col-span-2">
                Category
                <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="block w-full mt-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
                  {[...new Set([...CATEGORIES, editing.category])].sort().map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
            </div>
            <label className="text-xs text-gray-500">
              Difficulty
              <select value={editing.difficulty} onChange={(e) => setEditing({ ...editing, difficulty: e.target.value as Difficulty })}
                className="block w-full mt-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
                <option value="unrated">unrated</option>
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={() => save(editing)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
              <Save size={14} /> Save
            </button>
            <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {visible.map((card) => (
          <div key={card.id} className="flex gap-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium truncate">{card.term || '(no term)'}</span>
                <span className="text-xs text-gray-400 shrink-0">{card.type}</span>
              </div>
              <p className="text-xs text-gray-500 truncate">{card.definition}</p>
              <span className="text-xs text-indigo-500">{card.category}</span>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => setEditing({ ...card })} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500">
                ✏️
              </button>
              <button onClick={() => deleteCard(card.id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors text-rose-400">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const cls = "block w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-indigo-400";
  return (
    <label className="text-xs text-gray-500">
      {label}
      {multiline
        ? <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
        : <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      }
    </label>
  );
}
