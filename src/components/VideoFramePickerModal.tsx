import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Sparkles,
  Camera,
  Check,
  Upload,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Film,
  Trash2,
  CheckCircle2,
  Video,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { captureFromVideoElement } from '../videoStorage';
import { compressDataUrlIfNeeded, compressImageFile } from '../utils/imageCompressor';
import { extractYouTubeId, getYouTubeFrameThumbnails, isDirectVideoUrl } from '../utils';

interface VideoFramePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSource?: string | null;
  projectId?: string;
  projectTitle?: string;
  currentThumbnail?: string;
  currentStills?: string[];
  onSelectThumbnail: (thumbnailDataUrl: string) => void;
  onAddStill: (stillDataUrl: string) => void;
  onRemoveStill?: (index: number) => void;
}

export const VideoFramePickerModal: React.FC<VideoFramePickerModalProps> = ({
  isOpen,
  onClose,
  videoSource,
  projectId,
  projectTitle = '프로젝트',
  currentThumbnail,
  currentStills = [],
  onSelectThumbnail,
  onAddStill,
  onRemoveStill,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeVideoSrc, setActiveVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'thumb' | 'still' } | null>(null);
  const [recentStills, setRecentStills] = useState<string[]>(currentStills);
  const [selectedThumb, setSelectedThumb] = useState<string>(currentThumbnail || '');
  const [isCapturing, setIsCapturing] = useState(false);

  // Sync recent stills and thumbnail when modal opens
  useEffect(() => {
    if (isOpen) {
      setRecentStills(currentStills);
      setSelectedThumb(currentThumbnail || '');
      setStatusMessage(null);
      setIsPlaying(false);
      setCurrentTime(0);

      // Determine initial video source
      if (videoSource && isDirectVideoUrl(videoSource)) {
        setActiveVideoSrc(videoSource);
      } else {
        setActiveVideoSrc(null);
      }
    }
  }, [isOpen, videoSource, currentThumbnail, currentStills]);

  const youtubeId = !activeVideoSrc && videoSource ? extractYouTubeId(videoSource) : null;
  const youtubeFrames = youtubeId ? getYouTubeFrameThumbnails(youtubeId) : [];

  // Handle local file load to scrub frames
  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setActiveVideoSrc(url);
      setIsVideoLoaded(false);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      setIsVideoLoaded(true);
      videoRef.current.currentTime = 0.5; // Seek to first frame
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const seekTo = (seconds: number) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(seconds, duration));
    videoRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const stepFrames = (secondsDelta: number) => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    seekTo(videoRef.current.currentTime + secondsDelta);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
  };

  // 1. Core Action: Capture current frame as Representative Thumbnail
  const handleCaptureAsThumbnail = async () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      }

      const rawDataUrl = captureFromVideoElement(videoRef.current, 0.88);
      const optimizedDataUrl = await compressDataUrlIfNeeded(rawDataUrl, 1600, 0.82);

      setSelectedThumb(optimizedDataUrl);
      onSelectThumbnail(optimizedDataUrl);

      setStatusMessage({
        text: `현재 장면(${formatTime(currentTime)})이 대표 썸네일로 설정되었습니다!`,
        type: 'thumb',
      });

      setTimeout(() => {
        setStatusMessage(null);
      }, 3500);
    } catch (err) {
      console.error('Failed to capture frame as thumbnail:', err);
      alert('영상 프레임 캡처 중 오류가 발생했습니다. 브라우저 보안 또는 비디오 형식을 확인해주세요.');
    } finally {
      setIsCapturing(false);
    }
  };

  // 2. Core Action: Capture current frame as Production Still
  const handleCaptureAsStill = async () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      }

      const rawDataUrl = captureFromVideoElement(videoRef.current, 0.88);
      const optimizedDataUrl = await compressDataUrlIfNeeded(rawDataUrl, 1600, 0.82);

      const nextStills = [...recentStills, optimizedDataUrl];
      setRecentStills(nextStills);
      onAddStill(optimizedDataUrl);

      setStatusMessage({
        text: `현재 장면(${formatTime(currentTime)})이 스틸컷 #${nextStills.length}에 추가되었습니다!`,
        type: 'still',
      });

      setTimeout(() => {
        setStatusMessage(null);
      }, 3500);
    } catch (err) {
      console.error('Failed to capture frame as still:', err);
      alert('영상 프레임 캡처 중 오류가 발생했습니다.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Handle YouTube frame selection
  const handleSelectYouTubeFrameAsThumb = (url: string, label: string) => {
    setSelectedThumb(url);
    onSelectThumbnail(url);
    setStatusMessage({
      text: `${label}이 대표 썸네일로 설정되었습니다!`,
      type: 'thumb',
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleSelectYouTubeFrameAsStill = (url: string, label: string) => {
    const nextStills = [...recentStills, url];
    setRecentStills(nextStills);
    onAddStill(url);
    setStatusMessage({
      text: `${label}이 스틸컷에 추가되었습니다!`,
      type: 'still',
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleRemoveStillLocal = (idx: number) => {
    const nextStills = recentStills.filter((_, i) => i !== idx);
    setRecentStills(nextStills);
    if (onRemoveStill) {
      onRemoveStill(idx);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="video-frame-picker-modal-overlay"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="video-frame-picker-modal"
        className="bg-[#F8F8F7] text-[#1A1A1A] border border-[#1A1A1A] w-full max-w-4xl shadow-2xl relative my-auto flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1A1A]/15 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#1A1A1A] text-white">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">
                  FRAME CAPTURE STUDIO
                </span>
                <span className="text-[10px] text-[#666] font-mono">
                  {projectTitle}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight uppercase text-[#1A1A1A]">
                영상 속 썸네일 &amp; 스틸컷 직접 캡처
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/ogg,video/*"
              onChange={handleLocalFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#E5E5E3] hover:bg-[#1A1A1A] hover:text-white transition-colors cursor-pointer border border-[#1A1A1A]/10"
              title="컴퓨터의 다른 영상 파일 열기"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>영상 파일 열기</span>
            </button>

            <button
              onClick={onClose}
              className="text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors p-1.5 cursor-pointer"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-[#F8F8F7]">
          {/* Status / Feedback Banner */}
          {statusMessage && (
            <div
              className={`p-3 border flex items-center gap-2.5 text-xs font-bold tracking-wide animate-fade-in ${
                statusMessage.type === 'thumb'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* MAIN PLAYER & SCRUBBER (For HTML5 Video / Uploaded / Direct MP4) */}
          {activeVideoSrc ? (
            <div className="bg-white border border-[#1A1A1A]/20 p-4 space-y-3.5 shadow-xs">
              {/* Screen Player */}
              <div className="relative aspect-video w-full bg-black overflow-hidden border border-[#1A1A1A]/20 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={activeVideoSrc}
                  crossOrigin="anonymous"
                  playsInline
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={togglePlay}
                />

                {/* Big Center Play Overlay when paused */}
                {!isPlaying && isVideoLoaded && (
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto w-14 h-14 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-lg backdrop-blur-xs"
                    title="재생"
                  >
                    <Play className="w-6 h-6 fill-white translate-x-0.5" />
                  </button>
                )}
              </div>

              {/* Timeline Slider & Time Counter */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-[#1A1A1A]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-pulse" />
                    <span>현재 재생 시점: {formatTime(currentTime)}</span>
                  </span>
                  <span className="text-[#666]">
                    전체 길이: {formatTime(duration)}
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.05"
                  value={currentTime}
                  onChange={(e) => seekTo(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#E5E5E3] accent-[#1A1A1A] cursor-pointer rounded-none"
                />
              </div>

              {/* Fine Scrubbing & Step Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#1A1A1A]/10">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => stepFrames(-5)}
                    className="px-2 py-1 bg-[#E5E5E3] hover:bg-[#1A1A1A] hover:text-white text-[11px] font-mono font-bold transition-colors cursor-pointer"
                    title="5초 뒤로"
                  >
                    -5초
                  </button>
                  <button
                    type="button"
                    onClick={() => stepFrames(-1)}
                    className="px-2 py-1 bg-[#E5E5E3] hover:bg-[#1A1A1A] hover:text-white text-[11px] font-mono font-bold transition-colors cursor-pointer"
                    title="1초 뒤로"
                  >
                    -1초
                  </button>
                  <button
                    type="button"
                    onClick={() => stepFrames(-0.1)}
                    className="px-2 py-1 bg-[#E5E5E3] hover:bg-[#1A1A1A] hover:text-white text-[11px] font-mono font-bold transition-colors cursor-pointer"
                    title="1프레임(0.1초) 뒤로 미세조정"
                  >
                    -1프레임
                  </button>

                  <button
                    type="button"
                    onClick={togglePlay}
                    className="px-3.5 py-1 bg-[#1A1A1A] text-white hover:bg-neutral-800 text-[11px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                    <span>{isPlaying ? '일시정지' : '재생'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => stepFrames(0.1)}
                    className="px-2 py-1 bg-[#E5E5E3] hover:bg-[#1A1A1A] hover:text-white text-[11px] font-mono font-bold transition-colors cursor-pointer"
                    title="1프레임(0.1초) 앞으로 미세조정"
                  >
                    +1프레임
                  </button>
                  <button
                    type="button"
                    onClick={() => stepFrames(1)}
                    className="px-2 py-1 bg-[#E5E5E3] hover:bg-[#1A1A1A] hover:text-white text-[11px] font-mono font-bold transition-colors cursor-pointer"
                    title="1초 앞으로"
                  >
                    +1초
                  </button>
                  <button
                    type="button"
                    onClick={() => stepFrames(5)}
                    className="px-2 py-1 bg-[#E5E5E3] hover:bg-[#1A1A1A] hover:text-white text-[11px] font-mono font-bold transition-colors cursor-pointer"
                    title="5초 앞으로"
                  >
                    +5초
                  </button>
                </div>

                {/* Reset to Start */}
                <button
                  type="button"
                  onClick={() => seekTo(0)}
                  className="px-2 py-1 text-[11px] text-[#666] hover:text-[#1A1A1A] flex items-center gap-1 cursor-pointer"
                  title="영상 처음으로 이동"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>처음으로</span>
                </button>
              </div>

              {/* TWO CORE ACTIONS: 1. 대표 썸네일 설정 | 2. 스틸컷에 추가 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#1A1A1A]/15">
                <button
                  type="button"
                  onClick={handleCaptureAsThumbnail}
                  disabled={isCapturing}
                  className="py-3 px-4 bg-[#1A1A1A] hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>★ 현재 장면을 대표 썸네일로 설정</span>
                </button>

                <button
                  type="button"
                  onClick={handleCaptureAsStill}
                  disabled={isCapturing}
                  className="py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  <span>＋ 현재 장면을 스틸컷에 추가</span>
                </button>
              </div>
            </div>
          ) : youtubeId ? (
            /* YOUTUBE SCENE FRAMES SELECTOR */
            <div className="space-y-4">
              <div className="p-4 bg-white border border-[#1A1A1A]/15 space-y-3">
                <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-red-600" />
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1A1A1A]">
                      유튜브 영상 주요 장면 프레임 (YouTube Scene Frames)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-[#666]">
                    YouTube ID: {youtubeId}
                  </span>
                </div>
                <p className="text-xs text-[#555] leading-relaxed">
                  유튜브 영상에서 제공하는 각 시점별 장면 프레임입니다. 아래 카드에서 원하는 장면을 즉시 대표 썸네일로 지정하거나 스틸컷에 추가할 수 있습니다.
                </p>

                {/* 4 YouTube Frame Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {youtubeFrames.map((frame) => (
                    <div
                      key={frame.id}
                      className="border border-[#1A1A1A]/15 bg-[#F8F8F7] p-2.5 flex flex-col space-y-2 group"
                    >
                      <div className="relative aspect-video w-full bg-black overflow-hidden border border-[#1A1A1A]/10">
                        <img
                          src={frame.url}
                          alt={frame.label}
                          onError={(e) => {
                            if (frame.fallback) {
                              (e.target as HTMLImageElement).src = frame.fallback;
                            }
                          }}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-black/80 text-white text-[10px] font-mono font-bold">
                          {frame.timeLabel}
                        </div>
                        {selectedThumb === frame.url && (
                          <div className="absolute top-1.5 right-1.5 px-2 py-0.5 bg-amber-400 text-black text-[10px] font-bold flex items-center gap-1 shadow-xs">
                            <Check className="w-3 h-3" />
                            <span>대표 썸네일</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold text-[#1A1A1A]">
                        <span>{frame.label}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSelectYouTubeFrameAsThumb(frame.url, frame.label)}
                          className="py-1.5 px-2 bg-[#1A1A1A] hover:bg-neutral-800 text-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>썸네일 지정</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectYouTubeFrameAsStill(frame.url, frame.label)}
                          className="py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Camera className="w-3 h-3" />
                          <span>스틸컷 추가</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Local Video Option to scrub with 0.1s precision */}
              <div className="p-4 bg-white border border-dashed border-[#1A1A1A]/30 text-center space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                  원본 영상 파일이 있으신가요? 1프레임 단위로 자유롭게 탐색하고 싶다면:
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#E5E5E3] hover:bg-[#1A1A1A] hover:text-white text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>내 컴퓨터에서 동영상 파일 열기 (MP4, MOV 등)</span>
                </button>
                <p className="text-[11px] text-[#666]">
                  파일을 선택하면 타임라인 슬라이더와 0.1초 프레임 이동 버튼으로 영상 전체를 정밀 탐색할 수 있습니다.
                </p>
              </div>
            </div>
          ) : (
            /* NO VIDEO CURRENTLY LOADED PROMPT */
            <div className="p-8 bg-white border-2 border-dashed border-[#1A1A1A]/20 text-center space-y-3">
              <Video className="w-10 h-10 text-[#1A1A1A]/40 mx-auto" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A1A1A]">
                영상 파일을 선택하여 프레임 캡처 시작
              </h3>
              <p className="text-xs text-[#666] max-w-md mx-auto">
                내 컴퓨터의 동영상 파일(MP4, WebM, MOV)을 선택하면 영상 속 원하는 장면을 정밀하게 탐색하여 대표 썸네일 및 스틸컷으로 캡처할 수 있습니다.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                <Upload className="w-4 h-4" />
                <span>동영상 파일 열기 (MP4, WebM, MOV)</span>
              </button>
            </div>
          )}

          {/* SECTION 2: CAPTURED STILLS GALLERY STRIP */}
          <div className="p-4 bg-white border border-[#1A1A1A]/15 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#1A1A1A]" />
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1A1A1A]">
                  프로젝트 스틸컷 목록 ({recentStills.length}장 등록됨)
                </h4>
              </div>
              <span className="text-[11px] text-[#666]">
                위 영상에서 [＋ 스틸컷에 추가]를 누르면 여기에 등록됩니다.
              </span>
            </div>

            {recentStills.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                {recentStills.map((stillUrl, idx) => (
                  <div
                    key={idx}
                    className="relative group border border-[#1A1A1A]/15 bg-[#F8F8F7] p-1 flex flex-col space-y-1"
                  >
                    <div className="relative aspect-video w-full bg-black overflow-hidden">
                      <img
                        src={stillUrl}
                        alt={`Still ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1 left-1 bg-black/80 text-white text-[9px] font-mono px-1">
                        #{idx + 1}
                      </span>
                      {selectedThumb === stillUrl && (
                        <span className="absolute bottom-1 left-1 bg-amber-400 text-black text-[9px] font-bold px-1">
                          대표 썸네일
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedThumb(stillUrl);
                          onSelectThumbnail(stillUrl);
                          setStatusMessage({
                            text: `스틸컷 #${idx + 1}이 대표 썸네일로 설정되었습니다!`,
                            type: 'thumb',
                          });
                          setTimeout(() => setStatusMessage(null), 3500);
                        }}
                        className="text-[10px] text-[#1A1A1A] hover:underline font-bold flex items-center gap-0.5 cursor-pointer truncate"
                        title="이 스틸컷을 대표 썸네일로 설정"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                        <span>썸네일로</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveStillLocal(idx)}
                        className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer shrink-0"
                        title="이 스틸컷 삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#888] italic py-3 text-center">
                아직 등록된 스틸컷이 없습니다. 위 영상 재생 화면에서 원하는 순간을 찾아 [＋ 현재 장면을 스틸컷에 추가]를 클릭해보세요.
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-[#1A1A1A]/15 bg-white flex items-center justify-between shrink-0">
          <div className="text-xs text-[#666]">
            {selectedThumb && (
              <span className="inline-flex items-center gap-1 text-[#1A1A1A] font-bold">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                대표 썸네일 선택됨
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-[#1A1A1A] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
          >
            완료 / 창 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
