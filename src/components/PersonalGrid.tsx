import React from 'react';
import { Project } from '../types';
import { Edit3, Trash2, ArrowUp, ArrowDown, Plus, Crop } from 'lucide-react';

interface PersonalGridProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  isAdmin?: boolean;
  onEditProject?: (project: Project) => void;
  onCropProject?: (project: Project) => void;
  onDeleteProject?: (id: string) => void;
  onMoveProject?: (index: number, direction: 'up' | 'down') => void;
  onAddNewProject?: () => void;
}

export const PersonalGrid: React.FC<PersonalGridProps> = ({
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
    <section
      id="personal-works-section"
      className="max-w-6xl mx-auto px-6 sm:px-10 py-12 sm:py-16"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-8 sm:mb-12 border-b border-[#1A1A1A]/10 pb-5 gap-3">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter uppercase text-[#1A1A1A]">
              PERSONAL WORKS
            </h2>
            {isAdmin && onAddNewProject && (
              <button
                onClick={onAddNewProject}
                className="px-2.5 py-1 bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-wider hover:opacity-80 transition-opacity inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>개인 프로젝트 추가</span>
              </button>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#555] mt-2 max-w-xl leading-relaxed">
            Selected personal projects exploring music, performance, and visual storytelling.
          </p>
        </div>

        <span className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-bold text-[#1A1A1A] shrink-0 font-mono">
          Music Video · Live · Visual
        </span>
      </div>

      {/* 2-Column Grid as Requested */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-12 gap-y-12 sm:gap-y-16">
        {(projects || []).filter(Boolean).map((project, index) => (
          <article
            key={project.id || `personal-${index}`}
            id={`personal-card-${project.id || index}`}
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
                {onCropProject && (
                  <button
                    onClick={() => onCropProject(project)}
                    className="p-1 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="썸네일 노출 위치 조절"
                  >
                    <Crop className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                )}
                {onEditProject && (
                  <button
                    onClick={() => onEditProject(project)}
                    className="p-1 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="프로젝트 수정"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
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

            {/* Video / Thumbnail Container */}
            <div className="relative aspect-video w-full overflow-hidden bg-[#E5E5E3] border border-[#1A1A1A]/10 mb-4">
              <img
                src={project.thumbnailUrl}
                alt={project.title}
                referrerPolicy="no-referrer"
                style={{ objectPosition: project.thumbnailPosition || 'center' }}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Hover Effect: ＋ VIEW PROJECT */}
              <div className="absolute inset-0 bg-[#1A1A1A]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
                <span className="inline-flex items-center gap-1.5 text-white text-[11px] sm:text-xs font-bold tracking-[0.25em] uppercase border border-white/80 px-5 py-2.5 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300 bg-[#1A1A1A]/40 backdrop-blur-2xs">
                  ＋ VIEW PROJECT
                </span>
              </div>

              {/* Highlight Badge if exists */}
              {project.highlightBadge && (
                <div className="absolute top-3 right-3 z-10 pointer-events-none">
                  <span className="inline-flex items-center text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 bg-[#1A1A1A] text-white">
                    {project.highlightBadge}
                  </span>
                </div>
              )}
            </div>

            {/* Typography: Artist Name & Category */}
            <div className="flex flex-col">
              <h3 className="text-base sm:text-lg font-bold uppercase tracking-tight text-[#1A1A1A] group-hover:opacity-60 transition-opacity">
                {project.title}
              </h3>
              <p className="text-xs uppercase tracking-widest opacity-60 font-medium text-[#1A1A1A] mt-1">
                {project.category}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
