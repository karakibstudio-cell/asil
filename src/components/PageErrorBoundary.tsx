import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class PageErrorBoundary extends Component<Props, State> {
  declare public props: Props;
  declare public setState: (updater: Partial<State> | ((prevState: State) => Partial<State>)) => void;

  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PageErrorBoundary] Caught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.hash = '#/hotels';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center bg-[#F8F7F4] px-4 py-16" dir="rtl">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200 shadow-xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-cairo font-bold text-stone-900 mb-2">
              {this.props.fallbackTitle || 'تعذر عرض تفاصيل الفندق حالياً'}
            </h2>

            <p className="text-xs sm:text-sm text-stone-600 mb-6 leading-relaxed">
              حدث خطأ مؤقت أثناء تحميل البيانات. يرجى إعادة المحاولة أو العودة إلى قائمة الفنادق المتاحة.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة إلى قائمة الفنادق</span>
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تحديث</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
