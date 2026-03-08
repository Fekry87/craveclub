import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

function ThrowingComponent() {
  throw new Error('Test error');
}

function GoodComponent() {
  return <div>Everything is fine</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Everything is fine')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    // Suppress React error boundary console noise
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Refresh Page')).toBeInTheDocument();

    spy.mockRestore();
  });
});
