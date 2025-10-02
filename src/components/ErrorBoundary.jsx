import React from 'react';
import { Result, Button } from 'antd';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="500"
          title="500"
          subTitle={
            <div>
              <p>Sorry, something went wrong with the application.</p>
              {this.state.error && (
                <details style={{ marginTop: '16px', textAlign: 'left', background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
                  <pre style={{ marginTop: '8px', fontSize: '12px', color: '#d32f2f' }}>
                    {this.state.error.toString()}
                    {this.state.error.stack && `\n\n${this.state.error.stack}`}
                  </pre>
                </details>
              )}
            </div>
          }
          extra={
            <Button 
              type="primary" 
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Reload Application
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;