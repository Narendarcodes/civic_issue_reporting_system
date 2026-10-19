import React from 'react';
import { cn } from '../../lib/utils';
import { Card } from './Card';

export const StatCard = ({ label, value, icon, trend }: any) => (
  <Card className="p-6 space-y-4 hover:border-civic-primary/30 transition-all group relative overflow-hidden">
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-civic-primary/5 to-transparent rounded-full -mr-8 -mt-8" />
    <div className="flex items-center justify-between relative z-10">
      <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-civic-primary/10 transition-colors">
        {icon && React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 24 }) : icon}
      </div>
      {trend && (
        <span className={cn(
          "text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider",
          trend.includes('+') ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500"
        )}>
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
    </div>
  </Card>
);
