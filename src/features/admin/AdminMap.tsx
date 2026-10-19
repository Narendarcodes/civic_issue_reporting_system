import React, { useMemo, useState } from 'react';
import { Flame, MapPin, AlarmClockOff } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { CATEGORIES, categoryMeta, isOpen, slaState, stageOf } from '../../lib/civic';
import { cn } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Segmented } from '../../components/ui/Segmented';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/EmptyState';
import { BaseMap, FitBounds } from '../../components/map/BaseMap';
import { ClusterLayer } from '../../components/map/ClusterLayer';
import { HeatLayer } from '../../components/map/HeatLayer';
import { ManageIssueDrawer } from './ManageIssueDrawer';

/** Full-screen operations map: clusters, category pins, heat layer, overdue filter. */
export function AdminMap() {
  const { issues, issuesLoading, issuesError, refresh } = useApp();
  const [layer, setLayer] = useState<'markers' | 'heat'>('markers');
  const [scope, setScope] = useState<'open' | 'overdue' | 'all'>('open');
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<any>(null);

  const shown = useMemo(() => issues.filter(i => stageOf(i) !== 'Rejected' && !hidden.has(i.category)
    && (scope === 'all' || (scope === 'open' ? isOpen(i) : isOpen(i) && slaState(i).overdue))), [issues, hidden, scope]);
  const toggle = (c: string) => setHidden(h => { const n = new Set(h); n.has(c) ? n.delete(c) : n.add(c); return n; });

  if (issuesError && !issues.length) return <ErrorState message={issuesError} onRetry={refresh} />;

  return (
    <div>
      <PageHeader eyebrow="Operations" title="City map" subtitle="Every report in one view. Zoom in to break clusters apart; click a pin to manage the ticket."
        actions={<>
          <Segmented size="sm" label="Scope" value={scope} onChange={setScope} options={[{ value: 'open', label: 'Open' }, { value: 'overdue', label: 'Overdue', icon: <AlarmClockOff size={12} /> }, { value: 'all', label: 'All' }]} />
          <Segmented size="sm" label="Layer" value={layer} onChange={setLayer} options={[{ value: 'markers', label: 'Pins', icon: <MapPin size={12} /> }, { value: 'heat', label: 'Heat', icon: <Flame size={12} /> }]} />
        </>} />
      <Card className="relative overflow-hidden">
        {issuesLoading ? <Skeleton className="h-[calc(100vh-220px)] min-h-[520px] w-full rounded-none" /> : (
          <BaseMap zoom={12} className="h-[calc(100vh-220px)] min-h-[520px]" scrollWheelZoom label="Operations map">
            {layer === 'heat' ? <HeatLayer issues={shown} /> : <ClusterLayer issues={shown} onSelect={setSelected} />}
            <FitBounds points={shown.map(i => [i.latitude, i.longitude] as [number, number])} maxZoom={13} />
          </BaseMap>
        )}
        <div className="absolute left-3 bottom-3 z-[500] max-w-[calc(100%-24px)] rounded-[var(--radius-lg)] glass-overlay p-3 shadow-[var(--shadow-e2)]">
          <p className="eyebrow mb-2">Categories · {shown.length} shown</p>
          <div className="flex flex-wrap gap-1.5 max-w-[520px]">
            {CATEGORIES.map(c => {
              const m = categoryMeta(c);
              const off = hidden.has(c);
              return (
                <button key={c} onClick={() => toggle(c)} aria-pressed={!off}
                  className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-opacity', off ? 'border-line opacity-45' : 'border-transparent bg-surface')}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />{m.short}
                </button>
              );
            })}
          </div>
        </div>
      </Card>
      <ManageIssueDrawer issue={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
