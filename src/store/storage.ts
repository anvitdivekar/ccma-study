import type { SRState, MasteryState, QuizResult, EditorOverlay } from '../types';

const KEY = {
  sr: 'ccma:sr',
  mastery: 'ccma:mastery',
  history: 'ccma:history',
  overlay: 'ccma:overlay',
  streak: 'ccma:streak',
  darkMode: 'ccma:dark',
} as const;

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// SR states
export function getSRStates(): Record<string, SRState> {
  return get(KEY.sr, {});
}
export function setSRState(state: SRState) {
  const all = getSRStates();
  all[state.cardId] = state;
  set(KEY.sr, all);
}

// Mastery
export function getMasteryStates(): Record<string, MasteryState> {
  return get(KEY.mastery, {});
}
export function setMasteryState(state: MasteryState) {
  const all = getMasteryStates();
  all[state.cardId] = state;
  set(KEY.mastery, all);
}

// Quiz history
export function getHistory(): QuizResult[] {
  return get(KEY.history, []);
}
export function addHistory(result: QuizResult) {
  const all = getHistory();
  all.push(result);
  set(KEY.history, all);
}

// Editor overlay
export function getOverlay(): EditorOverlay {
  return get(KEY.overlay, {});
}
export function setOverlay(overlay: EditorOverlay) {
  set(KEY.overlay, overlay);
}

// Study streak
export function getStreak(): { count: number; lastStudyDate: string } {
  return get(KEY.streak, { count: 0, lastStudyDate: '' });
}
export function updateStreak() {
  const today = new Date().toISOString().split('T')[0];
  const { count, lastStudyDate } = getStreak();
  if (lastStudyDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const newCount = lastStudyDate === yesterday ? count + 1 : 1;
  set(KEY.streak, { count: newCount, lastStudyDate: today });
}

// Card flags
const FLAGS_KEY = 'ccma:flags';
export function getFlags(): string[] {
  return get(FLAGS_KEY, []);
}
export function toggleFlag(id: string): string[] {
  const flags = getFlags();
  const idx = flags.indexOf(id);
  const next = idx === -1 ? [...flags, id] : flags.filter((f) => f !== id);
  localStorage.setItem(FLAGS_KEY, JSON.stringify(next));
  return next;
}

// Dark mode
export function getDarkMode(): boolean {
  const stored = localStorage.getItem(KEY.darkMode);
  if (stored !== null) return stored === 'true';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
export function setDarkMode(val: boolean) {
  set(KEY.darkMode, val);
}

// Export / Import all
export function exportAll() {
  return {
    sr: getSRStates(),
    mastery: getMasteryStates(),
    history: getHistory(),
    overlay: getOverlay(),
    streak: getStreak(),
  };
}
export function importAll(data: ReturnType<typeof exportAll>) {
  set(KEY.sr, data.sr ?? {});
  set(KEY.mastery, data.mastery ?? {});
  set(KEY.history, data.history ?? []);
  set(KEY.overlay, data.overlay ?? {});
  set(KEY.streak, data.streak ?? { count: 0, lastStudyDate: '' });
}
