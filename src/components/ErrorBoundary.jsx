import { Component } from "react";
import ErrorPage from './ErrorPage'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true, 
      error,
      errorId: Date.now()
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    this.logError(error, errorInfo);
    this.reportError(error, errorInfo);
  }

  logError = (error, errorInfo) => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };
    
    console.group("🚨 Error Caught by Boundary");
    console.error("Error:", error);
    console.error("Error Info:", errorInfo);
    console.error("Error Details:", errorDetails);
    console.groupEnd();
  };

  reportError = async (error, errorInfo) => {
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, this.state.errorId);
    }
    
    // Send to error reporting service if provided
    if (this.props.errorService) {
      try {
        await this.props.errorService.report({
          errorId: this.state.errorId,
          error: error.toString(),
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href
        });
      } catch (reportingError) {
        console.warn("Failed to report error:", reportingError);
      }
    }
  };

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
    
    if (this.props.onReset) {
      this.props.onReset(this.state.error, this.state.errorInfo);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const fallbackProps = {
        error: this.state.error,
        errorInfo: this.state.errorInfo,
        errorId: this.state.errorId,
        onReset: this.handleReset,
        onReload: this.handleReload
      };

      return this.props.fallback ? (
        this.props.fallback(fallbackProps)
      ) : (
        <ErrorPage
          {...fallbackProps}
          showDetails={this.props.showDetails ?? import.meta.env.DEV}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;