import React, { Component, ErrorInfo, ReactNode } from 'react';
import { clearAllPortfolioStorage } from '../storageManager';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error in React tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetAndReload = async () => {
    try {
      await clearAllPortfolioStorage();
      sessionStorage.clear();
      localStorage.clear();
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
    window.location.hash = '';
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#F8F8F7] text-[#1A1A1A] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full border border-[#1A1A1A]/15 bg-white p-8 shadow-sm space-y-4">
            <span className="text-[11px] font-mono uppercase tracking-widest text-red-600 bg-red-50 px-2.5 py-1 inline-block">
              PORTFOLIO INITIALIZATION NOTICE
            </span>
            <h1 className="text-xl font-bold uppercase tracking-tight text-[#1A1A1A]">
              페이지를 표시하는 중 일시적인 오류가 발생했습니다
            </h1>
            <p className="text-xs text-[#555] leading-relaxed">
              저장된 캐시 데이터 또는 브라우저 환경 차이로 인해 렌더링에 문제가 발생했을 수 있습니다. 아래 버튼을 눌러 다시 로드해주세요.
            </p>
            {this.state.error && (
              <pre className="text-[10px] font-mono text-left bg-neutral-50 p-3 border border-neutral-200 overflow-x-auto text-neutral-600 max-h-32">
                {this.state.error.toString()}
              </pre>
            )}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                onClick={this.handleReload}
                className="px-4 py-2.5 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-opacity cursor-pointer"
              >
                페이지 새로고침
              </button>
              <button
                onClick={this.handleResetAndReload}
                className="px-4 py-2.5 border border-[#1A1A1A]/30 text-[#1A1A1A] text-xs font-bold uppercase tracking-wider hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                데이터 초기화 후 복구
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
