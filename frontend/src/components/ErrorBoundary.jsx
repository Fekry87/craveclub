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
          background: '#060d1f', padding: 24,
        }}>
          <div style={{
            maxWidth: 600, width: '100%', textAlign: 'center',
            background: 'linear-gradient(145deg, rgba(13,31,60,0.6) 0%, rgba(10,22,40,0.4) 100%)',
            borderRadius: 20, padding: '48px 32px',
            border: '1px solid rgba(244,63,94,0.15)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, margin: '0 auto 20px',
              background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>!</div>
            <h2 style={{
              color: '#f1f5f9', fontFamily: "'Outfit', sans-serif",
              fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px',
            }}>Something went wrong</h2>
            <p style={{
              color: '#64748b', fontSize: '0.875rem', margin: '0 0 16px',
              fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5,
            }}>
              An unexpected error occurred. Please try refreshing the page.
            </p>

            {/* Error details (for debugging) */}
            <div style={{
              background: 'rgba(0,0,0,0.3)', borderRadius: 12,
              padding: '14px 16px', marginBottom: 20,
              border: '1px solid rgba(244,63,94,0.1)',
              textAlign: 'left', maxHeight: 200, overflowY: 'auto',
            }}>
              <div style={{
                color: '#f87171', fontSize: 13, fontFamily: 'monospace',
                wordBreak: 'break-word', lineHeight: 1.5,
              }}>
                {errorMessage}
              </div>
              {componentStack && (
                <div style={{
                  color: '#475569', fontSize: 11, fontFamily: 'monospace',
                  marginTop: 8, whiteSpace: 'pre-wrap', lineHeight: 1.4,
                }}>
                  {componentStack.trim().split('\n').slice(0, 6).join('\n')}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '10px 24px', borderRadius: 10,
                  border: '1px solid rgba(34,211,238,0.2)',
                  background: 'rgba(34,211,238,0.08)',
                  color: '#22d3ee', fontWeight: 600, fontSize: '0.875rem',
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 24px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
                  color: '#060d1f', fontWeight: 600, fontSize: '0.875rem',
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >
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
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: 400, gap: 16, padding: 32,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>!</div>
          <h3 style={{
            color: '#f1f5f9', fontFamily: "'Outfit', sans-serif",
            fontSize: 18, fontWeight: 600, margin: 0,
          }}>Page Error</h3>
          <p style={{
            color: '#64748b', fontSize: 13, margin: 0, textAlign: 'center', maxWidth: 360,
          }}>
            This page encountered an error. Other pages should still work.
          </p>

          {/* Show the error for debugging */}
          <div style={{
            background: 'rgba(0,0,0,0.25)', borderRadius: 10,
            padding: '10px 14px', maxWidth: 480, width: '100%',
            border: '1px solid rgba(244,63,94,0.1)',
          }}>
            <code style={{
              color: '#f87171', fontSize: 12, fontFamily: 'monospace',
              wordBreak: 'break-word',
            }}>
              {this.state.error?.message || 'Unknown error'}
            </code>
          </div>

          <button
            onClick={this.handleRetry}
            style={{
              padding: '9px 22px', borderRadius: 10,
              border: '1px solid rgba(34,211,238,0.2)',
              background: 'rgba(34,211,238,0.08)',
              color: '#22d3ee', fontWeight: 600, fontSize: 13,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
