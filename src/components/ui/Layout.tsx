import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, BookOpen, LayoutDashboard, Edit3, GraduationCap } from 'lucide-react';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/flashcards', icon: BookOpen, label: 'Flashcards' },
  { to: '/quiz', icon: GraduationCap, label: 'Quiz' },
  { to: '/editor', icon: Edit3, label: 'Editor' },
];

export function Layout({ dark, onToggleDark, children }: {
  dark: boolean;
  onToggleDark: () => void;
  children: React.ReactNode;
}) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg tracking-tight">CCMA Study</span>
          <nav className="hidden sm:flex gap-1">
            {NAV.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === to
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <button
            onClick={onToggleDark}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex">
        {NAV.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
              pathname === to
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 dark:text-gray-500'
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
