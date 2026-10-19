import React from 'react';
import { cn } from '../../lib/utils';

export const Card = ({ children, className }: any) => (
  <div className={cn('glass-panel p-8', className)}>
    {children}
  </div>
);
