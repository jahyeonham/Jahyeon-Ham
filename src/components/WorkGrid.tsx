import React from 'react';
import { Project } from '../types';
import { Play, Edit3, Trash2, ArrowUp, ArrowDown, Plus, Crop } from 'lucide-react';

interface WorkGridProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  isAdmin?: boolean;
  onEditProject?: (project: Project) => void;
  onCropProject?: (project: Project) => void;
  onDeleteProject?: (id: string) => void;
  onMoveProject?: (index: number, direction: 'up' | 'down') => void;
  onAddNewProject?: () => void;
}

export const WorkGrid: React.FC<WorkGridProps> = ({
  projects,
  onSelectProject,
  isAdmin = false,
  onEditProject,
  onCropProject,
  onDeleteProject,
  onMoveProject,
  onAddNewProject,
}) => {
  return (
    <section id="producer-work-section" className="max-w-6xl mx-auto px-6 sm:px-10 py-12 sm:py-16">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-8 border-b border-[#1A1A1A]/10 pb-4 gap-2">
        <div className="flex items-baseline gap-4">
          <div>
            <span className="block text-[10px] uppercase tracking-[0.25em] font-bold text-[#1A1A1A]/40 mb-1">
              PRODUCER
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase text-[#1A1A1A]">
              BROADCAST
            </h2>
          </div>
          {isAdmin && onAddNewProject && (
            <button
              onClick={onAddNewProject}
              className="px-2.5 py-1 bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-wider hover:opacity-80 transition-opacity inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>방송 프로젝트 추가</span>
            </button>
          )}
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-bold text-[#1A1A1A]">
          Selected Works · 2020—2025
        </span>
      </div>

      {/* 2-Column Work Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 sm:gap-y-14">
        {(projects || []).filter(Boolean).map((project, index) => (
          <article
            key={project.id || `work-${index}`}
            id={`work-card-${project.id || index}`}
            onClick={() => onSelectProject(project)}
            className="group cursor-pointer flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A] relative"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectProject(project);
              }
            }}
          >
            {/* Admin Overlay Controls */}
            {isAdmin && (
              <div
                className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-black/85 backdrop-blur-xs p-1 text-white border border-white/20 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                {onEditProject && (
                  <button
                    onClick={() => onEditProject(project)}
                    className="p-1 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="전체 프로젝트 정보 수정"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
                {onCropProject && (
                  <button
                    onClick={() => onCropProject(project)}
                    className="p-1 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="썸네일 노출 위치 / 초점 맞추기"
                  >
                    <Crop className="w-3.5 h-3.5 text-amber-300" />
                  </button>
                )}
                {onMoveProject && (
                  <>
                    <button
                      disabled={index === 0}
                      onClick={() => onMoveProject(index, 'up')}
                      className="p-1 hover:bg-white/20 disabled:opacity-30 text-white transition-colors cursor-pointer"
                      title="위로 이동"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={index === projects.length - 1}
                      onClick={() => onMoveProject(index, 'down')}
                      className="p-1 hover:bg-white/20 disabled:opacity-30 text-white transition-colors cursor-pointer"
                      title="아래로 이동"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                {onDeleteProject && (
                  <button
                    onClick={() => {
                      if (window.confirm(`"${project.title}" 프로젝트를 삭제하시겠습니까?`)) {
                        onDeleteProject(project.id);
                      }
                    }}
                    className="p-1 hover:bg-red-600 text-red-300 hover:text-white transition-colors cursor-pointer"
                    title="프로젝트 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Video Thumbnail Container */}
            <div className="relative aspect-video w-full overflow-hidden bg-[#E5E5E3] border border-[#1A1A1A]/10 mb-3.5">
              <img
                src={project.thumbnailUrl}
                alt={project.title}
                referrerPolicy="no-referrer"
                style={{ objectPosition: project.thumbnailPosition || 'center' }}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Dim overlay with centered "＋ VIEW CASE STUDY" */}
              <div className="absolute inset-0 bg-[#1A1A1A] opacity-0 group-hover:opacity-60 transition-opacity duration-300 flex items-center justify-center p-4">
                <span className="text-white text-[10px] font-bold tracking-[0.2em] border border-white px-4 py-2 uppercase transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                  VIEW CASE STUDY
                </span>
              </div>

              {/* Highlight Metric Pill (top right) */}
              {project.highlightBadge && (
                <div className="absolute top-3 right-3 z-10">
                  <span className="inline-flex items-center text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 bg-[#1A1A1A] text-white">
                    {project.highlightBadge}
                  </span>
                </div>
              )}

              {/* Subtle film grain play indicator */}
              <div className="absolute bottom-3 left-3 opacity-60 group-hover:opacity-100 transition-opacity">
                <div className="w-6 h-6 rounded-none bg-[#1A1A1A]/80 flex items-center justify-center text-white">
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </div>
              </div>
            </div>

            {/* Thumbnail Info Block */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[#1A1A1A] group-hover:opacity-60 transition-opacity">
                  {project.title}
                </h3>
                <p className="text-[10px] uppercase tracking-widest opacity-50 font-medium text-[#1A1A1A] mt-0.5">
                  {project.category}
                </p>
              </div>

              {project.metrics && (
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono font-bold bg-[#1A1A1A] text-white px-2 py-0.5 uppercase tracking-wider">
                    {project.metrics}
                  </span>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

