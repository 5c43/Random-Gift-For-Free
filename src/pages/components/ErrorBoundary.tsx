import * as React from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if ((this as any).state.hasError) {
      let errorDetails = null;
      try {
        if ((this as any).state.error?.message) {
          errorDetails = JSON.parse((this as any).state.error.message);
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#161616] border border-[#262626] rounded-3xl p-10 shadow-2xl text-center">
            <div className="h-20 w-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            
            <h2 className="text-3xl font-black text-white mb-4">Something went wrong</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              {errorDetails ? 'A database error occurred. This might be due to missing permissions or a configuration issue.' : 'An unexpected error occurred. Please try again or return home.'}
            </p>

            {errorDetails && (
              <div className="bg-black/40 rounded-2xl p-4 mb-8 text-left border border-white/5 overflow-hidden">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Error Details</p>
                <p className="text-xs font-mono text-red-400/80 break-all line-clamp-4">
                  {errorDetails.error}
                </p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-4 mb-1">Path</p>
                <p className="text-xs font-mono text-gray-300">{errorDetails.path || 'N/A'}</p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-white text-black font-bold py-4 rounded-xl transition-all hover:bg-gray-200 flex items-center justify-center gap-2"
              >
                <RefreshCcw className="h-5 w-5" />
                Try Again
              </button>
              <button
                onClick={this.handleReset}
                className="w-full bg-white/5 text-white font-bold py-4 rounded-xl transition-all hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2"
              >
                <Home className="h-5 w-5" />
                Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
