'use client';

import React from 'react';

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: 'red', color: 'white', height: '100vh', width: '100vw', zIndex: 9999, position: 'fixed', top: 0, left: 0 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Algo deu errado (Client-side Crash)!</h1>
          <pre style={{ marginTop: '20px', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.toString()}
          </pre>
          <pre style={{ marginTop: '20px', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
