import { Component } from 'react';

/**
 * Route-scoped error boundary — catches render errors without crashing the whole app.
 */
export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('[RouteErrorBoundary]', error, errorInfo);
    }
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (typeof this.props.onRetry === 'function') {
      this.props.onRetry();
    }
  };

  render() {
    const { hasError } = this.state;
    const { children, fallback: Fallback } = this.props;

    if (hasError && Fallback) {
      return (
        <Fallback error={this.state.error} onRetry={this.handleRetry} />
      );
    }

    if (hasError) {
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-[15px] font-medium text-[#1a1a18]">Something went wrong</p>
          <p className="max-w-sm text-[13px] text-[#6b6b68]">
            Try again. If the problem continues, reload the page.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded-[8px] bg-[#1a1a18] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#2d2d2b]"
          >
            Try again
          </button>
        </div>
      );
    }

    return children;
  }
}
