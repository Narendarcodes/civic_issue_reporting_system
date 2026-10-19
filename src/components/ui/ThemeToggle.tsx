import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { cn } from '../../lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme();
  const dark = resolved === 'dark';
  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className={cn('grid h-9 w-9 place-items-center rounded-full text-fg-muted hover:bg-surface-muted hover:text-fg transition-colors', className)}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
