import { Component, ErrorInfo } from 'react';
import { Button } from './button';

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
};

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

class ErrorBoundary<P extends ErrorBoundaryProps> extends Component<P, ErrorBoundaryState> {
  constructor(props: P) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);

    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center min-h-screen bg-gray-150 p-2xl"
          role="alert"
          aria-live="assertive"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Oops! Something went wrong. Try to refresh the page.
          </h1>

          <Button
            className="text-white px-4 py-2"
            onClick={() => window.location.reload()}
            aria-label="Refresh page to recover from error"
          >
            Refresh
          </Button>

          <details
            className="mt-4 p-4 border border-gray-300 rounded bg-white shadow-md max-w-2xl"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            <summary className="cursor-pointer text-sm font-semibold text-gray-700 mb-2">
              Technical Details (Click to expand)
            </summary>
            {this.state.error && <span className="text-red-500 block mb-2">{this.state.error.toString()}</span>}
            {this.state.errorInfo?.componentStack && (
              <span className="text-gray-600 text-xs">{this.state.errorInfo.componentStack}</span>
            )}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
