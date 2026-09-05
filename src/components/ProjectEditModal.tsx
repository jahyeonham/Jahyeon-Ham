import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Upload,
  Image as ImageIcon,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Play,
  Film,
  ExternalLink,
  Check,
  Sparkles,
  Video,
  Link2,
  Loader2,
} from 'lucide-react';
import { Project } from '../types';
import { extractYouTubeId, getYouTubeEmbedUrl, getYouTubeThumbnail, isDirectVideoUrl } from '../utils';
import {
  saveVideoFileToStorage,
  getVideoUrlFromStorage,
  captureVideoStill,
  deleteVideoFromStorage,
} from '../videoStorage';
import { ThumbnailFocalPicker } from './ThumbnailFocalPicker';
import { compressImageFile, compressDataUrlIfNeeded } from '../utils/imageCompressor';
import { VideoFramePickerModal } from './VideoFramePickerModal';

interface ProjectEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project, isNew: boolean) => void;
  initialProject?: Project | null;
  defaultIsDigital?: boolean;
  defaultIsPersonal?: boolean;
}

export const ProjectEditModal: React.FC<ProjectEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProject,
  defaultIsDigital = false,
  defaultIsPersonal = false,
}) => {
  const isNew = !initialProject;

  const [formData, setFormData] = useState<Partial<Project>>({
    id: '',
    title: '',
    koreanTitle: '',
    category: '',
    year: '2024',
    role: 'Producer / Director',
    scope: 'Planning · Production · Directing · Editing',
    highlightBadge: '',
    metrics: '',
    thumbnailUrl: '',
    backdropUrl: '',
    videoUrl: '',
    videoDuration: '',
    externalUrl: '',
    broadcastNetwork: '',
    about: '',
    contribution: '',
    isDigital: defaultIsDigital,
    isPersonal: defaultIsPersonal,
    stills: [],
    productionDetails: {
      deliverables: [],
    },
  });

  const [deliverablesText, setDeliverablesText] = useState('');
  const [newStillUrl, setNewStillUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'media' | 'details'>('basic');

  // Video Upload States
  const [videoSourceTab, setVideoSourceTab] = useState<'youtube' | 'upload' | 'direct_url'>('youtube');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoUploadPreview, setVideoUploadPreview] = useState<string | null>(null);
  const [hasExistingStoredVideo, setHasExistingStoredVideo] = useState(false);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [isCapturingStill, setIsCapturingStill] = useState(false);
  const [isFramePickerOpen, setIsFramePickerOpen] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Sync state on open
  useEffect(() => {
    if (initialProject) {
      setFormData({
        ...initialProject,
        stills: initialProject.stills ? [...initialProject.stills] : [],
      });
      setDeliverablesText(
        initialProject.productionDetails?.deliverables?.join('\n') || ''
      );
    } else {
      let defaultCategory = 'Entertainment · Broadcast';
      if (defaultIsPersonal) {
        defaultCategory = 'Music Video · Personal Project';
      } else if (defaultIsDigital) {
        defaultCategory = 'Brand Content · Digital Series';
      }

      setFormData({
        id: `project-${Date.now()}`,
        title: '',
        koreanTitle: '',
        category: defaultCategory,
        year: '2024',
        role: defaultIsPersonal ? 'Director / Producer / Editor' : 'Producer / Director',
        scope: defaultIsPersonal ? 'Concept · Directing · Editing' : 'Planning · Production · Directing · Editing',
        highlightBadge: defaultIsPersonal ? 'Personal Project' : '',
        metrics: '',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
        backdropUrl: '',
        videoUrl: '',
        videoDuration: defaultIsPersonal ? 'Music Video / Live Cut' : 'Broadcast Cut / Full Video',
        externalUrl: '',
        broadcastNetwork: '',
        about: '',
        contribution: '',
        isDigital: defaultIsPersonal ? false : defaultIsDigital,
        isPersonal: defaultIsPersonal,
        stills: [],
        productionDetails: { deliverables: [] },
      });
      setDeliverablesText('');
    }
    setNewStillUrl('');
    setActiveTab('basic');
    setSelectedVideoFile(null);
    setIsProcessingVideo(false);

    // Sync stored video from IndexedDB if project exists
    if (initialProject?.id) {
      getVideoUrlFromStorage(initialProject.id).then((stored) => {
        if (stored) {
          setHasExistingStoredVideo(true);
          setVideoUploadPreview(stored);
          setVideoSourceTab('upload');
        } else {
          setHasExistingStoredVideo(false);
          setVideoUploadPreview(null);
          const currentUrl = initialProject.videoUrl || initialProject.externalUrl || '';
          if (extractYouTubeId(currentUrl)) {
            setVideoSourceTab('youtube');
          } else if (isDirectVideoUrl(currentUrl)) {
            setVideoSourceTab('direct_url');
          } else {
            setVideoSourceTab('youtube');
          }
        }
      });
    } else {
      setHasExistingStoredVideo(false);
      setVideoUploadPreview(null);
      setVideoSourceTab('youtube');
    }
  }, [initialProject, defaultIsDigital, defaultIsPersonal, isOpen]);

  if (!isOpen) return null;

  // Detect YouTube ID from videoUrl or externalUrl
  const detectedYouTubeId =
    extractYouTubeId(formData.videoUrl) || extractYouTubeId(formData.externalUrl);

  // Handle Video File Selection
  const handleVideoFileSelect = (file: File) => {
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|ogg|m4v)$/i)) {
      alert('동영상 파일(MP4, WebM, MOV 등)만 업로드할 수 있습니다.');
      return;
    }
    setSelectedVideoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setVideoUploadPreview(previewUrl);
    setFormData((prev) => ({
      ...prev,
      videoFileName: file.name,
      videoSourceType: 'uploaded',
    }));
  };

  // Handle Capture Still from Video as Representative Thumbnail
  const handleCaptureVideoStill = async () => {
    if (!selectedVideoFile && !videoUploadPreview) return;
    setIsCapturingStill(true);
    try {
      let stillDataUrl: string;
      if (selectedVideoFile) {
        stillDataUrl = await captureVideoStill(selectedVideoFile, 0.5);
      } else if (videoUploadPreview) {
        // Fetch blob from existing URL to capture still
        const res = await fetch(videoUploadPreview);
        const blob = await res.blob();
        stillDataUrl = await captureVideoStill(blob, 0.5);
      } else {
        return;
      }
      const compressedStill = await compressDataUrlIfNeeded(stillDataUrl, 1600, 0.82);
      setFormData((prev) => ({
        ...prev,
        thumbnailUrl: compressedStill,
        backdropUrl: compressedStill,
      }));
      alert('동영상의 첫 화면이 대표 썸네일로 성공적으로 설정되었습니다.');
    } catch (err) {
      console.error('Failed to capture still:', err);
      alert('동영상 썸네일 추출에 실패했습니다.');
    } finally {
      setIsCapturingStill(false);
    }
  };

  // Handle Representative Thumbnail File Upload with auto-compression
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 1600, 0.82);
        setFormData((prev) => ({
          ...prev,
          thumbnailUrl: compressed,
          backdropUrl: prev.backdropUrl || compressed,
        }));
      } catch {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setFormData((prev) => ({
            ...prev,
            thumbnailUrl: result,
            backdropUrl: prev.backdropUrl || result,
          }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Handle Stills Multiple Files Upload with auto-compression
  const handleStillsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files) as File[];
    try {
      const compressedList = await Promise.all(
        fileList.map((file) => compressImageFile(file, 1600, 0.82))
      );
      setFormData((prev) => ({
        ...prev,
        stills: [...(prev.stills || []), ...compressedList.filter(Boolean)],
      }));
    } catch {
      fileList.forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setFormData((prev) => ({
            ...prev,
            stills: [...(prev.stills || []), result],
          }));
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset file input value
    e.target.value = '';
  };

  // Add still via URL
  const handleAddStillUrl = () => {
    if (!newStillUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      stills: [...(prev.stills || []), newStillUrl.trim()],
    }));
    setNewStillUrl('');
  };

  // Remove still
  const handleRemoveStill = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      stills: (prev.stills || []).filter((_, idx) => idx !== index),
    }));
  };

  // Move still up/down
  const handleMoveStill = (index: number, direction: 'up' | 'down') => {
    const list = [...(formData.stills || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    setFormData((prev) => ({ ...prev, stills: list }));
  };

  // Set still as thumbnail
  const handleSetStillAsThumbnail = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      thumbnailUrl: url,
      backdropUrl: prev.backdropUrl || url,
    }));
  };

  // Auto-fill thumbnail from YouTube
  const handleApplyYouTubeThumbnail = () => {
    if (detectedYouTubeId) {
      const ytThumb = getYouTubeThumbnail(detectedYouTubeId);
      setFormData((prev) => ({
        ...prev,
        thumbnailUrl: ytThumb,
        backdropUrl: prev.backdropUrl || ytThumb,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert('프로젝트 제목을 입력해주세요.');
      return;
    }

    setIsProcessingVideo(true);

    try {
      const deliverables = deliverablesText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const targetId = formData.id || `project-${Date.now()}`;
      let finalVideoUrl = formData.videoUrl;
      let finalSourceType: 'youtube' | 'uploaded' | 'direct_url' | undefined = undefined;

      if (videoSourceTab === 'upload') {
        if (selectedVideoFile) {
          finalVideoUrl = await saveVideoFileToStorage(targetId, selectedVideoFile);
          finalSourceType = 'uploaded';
        } else if (hasExistingStoredVideo && videoUploadPreview) {
          finalVideoUrl = videoUploadPreview;
          finalSourceType = 'uploaded';
        } else {
          await deleteVideoFromStorage(targetId);
          finalVideoUrl = undefined;
        }
      } else if (videoSourceTab === 'youtube') {
        await deleteVideoFromStorage(targetId);
        finalVideoUrl = formData.videoUrl?.trim() || undefined;
        finalSourceType = 'youtube';
      } else {
        await deleteVideoFromStorage(targetId);
        finalVideoUrl = formData.videoUrl?.trim() || undefined;
        finalSourceType = 'direct_url';
      }

      const projectToSave: Project = {
        id: targetId,
        title: formData.title || 'Untitled Project',
        koreanTitle: formData.koreanTitle || '',
        category: formData.category || 'Broadcast & Digital',
        year: formData.year || '2024',
        role: formData.role || 'Producer / Director',
        scope: formData.scope || 'Production · Directing · Editing',
        highlightBadge: formData.highlightBadge || undefined,
        metrics: formData.metrics || undefined,
        thumbnailUrl:
          formData.thumbnailUrl ||
          'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=1200&auto=format&fit=crop',
        thumbnailPosition: formData.thumbnailPosition,
        backdropUrl: formData.backdropUrl || formData.thumbnailUrl,
        videoUrl: finalVideoUrl,
        videoSourceType: finalSourceType,
        videoFileName: selectedVideoFile?.name || formData.videoFileName,
        videoDuration: formData.videoDuration || undefined,
        externalUrl: formData.externalUrl || finalVideoUrl || undefined,
        broadcastNetwork: formData.broadcastNetwork || undefined,
        about: formData.about || '',
        contribution: formData.contribution || '',
        isDigital: formData.isPersonal ? false : Boolean(formData.isDigital),
        isPersonal: Boolean(formData.isPersonal),
        productionDetails: {
          ...formData.productionDetails,
          deliverables: deliverables.length > 0 ? deliverables : undefined,
        },
        stills:
          formData.stills && formData.stills.length > 0
            ? formData.stills
            : formData.thumbnailUrl
            ? [formData.thumbnailUrl]
            : undefined,
      };

      onSave(projectToSave, isNew);
      onClose();
    } catch (err) {
      console.error('Error saving project video:', err);
      alert('프로젝트 저장 중 오류가 발생했습니다.');
    } finally {
      setIsProcessingVideo(false);
    }
  };

  return (
    <div
      id="project-edit-modal-overlay"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="project-edit-modal"
        className="bg-[#F8F8F7] text-[#1A1A1A] border border-[#1A1A1A] w-full max-w-3xl p-6 sm:p-8 shadow-2xl relative my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-project-edit-btn"
          onClick={onClose}
          className="absolute top-5 right-5 text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors cursor-pointer p-1"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5 border-b border-[#1A1A1A]/10 pb-4">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 text-[#1A1A1A] mb-1">
            PROJECT &amp; MEDIA MANAGER
          </p>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight uppercase text-[#1A1A1A]">
            {isNew ? '새 프로젝트 추가' : `프로젝트 수정 — ${formData.title || ''}`}
          </h2>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#1A1A1A]/10 mb-5 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === 'basic'
                ? 'border-[#1A1A1A] text-[#1A1A1A] bg-black/5'
                : 'border-transparent text-[#1A1A1A]/50 hover:text-[#1A1A1A]'
            }`}
          >
            1. 기본 정보 &amp; 분류
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-1.5 ${
              activeTab === 'media'
                ? 'border-[#1A1A1A] text-[#1A1A1A] bg-black/5'
                : 'border-transparent text-[#1A1A1A]/50 hover:text-[#1A1A1A]'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-red-600" />
            <span>2. 영상 &amp; 스틸컷</span>
            {formData.stills && formData.stills.length > 0 && (
              <span className="bg-[#1A1A1A] text-white text-[9px] px-1.5 py-0.2 rounded-full">
                {formData.stills.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === 'details'
                ? 'border-[#1A1A1A] text-[#1A1A1A] bg-black/5'
                : 'border-transparent text-[#1A1A1A]/50 hover:text-[#1A1A1A]'
            }`}
          >
            3. 상세 설명 &amp; 기여도
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 max-h-[68vh] overflow-y-auto pr-1.5">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              {/* Section Selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1.5">
                  포트폴리오 분류 섹션
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 bg-[#E5E5E3] border border-[#1A1A1A]/10">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                    <input
                      type="radio"
                      name="projectSection"
                      checked={!formData.isDigital && !formData.isPersonal}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          isDigital: false,
                          isPersonal: false,
                        }))
                      }
                      className="accent-[#1A1A1A]"
                    />
                    <span>1. Broadcast (방송)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                    <input
                      type="radio"
                      name="projectSection"
                      checked={Boolean(formData.isDigital) && !formData.isPersonal}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          isDigital: true,
                          isPersonal: false,
                        }))
                      }
                      className="accent-[#1A1A1A]"
                    />
                    <span>2. Promotional &amp; Brand</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                    <input
                      type="radio"
                      name="projectSection"
                      checked={Boolean(formData.isPersonal)}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          isDigital: false,
                          isPersonal: true,
                        }))
                      }
                      className="accent-[#1A1A1A]"
                    />
                    <span>3. Personal Works</span>
                  </label>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
                    프로젝트명 (Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="예: 시골마을 이장우 2"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
                    부제 / 영문명 (Subtitle / EN)
                  </label>
                  <input
                    type="text"
                    value={formData.koreanTitle || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, koreanTitle: e.target.value }))}
                    placeholder="예: Lee Jang-woo's Country Village"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A]"
                  />
                </div>
              </div>

              {/* Category & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
                    카테고리 (Category)
                  </label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="예: Entertainment · Broadcast"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
                    연도 (Year)
                  </label>
                  <input
                    type="text"
                    value={formData.year || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, year: e.target.value }))}
                    placeholder="예: 2023—2024"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A]"
                  />
                </div>
              </div>

              {/* Role & Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
                    역할 (Role)
                  </label>
                  <input
                    type="text"
                    value={formData.role || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                    placeholder="예: Producer / Director"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
                    업무 범위 (Scope)
                  </label>
                  <input
                    type="text"
                    value={formData.scope || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, scope: e.target.value }))}
                    placeholder="예: Planning · Directing · Editing"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A]"
                  />
                </div>
              </div>

              {/* Highlight Badge & Platform */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
                    하이라이트 배지 (Highlight Badge)
                  </label>
                  <input
                    type="text"
                    value={formData.highlightBadge || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, highlightBadge: e.target.value }))}
                    placeholder="예: #1 Netflix Korea 또는 40K+ VIEWS"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
                    방송사 / 플랫폼 (Network / Platform)
                  </label>
                  <input
                    type="text"
                    value={formData.broadcastNetwork || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, broadcastNetwork: e.target.value }))}
                    placeholder="예: SBS, JTBC & Netflix, YouTube"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A]"
                  />
                </div>
              </div>

              {/* Representative Thumbnail Image */}
              <div className="pt-2 border-t border-[#1A1A1A]/10">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
                  대표 썸네일 이미지 (Thumbnail URL 또는 파일 업로드) *
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.thumbnailUrl || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        thumbnailUrl: e.target.value,
                        backdropUrl: prev.backdropUrl || e.target.value,
                      }))
                    }
                    placeholder="이미지 URL 주소"
                    className="flex-1 min-w-[200px] px-3 py-2 text-xs sm:text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A]"
                  />
                  <label className="px-3 py-2 bg-[#E5E5E3] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>파일 업로드</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsFramePickerOpen(true)}
                    className="px-3.5 py-2 bg-[#1A1A1A] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-2xs"
                    title="영상 속 원하는 장면을 골라 대표 썸네일로 설정"
                  >
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    <span>🎬 영상에서 프레임 직접 선택</span>
                  </button>
                </div>

                {formData.thumbnailUrl && (
                  <div className="mt-3">
                    <ThumbnailFocalPicker
                      imageUrl={formData.thumbnailUrl}
                      position={formData.thumbnailPosition || '50% 50%'}
                      onChange={(newPos) =>
                        setFormData((prev) => ({ ...prev, thumbnailPosition: newPos }))
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: YOUTUBE VIDEO & PRODUCTION STILLS (핵심 요청 사항) */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              {/* --- SECTION A: MULTI-SOURCE VIDEO SETTINGS (UPLOAD / YOUTUBE / DIRECT URL) --- */}
              <div className="p-4 bg-white border border-[#1A1A1A]/15 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-red-600" />
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1A1A1A]">
                      상세 페이지 재생 영상 설정 (Video Source)
                    </h3>
                  </div>
                  {videoSourceTab === 'youtube' && detectedYouTubeId && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-red-600 text-white px-2 py-0.5 font-bold">
                      <Check className="w-3 h-3" />
                      YouTube ID: {detectedYouTubeId}
                    </span>
                  )}
                  {videoSourceTab === 'upload' && (selectedVideoFile || hasExistingStoredVideo) && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-blue-600 text-white px-2 py-0.5 font-bold">
                      <Check className="w-3 h-3" />
                      직접 업로드 파일 연결됨
                    </span>
                  )}
                </div>

                {/* Sub-tabs for Video Source Type */}
                <div className="grid grid-cols-3 gap-1 bg-[#E5E5E3] p-1">
                  <button
                    type="button"
                    onClick={() => setVideoSourceTab('upload')}
                    className={`py-1.5 px-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      videoSourceTab === 'upload'
                        ? 'bg-white text-[#1A1A1A] shadow-xs'
                        : 'text-[#666] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>직접 파일 업로드</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSourceTab('youtube')}
                    className={`py-1.5 px-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      videoSourceTab === 'youtube'
                        ? 'bg-white text-[#1A1A1A] shadow-xs'
                        : 'text-[#666] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5 text-red-600" />
                    <span>유튜브 링크</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSourceTab('direct_url')}
                    className={`py-1.5 px-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      videoSourceTab === 'direct_url'
                        ? 'bg-white text-[#1A1A1A] shadow-xs'
                        : 'text-[#666] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>웹 MP4 주소</span>
                  </button>
                </div>

                {/* 1. DIRECT FILE UPLOAD */}
                {videoSourceTab === 'upload' && (
                  <div className="space-y-3">
                    <input
                      ref={videoFileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/ogg,video/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleVideoFileSelect(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <div
                      onClick={() => videoFileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#1A1A1A]/20 hover:border-[#1A1A1A] bg-[#F8F8F7] p-5 text-center cursor-pointer transition-colors"
                    >
                      <Upload className="w-6 h-6 text-[#1A1A1A]/50 mx-auto mb-1.5" />
                      <p className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                        동영상 파일 선택 (MP4, WebM, MOV, OGG)
                      </p>
                      <p className="text-[11px] text-[#666] mt-0.5">
                        브라우저 내부 저장소(IndexedDB)에 안전하게 저장되어 상세 페이지에서 고화질로 재생됩니다.
                      </p>
                      {selectedVideoFile && (
                        <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono font-bold">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {selectedVideoFile.name} ({(selectedVideoFile.size / (1024 * 1024)).toFixed(1)} MB)
                          </span>
                        </div>
                      )}
                      {!selectedVideoFile && hasExistingStoredVideo && (
                        <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-300 text-blue-800 text-xs font-mono font-bold">
                          <Check className="w-3.5 h-3.5 text-blue-600" />
                          <span>기존 업로드된 동영상이 보관되어 있습니다</span>
                        </div>
                      )}
                    </div>

                    {/* Preview Player & Still Capture Button */}
                    {videoUploadPreview && (
                      <div className="p-3 bg-[#F8F8F7] border border-[#1A1A1A]/15 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70">
                            ▶ 업로드 동영상 미리보기
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setIsFramePickerOpen(true)}
                              className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-neutral-800 text-white text-[11px] font-bold tracking-wider uppercase transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="영상 속 프레임을 탐색하여 썸네일 및 스틸컷을 자유롭게 캡처"
                            >
                              <Film className="w-3 h-3 text-amber-400" />
                              <span>🎬 영상 프레임 캡처 스튜디오</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleCaptureVideoStill}
                              disabled={isCapturingStill}
                              className="px-2.5 py-1 bg-[#E5E5E3] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] text-[11px] font-bold tracking-wider uppercase transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              {isCapturingStill ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Sparkles className="w-3 h-3 text-amber-500" />
                              )}
                              <span>{isCapturingStill ? '추출 중...' : '첫 장면 추출'}</span>
                            </button>
                          </div>
                        </div>
                        <div className="relative aspect-video w-full max-w-md bg-black border border-[#1A1A1A]/20 overflow-hidden shadow-inner">
                          <video
                            src={videoUploadPreview}
                            controls
                            playsInline
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. YOUTUBE LINK */}
                {videoSourceTab === 'youtube' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
                        유튜브 영상 링크 또는 비디오 ID
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.videoUrl || formData.externalUrl || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              videoUrl: val,
                              externalUrl: prev.externalUrl || val,
                            }));
                          }}
                          placeholder="예: https://www.youtube.com/watch?v=... 또는 youtu.be/..."
                          className="flex-1 px-3 py-2 text-xs sm:text-sm bg-[#F8F8F7] border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A]"
                        />
                        {detectedYouTubeId && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setIsFramePickerOpen(true)}
                              className="px-3 py-2 bg-[#1A1A1A] hover:bg-neutral-800 text-white text-[11px] font-bold tracking-wider uppercase transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              title="유튜브 각 시점별 장면 프레임 보기 & 썸네일/스틸컷 선택"
                            >
                              <Film className="w-3.5 h-3.5 text-amber-400" />
                              <span>🎬 장면 프레임에서 선택</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleApplyYouTubeThumbnail}
                              className="px-3 py-2 bg-[#E5E5E3] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] text-[11px] font-bold tracking-wider uppercase transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                              title="유튜브 고화질 썸네일을 대표 이미지로 적용"
                            >
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              <span>기본 썸네일</span>
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-[#666] mt-1">
                        * 일반 유튜브 주소, 단축 주소(youtu.be), 쇼츠(shorts) 또는 11자리 비디오 ID 모두 지원합니다.
                      </p>
                    </div>

                    {/* Live YouTube Preview */}
                    {detectedYouTubeId && (
                      <div className="mt-2 pt-2 border-t border-[#1A1A1A]/10">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-2">
                          ▶ 유튜브 실시간 미리보기 (Live Preview)
                        </p>
                        <div className="relative aspect-video w-full max-w-md bg-black border border-[#1A1A1A]/20 overflow-hidden shadow-inner">
                          <iframe
                            src={getYouTubeEmbedUrl(detectedYouTubeId, false) || ''}
                            title="YouTube Preview"
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. DIRECT WEB URL */}
                {videoSourceTab === 'direct_url' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
                        외부 직접 동영상 웹 링크 (Direct MP4 URL)
                      </label>
                      <input
                        type="text"
                        value={formData.videoUrl || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            videoUrl: e.target.value,
                            externalUrl: prev.externalUrl || e.target.value,
                          }))
                        }
                        placeholder="예: https://my-server.com/videos/sample.mp4"
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F8F8F7] border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A]"
                      />
                    </div>
                    {formData.videoUrl && (
                      <div className="relative aspect-video w-full max-w-md bg-black border border-[#1A1A1A]/20 overflow-hidden shadow-inner">
                        <video
                          src={formData.videoUrl}
                          controls
                          playsInline
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Additional video options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#1A1A1A]/10">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
                      외부 시청 링크 (Watch Full Link)
                    </label>
                    <input
                      type="text"
                      value={formData.externalUrl || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, externalUrl: e.target.value }))}
                      placeholder="예: https://youtube.com/... 또는 OTT 링크"
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F8F8F7] border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
                      영상 표기 라벨 (Video Duration / Badge)
                    </label>
                    <input
                      type="text"
                      value={formData.videoDuration || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, videoDuration: e.target.value }))}
                      placeholder="예: Broadcast Episodes / Full Cut (15:20)"
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F8F8F7] border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A]"
                    />
                  </div>
                </div>
              </div>

              {/* --- SECTION B: STILLS (스틸컷) SETTINGS --- */}
              <div className="p-4 bg-white border border-[#1A1A1A]/15 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#1A1A1A]" />
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1A1A1A]">
                      프로덕션 스틸컷 관리 (Production Stills &amp; Frames)
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-[#666]">
                    총 {(formData.stills || []).length}장의 스틸컷
                  </span>
                </div>

                {/* Stills Add Controls: Multi-file Upload + URL Input */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70">
                    스틸컷 추가 (사진 파일 다중 업로드 또는 URL 추가)
                  </label>

                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Video Frame Capture Studio Button */}
                    <button
                      type="button"
                      onClick={() => setIsFramePickerOpen(true)}
                      className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0 shadow-xs"
                      title="영상 속 장면을 직접 찾아 스틸컷으로 캡처 추가"
                    >
                      <Film className="w-3.5 h-3.5 text-white" />
                      <span>🎬 영상에서 스틸컷 캡처하여 추가</span>
                    </button>

                    {/* File Upload Button (Multiple) */}
                    <label className="px-4 py-2.5 bg-[#1A1A1A] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>내 컴퓨터에서 사진 추가 (다중 선택 가능)</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleStillsUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Or URL input */}
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={newStillUrl}
                        onChange={(e) => setNewStillUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddStillUrl();
                          }
                        }}
                        placeholder="이미지 웹 주소(URL) 입력 후 추가"
                        className="flex-1 px-3 py-2 text-xs bg-[#F8F8F7] border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A]"
                      />
                      <button
                        type="button"
                        onClick={handleAddStillUrl}
                        disabled={!newStillUrl.trim()}
                        className="px-3 py-2 bg-[#E5E5E3] hover:bg-[#1A1A1A] hover:text-white disabled:opacity-40 text-[#1A1A1A] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stills Grid List */}
                {formData.stills && formData.stills.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    {formData.stills.map((stillUrl, idx) => (
                      <div
                        key={idx}
                        className="relative group border border-[#1A1A1A]/15 bg-[#F8F8F7] p-1.5 flex flex-col"
                      >
                        {/* Image Preview */}
                        <div className="relative aspect-video w-full bg-[#1A1A1A] overflow-hidden mb-1.5">
                          <img
                            src={stillUrl}
                            alt={`Still ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1 left-1 bg-black/80 text-white text-[9px] font-mono px-1.5 py-0.5">
                            #{idx + 1}
                          </span>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="flex items-center justify-between gap-1 text-[#1A1A1A]">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveStill(idx, 'up')}
                              className="p-1 hover:bg-[#1A1A1A] hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                              title="앞으로 이동"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === (formData.stills?.length || 0) - 1}
                              onClick={() => handleMoveStill(idx, 'down')}
                              className="p-1 hover:bg-[#1A1A1A] hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                              title="뒤로 이동"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetStillAsThumbnail(stillUrl)}
                              className="p-1 hover:bg-[#1A1A1A] hover:text-white text-[9px] font-mono transition-colors cursor-pointer"
                              title="이 스틸컷을 대표 썸네일로 설정"
                            >
                              대표로 지정
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveStill(idx)}
                            className="p-1 text-red-500 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center border-2 border-dashed border-[#1A1A1A]/15 bg-[#F8F8F7] text-[#888]">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium">등록된 스틸컷이 없습니다.</p>
                    <p className="text-[10px] opacity-75 mt-0.5">
                      상단의 [사진 추가] 버튼을 눌러 촬영 현장 스틸이나 방송 캡처본을 등록하세요.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DETAILS & CONTRIBUTION */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* About Project */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
                  프로젝트 설명 (About the project)
                </label>
                <textarea
                  rows={4}
                  value={formData.about || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, about: e.target.value }))}
                  placeholder="프로젝트의 개요, 기획 의도 및 내용을 설명하세요."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A] resize-none"
                />
              </div>

              {/* Contribution */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
                  기여 및 역할 (My Contribution)
                </label>
                <textarea
                  rows={4}
                  value={formData.contribution || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contribution: e.target.value }))}
                  placeholder="현장 연출, 기획, 편집, 성과 등 구체적인 기여 내용을 입력하세요."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A] resize-none"
                />
              </div>

              {/* Key Deliverables */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
                  주요 제작 결과물 (Key Deliverables - 한 줄에 하나씩 입력)
                </label>
                <textarea
                  rows={3}
                  value={deliverablesText}
                  onChange={(e) => setDeliverablesText(e.target.value)}
                  placeholder="본편 방송 회차 제작&#10;숏폼 바이럴 릴스 제작&#10;비하인드 및 레시피 콘텐츠"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A] resize-none font-mono"
                />
              </div>
            </div>
          )}

          {/* Submit / Cancel Buttons */}
          <div className="pt-4 border-t border-[#1A1A1A]/10 flex items-center justify-between gap-3">
            <div className="text-[11px] text-[#777]">
              {activeTab === 'basic' && '💡 영상과 스틸컷은 [2. 영상 & 스틸컷] 탭에서 등록할 수 있습니다.'}
              {activeTab === 'media' && '💡 직접 동영상 파일(MP4 등), 유튜브 링크, 외부 웹 링크 모두 지원합니다.'}
              {activeTab === 'details' && '💡 기획 및 연출 기여도를 작성하면 케이스 스터디에 반영됩니다.'}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessingVideo}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors cursor-pointer disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isProcessingVideo}
                className="px-6 py-2.5 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-widest hover:opacity-85 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isProcessingVideo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>저장 중...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isNew ? '프로젝트 등록하기' : '변경사항 저장하기'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Video Frame & Still Capture Studio Modal */}
      <VideoFramePickerModal
        isOpen={isFramePickerOpen}
        onClose={() => setIsFramePickerOpen(false)}
        videoSource={videoUploadPreview || formData.videoUrl || formData.externalUrl}
        projectId={formData.id}
        projectTitle={formData.title}
        currentThumbnail={formData.thumbnailUrl}
        currentStills={formData.stills}
        onSelectThumbnail={(thumbUrl) => {
          setFormData((prev) => ({
            ...prev,
            thumbnailUrl: thumbUrl,
            backdropUrl: prev.backdropUrl || thumbUrl,
          }));
        }}
        onAddStill={(stillUrl) => {
          setFormData((prev) => ({
            ...prev,
            stills: [...(prev.stills || []), stillUrl],
          }));
        }}
        onRemoveStill={(idx) => handleRemoveStill(idx)}
      />
    </div>
  );
};
