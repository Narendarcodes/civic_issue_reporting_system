import React, { useId } from 'react';
import { cn } from '../../lib/utils';

export function Field({ label, hint, error, children, className, htmlFor }: { label: React.ReactNode; hint?: React.ReactNode; error?: string; children: (id: string) => React.ReactNode; className?: string; htmlFor?: string }) {
  const id = useId();
  const fid = htmlFor || id;
  return (
    <div className={className}>
      <label htmlFor={fid} className="label">{label}</label>
      {children(fid)}
      {error ? <p className="mt-1.5 text-xs font-medium text-danger">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn('modern-input', className)} {...p} />;
});
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn('modern-input min-h-[110px] leading-relaxed', className)} {...p} />;
});
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...p }, ref) {
  return <select ref={ref} className={cn('modern-input pr-8', className)} {...p} />;
});
