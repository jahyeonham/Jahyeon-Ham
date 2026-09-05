import React, { useState, useEffect } from 'react';
import { X, Save, Upload } from 'lucide-react';
import { AboutData } from '../types';
import { compressImageFile } from '../utils/imageCompressor';

interface AboutEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (aboutData: AboutData) => void;
  initialData: AboutData;
}

export const AboutEditModal: React.FC<AboutEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [greeting, setGreeting] = useState('');
  const [paragraphsText, setParagraphsText] = useState('');
  const [location, setLocation] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  useEffect(() => {
    if (initialData) {
      setGreeting(initialData.greeting);
      setParagraphsText(initialData.paragraphs.join('\n\n'));
      setLocation(initialData.location);
      setPhotoUrl(initialData.photoUrl);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 1600, 0.82);
        setPhotoUrl(compressed);
      } catch {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setPhotoUrl(result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paragraphs = paragraphsText
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean);

    onSave({
      greeting: greeting.trim(),
      paragraphs: paragraphs.length > 0 ? paragraphs : initialData.paragraphs,
      location: location.trim(),
      photoUrl: photoUrl.trim(),
    });
    onClose();
  };

  return (
    <div
      id="about-edit-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="about-edit-modal"
        className="bg-[#F8F8F7] text-[#1A1A1A] border border-[#1A1A1A] w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative my-8"
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

        {/* Header */}
        <div className="mb-6 border-b border-[#1A1A1A]/10 pb-4">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 text-[#1A1A1A] mb-1">
            ABOUT ME MANAGER
          </p>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight uppercase text-[#1A1A1A]">
            소개글 (About Me) 수정
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Greeting Headline */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
              헤드라인 인사말 (Greeting Headline)
            </label>
            <input
              type="text"
              required
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="예: Hello, I’m Jahyeon. Nice to meet you."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>

          {/* Paragraphs */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
              소개 본문 (문단 구분은 줄바꿈 2번(엔터 2번)으로 구분됩니다)
            </label>
            <textarea
              rows={8}
              required
              value={paragraphsText}
              onChange={(e) => setParagraphsText(e.target.value)}
              placeholder="문단별로 작성해주세요..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A] resize-y leading-relaxed font-sans"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
              위치 (Location)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예: Sydney, Australia"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>

          {/* Photo URL & Upload */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
              비하인드 사진 (Photo URL 또는 파일 업로드)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="이미지 URL 주소"
                className="flex-1 px-3 py-2 text-xs sm:text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A]"
              />
              <label className="px-3 py-2 bg-[#E5E5E3] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>업로드</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            {photoUrl && (
              <div className="relative aspect-4/3 w-32 bg-[#1A1A1A] border border-[#1A1A1A]/20 overflow-hidden">
                <img
                  src={photoUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Submit / Cancel Buttons */}
          <div className="pt-4 border-t border-[#1A1A1A]/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-widest hover:opacity-85 transition-opacity flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>저장하기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
