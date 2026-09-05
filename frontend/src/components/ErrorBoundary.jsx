import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ errorInfo: info });
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Unknown error';
      const errorStack = this.state.error?.stack || '';
      const componentStack = this.state.errorInfo?.componentStack || '';

      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#F5F5F7', padding: 24,
        }}>
          <div style={{
            maxWidth: 560, width: '100%', textAlign: 'start',
            background: '#FFFFFF',
            padding: 'clamp(24px, 5vw, 36px)',
            border: '1px solid #E5E5EA',
            borderRadius: 16,
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            animation: 'fadeInUp 0.3s ease-out both',
          }}>
            <div style={{
              width: 44, height: 44, marginBottom: 18, borderRadius: 12,
              background: 'rgba(255,59,48,0.12)', color: '#FF3B30',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            </div>
            <h2 style={{
              color: '#1D1D1F', fontFamily: 'var(--font-display)',
              fontSize: 18, fontWeight: 600, lineHeight: 1.3, margin: '0 0 8px',
            }}>Something went wrong</h2>
            <p style={{
              color: '#6E6E73', fontSize: 14, margin: '0 0 20px',
              fontFamily: 'var(--font-body)', lineHeight: 1.6,
            }}>
              An unexpected error occurred. Please try refreshing the page.
            </p>

            {/* Error details (for debugging) */}
            <div style={{
              background: '#F2F2F7', padding: '14px 16px', marginBottom: 22,
              borderRadius: 10,
              textAlign: 'start', maxHeight: 200, overflowY: 'auto',
            }}>
              <div style={{
                color: '#B12A20', fontSize: 12, fontFamily: 'var(--font-code)',
                wordBreak: 'break-word', lineHeight: 1.5,
              }}>
                {errorMessage}
              </div>
              {componentStack && (
                <div style={{
                  color: '#86868B', fontSize: 11, fontFamily: 'var(--font-code)',
                  marginTop: 10, whiteSpace: 'pre-wrap', lineHeight: 1.5,
                }}>
                  {componentStack.trim().split('\n').slice(0, 6).join('\n')}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={this.handleReset} className="pl-btn pl-btn-primary">
                Try Again
              </button>
              <button type="button" onClick={() => window.location.reload()} className="pl-btn pl-btn-secondary">
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight ErrorBoundary for wrapping individual route content.
 * Shows an inline error message instead of crashing the whole app.
 */
export class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[RouteError]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 400, padding: 32,
        }}>
          <div style={{
            background: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: 16,
            padding: 28, maxWidth: 460, width: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
            animation: 'fadeIn 0.3s ease-out both',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(255,59,48,0.12)', color: '#FF3B30',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            </div>
            <h3 style={{
              color: '#1D1D1F', fontFamily: 'var(--font-display)',
              fontSize: 18, fontWeight: 600, lineHeight: 1.3, margin: 0,
            }}>Page Error</h3>
            <p style={{
              color: '#6E6E73', fontSize: 14, margin: 0, textAlign: 'center', maxWidth: 360, lineHeight: 1.55,
            }}>
              This page encountered an error. Other pages should still work.
            </p>

            {/* Show the error for debugging */}
            <div style={{
              background: '#F2F2F7', padding: '10px 14px', width: '100%',
              borderRadius: 10, textAlign: 'start',
            }}>
              <code style={{
                color: '#B12A20', fontSize: 12, fontFamily: 'var(--font-code)',
                wordBreak: 'break-word', lineHeight: 1.5,
              }}>
                {this.state.error?.message || 'Unknown error'}
              </code>
            </div>

            <button type="button" onClick={this.handleRetry} className="pl-btn pl-btn-primary pl-btn-sm">
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
