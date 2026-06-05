import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed bottom-4 right-4 bg-red-900 border border-red-500/30 text-red-200 text-xs p-3.5 rounded-lg shadow-2xl z-50 max-w-sm backdrop-blur-md">
          <p className="font-bold uppercase tracking-wider text-[10px] text-red-400">SearchPalette Error</p>
          <p className="opacity-95 mt-1 font-mono text-[9px] break-all">{this.state.error?.toString()}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 text-[9px] uppercase font-bold text-white hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
