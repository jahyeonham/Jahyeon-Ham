import React from 'react';
import { Plus, User, RotateCcw, Download, LogOut, ShieldCheck, Link2 } from 'lucide-react';

interface AdminBarProps {
  onAddNewProject: (isDigital?: boolean) => void;
  onEditAbout: () => void;
  onEditLinks?: () => void;
  onResetDefault: () => void;
  onExportJson: () => void;
  onLogout: () => void;
}

export const AdminBar: React.FC<AdminBarProps> = ({
  onAddNewProject,
  onEditAbout,
  onEditLinks,
  onResetDefault,
  onExportJson,
  onLogout,
}) => {
  return (
    <div
      id="admin-top-bar"
      className="sticky top-0 z-40 bg-[#1A1A1A] text-white border-b border-white/10 px-4 sm:px-8 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs"
    >
      {/* Admin Status */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 font-bold tracking-wider uppercase text-emerald-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>ADMIN ACTIVE</span>
        </span>
        <span className="hidden sm:inline text-white/40">|</span>
        <span className="hidden sm:inline text-white/60 text-[11px]">
          포트폴리오 실시간 편집 모드 (비밀번호: 0115)
        </span>
      </div>

      {/* Admin Actions */}
      <div className="flex items-center flex-wrap gap-2">
        <button
          onClick={() => onAddNewProject(false)}
          className="px-2.5 py-1.5 bg-white text-[#1A1A1A] font-bold text-[10px] tracking-wider uppercase hover:bg-white/90 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>새 프로젝트 추가</span>
        </button>

        <button
          onClick={onEditAbout}
          className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] tracking-wider uppercase transition-colors flex items-center gap-1 cursor-pointer"
        >
          <User className="w-3.5 h-3.5" />
          <span>소개글 수정</span>
        </button>

        {onEditLinks && (
          <button
            onClick={onEditLinks}
            className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] tracking-wider uppercase transition-colors flex items-center gap-1 cursor-pointer"
            title="LinkedIn, Contact 이메일, CONNECT 소셜 링크 수정"
          >
            <Link2 className="w-3.5 h-3.5 text-blue-400" />
            <span>링크/연락처 관리</span>
          </button>
        )}

        <button
          onClick={onExportJson}
          className="hidden md:flex px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] tracking-wider uppercase transition-colors items-center gap-1 cursor-pointer"
          title="현재 데이터를 JSON으로 내보내거나 백업합니다"
        >
          <Download className="w-3.5 h-3.5" />
          <span>백업/내보내기</span>
        </button>

        <button
          onClick={onResetDefault}
          className="px-2.5 py-1.5 bg-white/10 hover:bg-red-900/40 text-red-300 font-bold text-[10px] tracking-wider uppercase transition-colors flex items-center gap-1 cursor-pointer"
          title="초기 기본 데이터로 복원합니다"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">기본값 복원</span>
        </button>

        <button
          onClick={onLogout}
          className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-[10px] tracking-wider uppercase transition-colors flex items-center gap-1 cursor-pointer ml-1"
          title="관리자 모드 종료"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>종료</span>
        </button>
      </div>
    </div>
  );
};
