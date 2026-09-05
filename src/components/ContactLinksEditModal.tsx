import React, { useState, useEffect } from 'react';
import { X, Check, Globe, Link2, Plus, Trash2, RotateCcw, Mail, Linkedin, Instagram, Youtube, Video } from 'lucide-react';
import { ContactLinksData, CustomLinkItem } from '../types';

interface ContactLinksEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactLinks: ContactLinksData;
  onSave: (newData: ContactLinksData) => void;
  onResetDefault: () => void;
}

export const ContactLinksEditModal: React.FC<ContactLinksEditModalProps> = ({
  isOpen,
  onClose,
  contactLinks,
  onSave,
  onResetDefault,
}) => {
  const [formData, setFormData] = useState<ContactLinksData>(contactLinks);
  const [customLinks, setCustomLinks] = useState<CustomLinkItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFormData(contactLinks);
      setCustomLinks(contactLinks.customLinks || []);
    }
  }, [isOpen, contactLinks]);

  if (!isOpen) return null;

  const handleAddCustomLink = () => {
    const newLink: CustomLinkItem = {
      id: `link-${Date.now()}`,
      label: '',
      url: '',
    };
    setCustomLinks([...customLinks, newLink]);
  };

  const handleUpdateCustomLink = (id: string, field: 'label' | 'url', value: string) => {
    setCustomLinks(
      customLinks.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleDeleteCustomLink = (id: string) => {
    setCustomLinks(customLinks.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out empty custom links
    const validCustomLinks = customLinks.filter(
      (item) => item.label.trim() !== '' && item.url.trim() !== ''
    );

    onSave({
      ...formData,
      customLinks: validCustomLinks,
    });
    onClose();
  };

  return (
    <div
      id="contact-links-edit-modal-overlay"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="contact-links-edit-modal"
        className="bg-[#F8F8F7] text-[#1A1A1A] border border-[#1A1A1A] w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto"
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
        <div className="flex items-center gap-2.5 mb-5 border-b border-[#1A1A1A]/10 pb-4">
          <Link2 className="w-5 h-5 text-red-600" />
          <div>
            <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-[#1A1A1A]">
              연락처 및 외부 링크 연결 관리
            </h2>
            <p className="text-xs text-[#666]">
              상단 메뉴(Header), 하단 푸터(CONNECT/GET IN TOUCH), 문의 팝업(Contact Modal)에 노출되는 모든 링크를 직접 수정합니다.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Main Contact & LinkedIn */}
          <div className="bg-white border border-[#1A1A1A]/15 p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5 pb-2 border-b border-[#1A1A1A]/10">
              <Mail className="w-4 h-4 text-[#1A1A1A]/70" />
              <span>기본 연락처 및 필수 링크</span>
            </h3>

            {/* Email Field */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
                대표 이메일 주소 (Email) <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@gmail.com"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F8F8F7] border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A] font-mono"
                />
              </div>
              <span className="text-[10px] text-[#777] mt-1 block">
                상단 Contact 팝업 복사/발송 버튼 및 하단 푸터 'GET IN TOUCH'에 연결됩니다.
              </span>
            </div>

            {/* LinkedIn Field */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1 flex items-center justify-between">
                <span>LinkedIn 프로필 URL <span className="text-red-600">*</span></span>
                <span className="text-[10px] text-blue-600 font-normal">상단 헤더 & 푸터 & 팝업 동시 반영</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#F0F0EE] border border-[#1A1A1A]/20 text-blue-700">
                  <Linkedin className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  required
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  placeholder="https://www.linkedin.com/in/username"
                  className="flex-1 px-3 py-2 text-xs sm:text-sm bg-[#F8F8F7] border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A] font-mono"
                />
              </div>
            </div>

            {/* Location Text */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
                거주 / 활동 위치 텍스트 (Location)
              </label>
              <input
                type="text"
                value={formData.locationText || ''}
                onChange={(e) => setFormData({ ...formData, locationText: e.target.value })}
                placeholder="Sydney, Australia"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F8F8F7] border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A]"
              />
              <span className="text-[10px] text-[#777] mt-1 block">
                하단 푸터의 카피라이트 및 문의 팝업 내 지역 안내 문구에 표시됩니다.
              </span>
            </div>
          </div>

          {/* Section 2: Social & Video Channels (CONNECT) */}
          <div className="bg-white border border-[#1A1A1A]/15 p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5 pb-2 border-b border-[#1A1A1A]/10">
              <Globe className="w-4 h-4 text-[#1A1A1A]/70" />
              <span>소셜 &amp; 영상 채널 링크 (CONNECT)</span>
            </h3>
            <p className="text-[11px] text-[#666]">
              입력하지 않고 비워두면 푸터의 CONNECT 목록이나 문의 팝업에서 자동으로 제외됩니다.
            </p>

            {/* Instagram */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
                Instagram URL
              </label>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#F0F0EE] border border-[#1A1A1A]/20 text-pink-600">
                  <Instagram className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  value={formData.instagramUrl || ''}
                  onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                  placeholder="https://instagram.com/your_username"
                  className="flex-1 px-3 py-2 text-xs sm:text-sm bg-[#F8F8F7] border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A] font-mono"
                />
              </div>
            </div>

            {/* YouTube Channel */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
                YouTube 채널 URL
              </label>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#F0F0EE] border border-[#1A1A1A]/20 text-red-600">
                  <Youtube className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  value={formData.youtubeUrl || ''}
                  onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                  placeholder="https://youtube.com/@your_channel"
                  className="flex-1 px-3 py-2 text-xs sm:text-sm bg-[#F8F8F7] border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A] font-mono"
                />
              </div>
            </div>

            {/* Vimeo */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
                Vimeo 포트폴리오 URL
              </label>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#F0F0EE] border border-[#1A1A1A]/20 text-blue-500">
                  <Video className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  value={formData.vimeoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, vimeoUrl: e.target.value })}
                  placeholder="https://vimeo.com/your_id"
                  className="flex-1 px-3 py-2 text-xs sm:text-sm bg-[#F8F8F7] border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A] font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Custom Extra Links */}
          <div className="bg-white border border-[#1A1A1A]/15 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#1A1A1A]/10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-[#1A1A1A]/70" />
                <span>커스텀 외부 링크 추가 (Custom Links)</span>
              </h3>
              <button
                type="button"
                onClick={handleAddCustomLink}
                className="inline-flex items-center gap-1 px-2 py-1 bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-wider hover:opacity-85 transition-opacity cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>새 링크 추가</span>
              </button>
            </div>

            <p className="text-[11px] text-[#666]">
              Behance, Notion 이력서, 영상 아카이브 등 원하는 외부 링크를 자유롭게 추가할 수 있습니다. 푸터의 CONNECT 목록에 자동으로 생성됩니다.
            </p>

            {customLinks.length === 0 ? (
              <div className="text-center py-5 border border-dashed border-[#1A1A1A]/20 bg-[#F8F8F7] text-[#777] text-xs">
                추가된 커스텀 링크가 없습니다. 위 [새 링크 추가] 버튼을 눌러 추가해보세요.
              </div>
            ) : (
              <div className="space-y-3">
                {customLinks.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#F8F8F7] border border-[#1A1A1A]/15 flex flex-col sm:flex-row items-center gap-2"
                  >
                    <div className="w-full sm:w-1/3">
                      <input
                        type="text"
                        placeholder="이름 (예: Behance, Notion)"
                        value={item.label}
                        onChange={(e) => handleUpdateCustomLink(item.id, 'label', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A]"
                      />
                    </div>
                    <div className="w-full sm:flex-1">
                      <input
                        type="url"
                        placeholder="https://..."
                        value={item.url}
                        onChange={(e) => handleUpdateCustomLink(item.id, 'url', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A] font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomLink(item.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0 self-end sm:self-center"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1A1A1A]/10">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('모든 연락처 및 링크를 기본값으로 되돌리시겠습니까?')) {
                  onResetDefault();
                  onClose();
                }
              }}
              className="text-xs font-bold text-[#777] hover:text-red-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>기본값 복원</span>
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
                type="submit"
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#1A1A1A] hover:bg-black transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>링크 및 연락처 저장</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
