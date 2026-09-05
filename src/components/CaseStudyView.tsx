import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  Edit3,
  Film,
  Crop,
  X,
  Maximize2,
  Check,
  Video,
} from 'lucide-react';
import { extractYouTubeId, getYouTubeEmbedUrl, isDirectVideoUrl } from '../utils';
import { getVideoUrlFromStorage } from '../videoStorage';
import { QuickVideoModal } from './QuickVideoModal';
import { VideoFramePickerModal } from './VideoFramePickerModal';

interface CaseStudyViewProps {
  project: Project;
  onBack: () => void;
  onSelectProject: (project: Project) => void;
  allProjects: Project[];
  isAdmin?: boolean;
  onEditProject?: (project: Project) => void;
  onCropProject?: (project: Project) => void;
  onUpdateProjectVideo?: (projectId: string, newVideoUrl: string, updateThumbnail?: boolean) => void;
  onRequestAdminLogin?: () => void;
  onSaveProject?: (project: Project, isNew: boolean) => void;
}

export const CaseStudyView: React.FC<CaseStudyViewProps> = ({
  project,
  onBack,
  onSelectProject,
  allProjects,
  isAdmin = false,
  onEditProject,
  onCropProject,
  onUpdateProjectVideo,
  onRequestAdminLogin,
  onSaveProject,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(24);
  const [isLiveYouTubeActive, setIsLiveYouTubeActive] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isQuickVideoModalOpen, setIsQuickVideoModalOpen] = useState(false);
  const [isFramePickerOpen, setIsFramePickerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [storedVideoUrl, setStoredVideoUrl] = useState<string | null>(null);

  // Load any local uploaded video from IndexedDB
  useEffect(() => {
    let isCancelled = false;
    async function checkStoredVideo() {
      try {
        const localUrl = await getVideoUrlFromStorage(project.id);
        if (!isCancelled) {
          setStoredVideoUrl(localUrl);
        }
      } catch {
        if (!isCancelled) setStoredVideoUrl(null);
      }
    }
    checkStoredVideo();
    return () => {
      isCancelled = true;
    };
  }, [project.id, project.videoUrl]);

  // Determine direct video source (local upload or direct mp4/webm/blob URL)
  const directVideoSrc =
    storedVideoUrl ||
    (project.videoUrl && isDirectVideoUrl(project.videoUrl) ? project.videoUrl : null);

  // Check if there is a YouTube video ID (only if not a direct video)
  const youtubeId = !directVideoSrc
    ? extractYouTubeId(project.videoUrl) || extractYouTubeId(project.externalUrl)
    : null;

  // Scroll to top when project changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsPlaying(true);
    setIsLiveYouTubeActive(true);
    setLightboxIndex(null);
  }, [project.id]);

  const handleSaveVideo = async (projectId: string, newVideoUrl: string, updateThumbnail?: boolean) => {
    if (onUpdateProjectVideo) {
      onUpdateProjectVideo(projectId, newVideoUrl, updateThumbnail);
      try {
        const localUrl = await getVideoUrlFromStorage(projectId);
        setStoredVideoUrl(localUrl);
      } catch {}
      setToastMessage('영상이 성공적으로 변경되었습니다.');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Simulate video playback progress bar when not in YouTube iframe
  useEffect(() => {
    if (!isPlaying || isLiveYouTubeActive) return;
    const interval = setInterval(() => {
      setVideoProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
    }, 200);
    return () => clearInterval(interval);
  }, [isPlaying, isLiveYouTubeActive]);

  // Keyboard navigation for stills lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight' && project.stills) {
        setLightboxIndex((prev) =>
          prev !== null && prev < project.stills!.length - 1 ? prev + 1 : 0
        );
      }
      if (e.key === 'ArrowLeft' && project.stills) {
        setLightboxIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : project.stills!.length - 1
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, project.stills]);

  // Find index for Prev / Next navigation
  const currentIndex = allProjects.findIndex((p) => p.id === project.id);
  const prevProject =
    currentIndex > 0 ? allProjects[currentIndex - 1] : allProjects[allProjects.length - 1];
  const nextProject =
    currentIndex < allProjects.length - 1 ? allProjects[currentIndex + 1] : allProjects[0];

  const externalWatchUrl =
    project.externalUrl ||
    (youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : '#');

  return (
    <article
      id={`case-study-page-${project.id}`}
      className="w-full bg-[#F8F8F7] text-[#1A1A1A] pt-8 sm:pt-12 pb-24 sm:pb-32"
    >
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        {/* ← BACK TO WORK Button & Admin Edit */}
        <div className="mb-8 sm:mb-12 flex items-center justify-between flex-wrap gap-3">
          <button
            id="back-to-work-btn"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>{project.isPersonal ? 'BACK TO PERSONAL WORKS' : 'BACK TO WORK'}</span>
          </button>

          {/* Admin Edit Action Buttons (Only visible when logged in as admin) */}
          {isAdmin && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsFramePickerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] hover:bg-neutral-800 text-white text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer shadow-xs"
                title="영상 속 장면을 탐색하여 대표 썸네일로 지정하거나 스틸컷을 캡처합니다"
              >
                <Film className="w-3.5 h-3.5 text-amber-400" />
                <span>🎬 썸네일 &amp; 스틸컷 캡처</span>
              </button>

              <button
                onClick={() => setIsQuickVideoModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer shadow-xs"
                title="유튜브 영상 URL 바로 수정"
              >
                <Video className="w-3.5 h-3.5" />
                <span>영상 소스 수정</span>
              </button>

              {onCropProject && (
                <button
                  onClick={() => onCropProject(project)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E5E5E3] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer shadow-xs"
                  title="대표 썸네일 노출 위치 / 초점 조절"
                >
                  <Crop className="w-3.5 h-3.5 text-red-600" />
                  <span>썸네일 초점 조절</span>
                </button>
              )}

              {onEditProject && (
                <button
                  onClick={() => onEditProject(project)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] text-white text-[10px] font-bold tracking-wider uppercase hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>전체 정보 수정</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Title & Category Header */}
        <header className="mb-8 sm:mb-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter uppercase text-[#1A1A1A] font-sans">
              {project.title}
            </h1>

            {project.highlightBadge && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1A1A1A] text-white text-[10px] font-bold tracking-widest uppercase font-mono">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{project.highlightBadge}</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm uppercase tracking-widest opacity-60 font-semibold text-[#1A1A1A]">
            <span>{project.category}</span>
            {project.koreanTitle && (
              <>
                <span>·</span>
                <span className="font-normal tracking-normal text-[#555]">
                  {project.koreanTitle}
                </span>
              </>
            )}
          </div>
        </header>

        {/* Video Player Showcase Area */}
        <div className="relative aspect-video w-full bg-black overflow-hidden border border-[#1A1A1A]/10 shadow-md group mb-10 sm:mb-14">
          {/* Quick Edit Overlay Button (Admin Only) */}
          {isAdmin && (
            <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
              <button
                onClick={() => setIsQuickVideoModalOpen(true)}
                className="bg-[#1A1A1A]/90 hover:bg-black text-white border border-white/20 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 shadow-lg flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs hover:border-red-500"
                title="유튜브 영상 또는 직접 업로드 영상 수정"
              >
                <Video className="w-3.5 h-3.5 text-red-500" />
                <span>영상 변경 / 업로드</span>
              </button>
            </div>
          )}

          {/* Case 1: Direct HTML5 Video (User Uploaded or MP4/WebM Link) */}
          {directVideoSrc ? (
            <div className="w-full h-full relative bg-black flex items-center justify-center">
              <video
                key={directVideoSrc}
                src={directVideoSrc}
                poster={project.backdropUrl || project.thumbnailUrl}
                controls
                playsInline
                preload="metadata"
                className="w-full h-full object-contain"
              >
                현재 브라우저에서 비디오 태그를 지원하지 않습니다.
              </video>
            </div>
          ) : youtubeId ? (
            /* Case 2: YouTube Embed Player */
            <div className="w-full h-full relative bg-black">
              <iframe
                key={youtubeId}
                src={getYouTubeEmbedUrl(youtubeId, false) || ''}
                title={project.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            /* Case 3: Still Image Fallback */
            <div className="w-full h-full relative flex items-center justify-center">
              <img
                src={project.backdropUrl || project.thumbnailUrl}
                alt={project.title}
                referrerPolicy="no-referrer"
                style={{ objectPosition: project.thumbnailPosition || 'center' }}
                className="w-full h-full object-cover filter brightness-85"
              />
              {isAdmin ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/60">
                  <Video className="w-10 h-10 text-white/70 mb-3" />
                  <p className="text-white text-sm font-bold uppercase tracking-wider mb-1">
                    등록된 영상이 없습니다
                  </p>
                  <p className="text-white/70 text-xs max-w-sm mb-4">
                    유튜브 영상 URL을 연결하거나 동영상 파일(MP4 등)을 직접 업로드하세요.
                  </p>
                  <button
                    onClick={() => setIsQuickVideoModalOpen(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>영상 등록 (유튜브 / 직접 업로드)</span>
                  </button>
                </div>
              ) : (
                <div className="absolute bottom-4 left-4 pointer-events-none">
                  <span className="text-[10px] font-mono tracking-widest text-neutral-300 bg-[#1A1A1A]/85 px-2.5 py-1">
                    BROADCAST STILL PREVIEW
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ROLE & SCOPE Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-y border-[#1A1A1A]/10 mb-12 sm:mb-16">
          {/* ROLE */}
          <div>
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 text-[#1A1A1A] mb-2">
              ROLE
            </h3>
            <p className="text-base sm:text-lg font-bold uppercase tracking-tight text-[#1A1A1A]">
              {project.role}
            </p>
            {project.broadcastNetwork && (
              <p className="text-xs text-[#555] font-mono mt-1">
                {project.broadcastNetwork}
              </p>
            )}
          </div>

          {/* SCOPE */}
          <div>
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 text-[#1A1A1A] mb-2">
              SCOPE
            </h3>
            <p className="text-base sm:text-lg font-bold uppercase tracking-tight text-[#1A1A1A]">
              {project.scope}
            </p>
            <p className="text-xs text-[#555] font-mono mt-1">
              {project.year}
            </p>
          </div>
        </div>

        {/* ABOUT THE PROJECT */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 text-[#1A1A1A] mb-4">
            ABOUT THE PROJECT
          </h2>
          <div className="text-sm sm:text-base text-[#555] leading-relaxed space-y-4">
            <p>{project.about}</p>
          </div>
        </section>

        {/* MY CONTRIBUTION */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 text-[#1A1A1A] mb-4">
            MY CONTRIBUTION
          </h2>
          <div className="text-sm sm:text-base text-[#555] leading-relaxed space-y-4">
            <p>{project.contribution}</p>
          </div>

          {/* Deliverables / Detailed Scope Breakdown */}
          {project.productionDetails?.deliverables &&
            project.productionDetails.deliverables.length > 0 && (
              <div className="mt-8 bg-[#E5E5E3] p-6 sm:p-8 border border-[#1A1A1A]/10">
                <h4 className="text-[10px] font-bold tracking-widest uppercase text-[#1A1A1A]/60 mb-4">
                  Key Deliverables &amp; Workflow
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {project.productionDetails.deliverables.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-[#1A1A1A] font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#1A1A1A] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </section>

        {/* WATCH VIDEO ↗ Button & External Link */}
        <div className="pt-4 pb-12 border-b border-[#1A1A1A]/10 flex flex-wrap items-center gap-4">
          {youtubeId && !isLiveYouTubeActive && (
            <button
              onClick={() => {
                setIsLiveYouTubeActive(true);
                window.scrollTo({ top: 180, behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold tracking-widest uppercase px-8 py-3.5 cursor-pointer transition-colors"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>PLAY VIDEO NOW</span>
            </button>
          )}

          {externalWatchUrl !== '#' && (
            <a
              id="watch-video-link"
              href={externalWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#1A1A1A] text-white hover:opacity-75 transition-opacity text-xs font-bold tracking-widest uppercase px-8 py-3.5 cursor-pointer"
            >
              <span>{project.isPersonal ? 'WATCH VIDEO' : 'WATCH ON YOUTUBE / BROADCAST'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Production Stills / Visual Gallery */}
        {((project.stills && project.stills.length > 0) || isAdmin) && (
          <section className="py-12 border-b border-[#1A1A1A]/10">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 text-[#1A1A1A]">
                  PRODUCTION STILLS &amp; FRAMES ({project.stills?.length || 0})
                </h3>
                {isAdmin && (
                  <button
                    onClick={() => setIsFramePickerOpen(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer shadow-2xs"
                    title="영상 속 장면을 스틸컷으로 캡처 추가"
                  >
                    <Film className="w-3 h-3 text-white" />
                    <span>영상에서 스틸컷 캡처 추가</span>
                  </button>
                )}
              </div>
              <span className="text-[10px] text-[#1A1A1A]/50 uppercase font-mono">
                클릭하여 확대보기
              </span>
            </div>

            {project.stills && project.stills.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {project.stills.map((stillUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setLightboxIndex(idx)}
                    className="aspect-video bg-[#E5E5E3] overflow-hidden border border-[#1A1A1A]/10 relative group cursor-pointer"
                  >
                    <img
                      src={stillUrl}
                      alt={`${project.title} still ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Maximize2 className="w-5 h-5 drop-shadow" />
                    </div>
                    <span className="absolute bottom-1.5 right-1.5 bg-black/75 text-white text-[9px] font-mono px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      FRAME {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-white border border-dashed border-[#1A1A1A]/20 text-center space-y-2">
                <p className="text-xs text-[#666]">
                  아직 등록된 스틸컷이 없습니다.
                </p>
                <button
                  onClick={() => setIsFramePickerOpen(true)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Film className="w-3.5 h-3.5 text-white" />
                  <span>영상에서 원하는 장면 캡처하여 스틸컷 만들기</span>
                </button>
              </div>
            )}
          </section>
        )}

        {/* Next / Previous Project Navigation */}
        <div className="pt-10 flex items-center justify-between text-xs font-bold uppercase tracking-widest">
          {prevProject ? (
            <button
              onClick={() => onSelectProject(prevProject)}
              className="inline-flex items-center gap-2 text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span className="hidden sm:inline">PREV:</span>
              <span className="text-[#1A1A1A]">{prevProject.title}</span>
            </button>
          ) : <div />}

          {nextProject ? (
            <button
              onClick={() => onSelectProject(nextProject)}
              className="inline-flex items-center gap-2 text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors group cursor-pointer"
            >
              <span className="hidden sm:inline">NEXT:</span>
              <span className="text-[#1A1A1A]">{nextProject.title}</span>
              <ArrowLeft className="w-4 h-4 rotate-180 transition-transform group-hover:translate-x-1" />
            </button>
          ) : <div />}
        </div>
      </div>

      {/* Production Stills Lightbox Modal */}
      {lightboxIndex !== null && project.stills && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white transition-colors cursor-pointer p-1 flex items-center gap-1 text-xs font-mono"
            >
              <span>CLOSE [ESC]</span>
              <X className="w-4 h-4" />
            </button>

            {/* Main Image */}
            <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center border border-white/20">
              <img
                src={project.stills[lightboxIndex]}
                alt={`Still frame ${lightboxIndex + 1}`}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Bottom Caption & Navigation */}
            <div className="w-full flex items-center justify-between text-white text-xs pt-3 font-mono">
              <button
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev !== null && prev > 0 ? prev - 1 : project.stills!.length - 1
                  )
                }
                className="hover:opacity-75 transition-opacity flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>PREV</span>
              </button>

              <span className="opacity-70">
                {lightboxIndex + 1} / {project.stills.length}
              </span>

              <button
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev !== null && prev < project.stills!.length - 1 ? prev + 1 : 0
                  )
                }
                className="hover:opacity-75 transition-opacity flex items-center gap-1 cursor-pointer"
              >
                <span>NEXT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick YouTube Video Modal */}
      <QuickVideoModal
        isOpen={isQuickVideoModalOpen}
        onClose={() => setIsQuickVideoModalOpen(false)}
        project={project}
        onSave={handleSaveVideo}
      />

      {/* Video Frame & Still Capture Studio Modal */}
      <VideoFramePickerModal
        isOpen={isFramePickerOpen}
        onClose={() => setIsFramePickerOpen(false)}
        videoSource={storedVideoUrl || project.videoUrl || project.externalUrl}
        projectId={project.id}
        projectTitle={project.title}
        currentThumbnail={project.thumbnailUrl}
        currentStills={project.stills}
        onSelectThumbnail={(thumbUrl) => {
          const updated = {
            ...project,
            thumbnailUrl: thumbUrl,
            backdropUrl: project.backdropUrl || thumbUrl,
          };
          if (onSaveProject) {
            onSaveProject(updated, false);
          }
          setToastMessage('대표 썸네일이 변경 및 안전하게 저장되었습니다.');
          setTimeout(() => setToastMessage(null), 3000);
        }}
        onAddStill={(stillUrl) => {
          const updated = {
            ...project,
            stills: [...(project.stills || []), stillUrl],
          };
          if (onSaveProject) {
            onSaveProject(updated, false);
          }
          setToastMessage('스틸컷이 추가 및 저장되었습니다.');
          setTimeout(() => setToastMessage(null), 3000);
        }}
        onRemoveStill={(idx) => {
          const updated = {
            ...project,
            stills: (project.stills || []).filter((_, i) => i !== idx),
          };
          if (onSaveProject) {
            onSaveProject(updated, false);
          }
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A1A1A] text-white px-4 py-3 shadow-2xl border border-emerald-500/40 text-xs font-bold flex items-center gap-2 rounded-xs animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </article>
  );
};
