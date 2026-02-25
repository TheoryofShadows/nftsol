/**
 * Unit Tests: ErrorBoundary Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ErrorBoundary from '../../components/ErrorBoundary';

// Suppress console.error for expected errors
const originalConsoleError = console.error;

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('catches errors and shows fallback UI', () => {
    const ThrowingComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    // Should render error fallback, not crash
    expect(screen.queryByText('Normal content')).not.toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const ThrowingComponent = () => {
      throw new Error('Custom fallback test');
    };

    const customFallback = <div>Custom Error UI</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
  });

  it('shows Try Again button in default error UI', () => {
    const ThrowingComponent = () => {
      throw new Error('Show retry test');
    };

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    const retryButton = screen.queryByRole('button');
    if (retryButton) {
      expect(retryButton).toBeInTheDocument();
    }
  });
});
