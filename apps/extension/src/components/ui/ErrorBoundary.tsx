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

class ErrorBoundary<P extends ErrorBoundaryProps> extends Component<
  P,
  ErrorBoundaryState
> {
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-2xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Oops! Something went wrong. Try to refresh the page.
          </h1>

          <Button
            className=" text-white px-4 py-2"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>

          <details
            className="mt-4 p-4 border border-gray-300 rounded bg-white shadow-md"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {this.state.error && (
              <span className="text-red-500">
                {this.state.error.toString()}
              </span>
            )}
            <br />
            {this.state.errorInfo?.componentStack && (
              <span className="text-gray-600">
                {this.state.errorInfo.componentStack}
              </span>
            )}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
