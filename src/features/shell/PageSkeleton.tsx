import React from 'react';
import { Skeleton, StatSkeleton, IssueCardSkeleton } from '../../components/ui/Skeleton';

/** Generic loading state for any screen while its chunk / data arrives. */
export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-8 w-72" /><Skeleton className="h-4 w-96 max-w-full" /></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[0, 1, 2, 3].map(i => <StatSkeleton key={i} />)}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{[0, 1, 2].map(i => <IssueCardSkeleton key={i} />)}</div>
    </div>
  );
}
