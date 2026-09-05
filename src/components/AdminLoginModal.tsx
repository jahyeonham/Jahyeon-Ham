import React, { useState } from 'react';
import { Lock, X, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '0115') {
      setError(null);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setPassword('');
        onLoginSuccess();
        onClose();
      }, 500);
    } else {
      setError('비밀번호가 올바르지 않습니다. 다시 확인해주세요.');
    }
  };

  return (
    <div
      id="admin-login-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="admin-login-modal"
        className="bg-[#F8F8F7] text-[#1A1A1A] border border-[#1A1A1A] w-full max-w-md p-6 sm:p-8 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-admin-login-btn"
          onClick={onClose}
          className="absolute top-5 right-5 text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors cursor-pointer p-1"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="w-10 h-10 bg-[#1A1A1A] text-white flex items-center justify-center mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 text-[#1A1A1A] mb-1">
            PORTFOLIO ADMIN
          </p>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight uppercase text-[#1A1A1A]">
            관리자 모드 접속
          </h2>
          <p className="text-xs text-[#555] mt-1.5 leading-relaxed">
            포트폴리오 내용(프로젝트, 소개글 등)을 직접 수정하고 관리할 수 있습니다.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1.5">
              비밀번호 입력
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="비밀번호를 입력하세요"
                autoFocus
                className="w-full pl-3 pr-10 py-2.5 text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#1A1A1A]/50 hover:text-[#1A1A1A] p-1 cursor-pointer"
                title={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2.5 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>인증 성공! 관리자 모드로 전환합니다...</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[#1A1A1A] text-white text-[11px] font-bold tracking-[0.2em] uppercase hover:opacity-85 transition-opacity flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>관리자 로그인</span>
          </button>
        </form>
      </div>
    </div>
  );
};
