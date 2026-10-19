import React from 'react';
import { ErrorState } from '../../components/ui/EmptyState';

/** Keeps one broken screen from blanking the whole app. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error('Screen crashed:', error); }
  render() {
    if (this.state.error) {
      return <ErrorState message="This screen hit an unexpected error. Reloading usually fixes it." onRetry={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
