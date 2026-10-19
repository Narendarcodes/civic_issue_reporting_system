import React from 'react';
import { cn } from '../../lib/utils';

export const Button = ({ variant = 'primary', className, ...props }: any) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 active:scale-[0.98]',
    ghost: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition-all duration-200 active:scale-[0.98]',
    danger: 'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-civic-danger text-white font-semibold shadow-sm shadow-civic-danger/20 hover:brightness-95 transition-all duration-200 active:scale-[0.98]',
  };
  return (
    <button 
      className={cn(variants[variant as keyof typeof variants], className)} 
      {...props} 
    />
  );
};
