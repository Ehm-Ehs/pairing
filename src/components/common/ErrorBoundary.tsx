import { Component, ErrorInfo, ReactNode } from "react";
import Error from "../nav/error";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Error
          code="500"
          title="Something went wrong"
          message="We're sorry, but an unexpected error occurred. Please try refreshing the page."
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
