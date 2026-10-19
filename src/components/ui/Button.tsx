import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'subtle';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const base =
  'inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap select-none rounded-[var(--radius-md)] ' +
  'transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.98] ' +
  'disabled:opacity-50 disabled:pointer-events-none';
const variants: Record<Variant, string> = {
  primary: 'bg-brand text-brand-fg shadow-[var(--shadow-e1)] hover:bg-brand-strong',
  secondary: 'bg-surface text-fg border border-line shadow-[var(--shadow-e1)] hover:bg-surface-muted hover:border-line-strong',
  outline: 'bg-transparent text-fg border border-line hover:bg-surface-muted hover:border-line-strong',
  ghost: 'bg-transparent text-fg-muted hover:text-fg hover:bg-surface-muted',
  subtle: 'bg-brand-soft text-brand-strong hover:brightness-95',
  danger: 'bg-danger text-white shadow-[var(--shadow-e1)] hover:brightness-95',
};
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px]',
  icon: 'h-10 w-10 p-0',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, leftIcon, className, children, disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {loading ? <Loader2 className="animate-spin" size={16} aria-hidden /> : leftIcon}
      {children}
    </button>
  );
});
