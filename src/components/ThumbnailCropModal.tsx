import React, { useState, useEffect } from 'react';
import { X, Crop, Check, RotateCcw } from 'lucide-react';
import { Project } from '../types';
import { ThumbnailFocalPicker } from './ThumbnailFocalPicker';

interface ThumbnailCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSave: (projectId: string, newPosition: string) => void;
}

export const ThumbnailCropModal: React.FC<ThumbnailCropModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave,
}) => {
  const [position, setPosition] = useState('50% 50%');

  useEffect(() => {
    if (project) {
      setPosition(project.thumbnailPosition || '50% 50%');
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const handleSave = () => {
    onSave(project.id, position);
    onClose();
  };

  return (
    <div
      id="thumbnail-crop-modal-overlay"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="thumbnail-crop-modal"
        className="bg-[#F8F8F7] text-[#1A1A1A] border border-[#1A1A1A] w-full max-w-2xl p-5 sm:p-7 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors cursor-pointer p-1"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-4 border-b border-[#1A1A1A]/10 pb-3">
          <Crop className="w-5 h-5 text-red-600" />
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-[#1A1A1A]">
              썸네일 노출 영역 / 초점 맞추기
            </h2>
            <p className="text-xs text-[#666]">
              <span className="font-semibold text-[#1A1A1A]">{project.title}</span> ({project.category})
            </p>
          </div>
        </div>

        {/* Focal Picker Component */}
        <ThumbnailFocalPicker
          imageUrl={project.thumbnailUrl}
          position={position}
          onChange={(newPos) => setPosition(newPos)}
        />

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-[#1A1A1A]/10">
          <button
            type="button"
            onClick={() => setPosition('50% 50%')}
            className="text-xs font-bold text-[#666] hover:text-[#1A1A1A] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본값(중앙) 복원</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#1A1A1A] bg-[#E5E5E3] hover:bg-[#D5D5D3] transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#1A1A1A] hover:bg-black transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>썸네일 위치 저장</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
