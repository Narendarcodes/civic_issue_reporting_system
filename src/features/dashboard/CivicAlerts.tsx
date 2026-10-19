import React from 'react';
import { cn } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const CivicAlerts = () => {
  const alerts = [
    { title: 'Water Supply Interruption', area: 'Jubilee Hills', time: 'Tomorrow, 9 AM - 4 PM', type: 'warning' },
    { title: 'Road Maintenance', area: 'Banjara Hills Rd 12', time: 'Ongoing', type: 'info' },
    { title: 'Vaccination Drive', area: 'Community Center', time: 'Sat, 10 AM', type: 'success' },
  ];

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Neighborhood Alerts</h3>
        <Badge variant="danger" className="animate-pulse">Live</Badge>
      </div>
      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <div key={i} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-900">{alert.title}</p>
              <div className={cn(
                "w-2 h-2 rounded-full",
                alert.type === 'warning' ? "bg-amber-500" : alert.type === 'success' ? "bg-emerald-500" : "bg-blue-500"
              )} />
            </div>
            <p className="text-[10px] text-slate-500 font-medium">{alert.area} • {alert.time}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};
