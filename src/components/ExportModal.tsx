import React, { useState } from 'react';
import { X, Copy, Check, Download } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: unknown;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="export-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="export-modal"
        className="bg-[#F8F8F7] text-[#1A1A1A] border border-[#1A1A1A] w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors cursor-pointer p-1"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4 border-b border-[#1A1A1A]/10 pb-4">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 text-[#1A1A1A] mb-1">
            DATA BACKUP
          </p>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight uppercase text-[#1A1A1A]">
            포트폴리오 데이터 백업 / 내보내기
          </h2>
          <p className="text-xs text-[#555] mt-1">
            현재 수정된 포트폴리오의 모든 데이터를 JSON 형식으로 복사하거나 파일로 다운로드할 수 있습니다.
          </p>
        </div>

        <div className="relative mb-4">
          <textarea
            readOnly
            value={jsonString}
            rows={12}
            className="w-full p-3 font-mono text-xs bg-white border border-[#1A1A1A]/20 focus:outline-none resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-[#E5E5E3] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>클립보드 복사</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider hover:opacity-85 transition-opacity flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>JSON 다운로드</span>
          </button>
        </div>
      </div>
    </div>
  );
};
