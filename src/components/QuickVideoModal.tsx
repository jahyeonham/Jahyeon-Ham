import React, { useState, useEffect, useRef } from 'react';
import { X, Film, Check, Sparkles, ExternalLink, Trash2, Upload, Video, Link2, AlertCircle, Loader2 } from 'lucide-react';
import { extractYouTubeId, getYouTubeEmbedUrl, isDirectVideoUrl } from '../utils';
import { saveVideoFileToStorage, getVideoUrlFromStorage, deleteVideoFromStorage, captureVideoStill } from '../videoStorage';
import { Project } from '../types';
import { VideoFramePickerModal } from './VideoFramePickerModal';

interface QuickVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSave: (projectId: string, newVideoUrl: string, updateThumbnail?: boolean) => void;
}

type VideoMode = 'youtube' | 'upload' | 'direct_url';

export const QuickVideoModal: React.FC<QuickVideoModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave,
}) => {
  const [mode, setMode] = useState<VideoMode>('youtube');
  const [videoUrl, setVideoUrl] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [updateThumbnail, setUpdateThumbnail] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [existingStoredVideo, setExistingStoredVideo] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isFramePickerOpen, setIsFramePickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const currentUrl = project.videoUrl || project.externalUrl || '';
      const isYt = Boolean(extractYouTubeId(currentUrl));
      const isDirect = isDirectVideoUrl(currentUrl);

      // Check if project has an uploaded video stored in IndexedDB
      getVideoUrlFromStorage(project.id).then((stored) => {
        setExistingStoredVideo(stored);
        if (stored) {
          setMode('upload');
          setFilePreviewUrl(stored);
        } else if (isYt) {
          setMode('youtube');
          setVideoUrl(currentUrl);
        } else if (isDirect) {
          setMode('direct_url');
          setDirectUrl(currentUrl);
        } else {
          setMode('youtube');
          setVideoUrl(currentUrl);
        }
      });

      setUpdateThumbnail(true);
      setSelectedFile(null);
      setIsProcessing(false);
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const detectedYouTubeId = extractYouTubeId(videoUrl);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|ogg|m4v)$/i)) {
      alert('동영상 파일(MP4, WebM, MOV 등)만 업로드할 수 있습니다.');
      return;
    }

    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setFilePreviewUrl(previewUrl);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      if (mode === 'upload') {
        if (selectedFile) {
          // 1. Save video file to IndexedDB for persistent playback
          const liveUrl = await saveVideoFileToStorage(project.id, selectedFile);

          // 2. Optionally capture first frame as thumbnail
          if (updateThumbnail) {
            try {
              const capturedThumb = await captureVideoStill(selectedFile, 0.5);
              project.thumbnailUrl = capturedThumb;
              project.backdropUrl = capturedThumb;
            } catch (err) {
              console.warn('Frame capture skipped:', err);
            }
          }

          onSave(project.id, liveUrl, false);
        } else if (existingStoredVideo) {
          // Keep existing uploaded video
          onSave(project.id, existingStoredVideo, false);
        } else {
          // Clear video
          await deleteVideoFromStorage(project.id);
          onSave(project.id, '', false);
        }
      } else if (mode === 'youtube') {
        // Clear any stored local video if switching to YouTube
        await deleteVideoFromStorage(project.id);
        onSave(project.id, videoUrl.trim(), updateThumbnail);
      } else {
        // Direct web link
        await deleteVideoFromStorage(project.id);
        onSave(project.id, directUrl.trim(), false);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save video:', err);
      alert('영상 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveVideo = async () => {
    if (window.confirm('등록된 영상을 삭제하시겠습니까?')) {
      await deleteVideoFromStorage(project.id);
      setSelectedFile(null);
      setFilePreviewUrl(null);
      setExistingStoredVideo(null);
      setVideoUrl('');
      setDirectUrl('');
      onSave(project.id, '', false);
      onClose();
    }
  };

  return (
    <div
      id="quick-video-modal-overlay"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="quick-video-modal"
        className="bg-[#F8F8F7] text-[#1A1A1A] border border-[#1A1A1A] w-full max-w-xl p-6 sm:p-8 shadow-2xl relative my-8"
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
          <div className="flex items-center gap-2 mb-1">
            <Video className="w-4 h-4 text-red-600" />
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-red-600">
              VIDEO SOURCE MANAGER
            </p>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight uppercase text-[#1A1A1A]">
            상세 페이지 영상 변경 및 업로드
          </h2>
          <p className="text-xs text-[#666] mt-1">
            프로젝트: <span className="font-bold text-[#1A1A1A]">{project.title}</span>
            {project.koreanTitle && ` (${project.koreanTitle})`}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-[#E5E5E3] p-1 mb-5">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`py-2 px-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'upload'
                ? 'bg-white text-[#1A1A1A] shadow-xs'
                : 'text-[#666] hover:text-[#1A1A1A]'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>직접 파일 업로드</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('youtube')}
            className={`py-2 px-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'youtube'
                ? 'bg-white text-[#1A1A1A] shadow-xs'
                : 'text-[#666] hover:text-[#1A1A1A]'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-red-600" />
            <span>유튜브 링크</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('direct_url')}
            className={`py-2 px-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'direct_url'
                ? 'bg-white text-[#1A1A1A] shadow-xs'
                : 'text-[#666] hover:text-[#1A1A1A]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>웹 MP4 주소</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* MODE 1: DIRECT FILE UPLOAD */}
          {mode === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/ogg,video/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-[#1A1A1A]/20 hover:border-[#1A1A1A] bg-white'
                }`}
              >
                <Upload className="w-8 h-8 text-[#1A1A1A]/50 mx-auto mb-2" />
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1A1A1A]">
                  동영상 파일을 드래그하거나 클릭하여 선택
                </p>
                <p className="text-[11px] text-[#666] mt-1">
                  지원 형식: MP4, WebM, MOV, OGG (브라우저 로컬 고화질 저장)
                </p>
                {selectedFile && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono font-bold">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </span>
                  </div>
                )}
                {!selectedFile && existingStoredVideo && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-300 text-blue-800 text-xs font-mono font-bold">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>현재 직접 업로드된 영상이 등록되어 있습니다</span>
                  </div>
                )}
              </div>

              {/* Video Preview */}
              {filePreviewUrl && (
                <div className="space-y-2 p-3 bg-white border border-[#1A1A1A]/15">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70">
                    ▶ 업로드 동영상 실시간 미리보기 (Live Preview)
                  </p>
                  <div className="relative aspect-video w-full bg-black overflow-hidden border border-[#1A1A1A]/20">
                    <video
                      src={filePreviewUrl}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFramePickerOpen(true)}
                    className="w-full py-2 bg-[#1A1A1A] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    <span>🎬 영상 프레임 캡처 스튜디오 (원하는 장면을 썸네일/스틸컷으로 선택)</span>
                  </button>

                  <label className="flex items-start gap-2 pt-1 text-xs text-[#333] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={updateThumbnail}
                      onChange={(e) => setUpdateThumbnail(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>이 동영상의 첫 장면을 대표 썸네일 이미지로 자동 추출하여 적용</span>
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: YOUTUBE URL */}
          {mode === 'youtube' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1.5">
                  유튜브 영상 주소 (URL) 또는 영상 ID
                </label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="예: https://www.youtube.com/watch?v=... 또는 youtu.be/..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A]"
                />
                <p className="text-[11px] text-[#777] mt-1.5 leading-relaxed">
                  * 일반 유튜브 주소, 단축 주소(youtu.be), 쇼츠(shorts), 라이브(live) 모두 지원합니다.
                </p>
              </div>

              {detectedYouTubeId ? (
                <div className="space-y-3 p-3.5 bg-white border border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>유효한 유튜브 영상 감지됨 (ID: {detectedYouTubeId})</span>
                    </span>
                    <a
                      href={`https://www.youtube.com/watch?v=${detectedYouTubeId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-[#1A1A1A]/60 hover:text-[#1A1A1A] inline-flex items-center gap-1"
                    >
                      <span>새 탭에서 확인</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="relative aspect-video w-full bg-black overflow-hidden border border-[#1A1A1A]/20">
                    <iframe
                      src={getYouTubeEmbedUrl(detectedYouTubeId, false) || ''}
                      title="YouTube Preview"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFramePickerOpen(true)}
                    className="w-full py-2 bg-[#1A1A1A] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    <span>🎬 유튜브 장면 프레임 보기 &amp; 썸네일/스틸컷 추출</span>
                  </button>

                  <label className="flex items-start gap-2 pt-1 text-xs text-[#333] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={updateThumbnail}
                      onChange={(e) => setUpdateThumbnail(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>대표 썸네일도 이 영상의 고화질 썸네일로 자동 변경하기</span>
                    </span>
                  </label>
                </div>
              ) : videoUrl.trim() !== '' ? (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  입력하신 링크에서 올바른 11자리 유튜브 ID를 찾을 수 없습니다. 주소를 다시 확인해주세요.
                </div>
              ) : null}
            </div>
          )}

          {/* MODE 3: DIRECT WEB MP4 URL */}
          {mode === 'direct_url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1.5">
                  외부 직접 동영상 웹 링크 (Direct MP4/WebM URL)
                </label>
                <input
                  type="text"
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  placeholder="예: https://my-server.com/videos/sample.mp4"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A]"
                />
                <p className="text-[11px] text-[#777] mt-1.5 leading-relaxed">
                  * 웹 호스팅, S3, Cloudflare 또는 공개 서버에 올려진 직접 재생 가능한 동영상 링크를 입력하세요.
                </p>
              </div>

              {directUrl && (
                <div className="space-y-2 p-3 bg-white border border-[#1A1A1A]/15">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70">
                    ▶ 웹 동영상 실시간 미리보기
                  </p>
                  <div className="relative aspect-video w-full bg-black overflow-hidden border border-[#1A1A1A]/20">
                    <video
                      src={directUrl}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#1A1A1A]/10 flex items-center justify-between">
            <div>
              {(project.videoUrl || existingStoredVideo) && (
                <button
                  type="button"
                  onClick={handleRemoveVideo}
                  className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>영상 삭제</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-6 py-2.5 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>저장 중...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>영상 적용하기</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Frame Picker Studio Modal */}
      <VideoFramePickerModal
        isOpen={isFramePickerOpen}
        onClose={() => setIsFramePickerOpen(false)}
        videoSource={filePreviewUrl || (mode === 'youtube' ? videoUrl : directUrl)}
        projectId={project.id}
        projectTitle={project.title}
        currentThumbnail={project.thumbnailUrl}
        currentStills={project.stills}
        onSelectThumbnail={(thumbUrl) => {
          project.thumbnailUrl = thumbUrl;
          project.backdropUrl = thumbUrl;
          setUpdateThumbnail(false);
        }}
        onAddStill={(stillUrl) => {
          project.stills = [...(project.stills || []), stillUrl];
        }}
        onRemoveStill={(idx) => {
          if (project.stills) {
            project.stills.splice(idx, 1);
          }
        }}
      />
    </div>
  );
};

