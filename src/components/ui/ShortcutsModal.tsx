const SHORTCUTS = [
  { section: 'Flashcards', rows: [
    ['Space', 'Flip card'],
    ['← →', 'Navigate'],
    ['G', 'Got It'],
    ['L', 'Still Learning'],
    ['F', 'Flag card'],
  ]},
  { section: 'Spaced Rep', rows: [
    ['Space', 'Reveal answer'],
    ['1', 'Again'],
    ['2', 'Hard'],
    ['3', 'Good'],
    ['4', 'Easy'],
  ]},
  { section: 'Multiple Choice', rows: [['1–4', 'Select answer']] },
  { section: 'Typed Answer', rows: [['Enter', 'Submit / Next']] },
  { section: 'Global', rows: [['?', 'Show shortcuts']] },
];

export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-lg leading-none">✕</button>
        </div>
        <div className="space-y-4">
          {SHORTCUTS.map(({ section, rows }) => (
            <div key={section}>
              <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide mb-2">{section}</p>
              <table className="w-full text-sm">
                <tbody>
                  {rows.map(([key, desc]) => (
                    <tr key={key} className="border-t border-gray-100 dark:border-gray-800 first:border-0">
                      <td className="py-1.5 pr-4 w-20">
                        <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs font-mono">{key}</kbd>
                      </td>
                      <td className="py-1.5 text-gray-600 dark:text-gray-400">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
