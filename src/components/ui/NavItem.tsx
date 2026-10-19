import React from 'react';
import { cn } from '../../lib/utils';

export const NavItem = ({ active, icon, label, onClick }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-medium",
      active ? "bg-civic-primary text-white shadow-lg shadow-civic-primary/25" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    )}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// --- Main App ---
