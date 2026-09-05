import React from 'react';
import { ArrowUpRight, Camera, MapPin, Edit3 } from 'lucide-react';
import { AboutData } from '../types';

interface AboutMeProps {
  onContactClick: () => void;
  aboutData: AboutData;
  isAdmin?: boolean;
  onEditAbout?: () => void;
}

export const AboutMe: React.FC<AboutMeProps> = ({
  onContactClick,
  aboutData,
  isAdmin = false,
  onEditAbout,
}) => {
  return (
    <section id="about-me-section" className="max-w-6xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-4 mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase text-[#1A1A1A]">
          ABOUT ME
        </h2>
        {isAdmin && onEditAbout && (
          <button
            onClick={onEditAbout}
            className="px-2.5 py-1 bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-wider hover:opacity-80 transition-opacity inline-flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>소개글 수정</span>
          </button>
        )}
      </div>

      {/* 2-Column Layout: Text & Behind-The-Scenes Photo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Left / Main Text column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1A1A1A] leading-snug">
            {aboutData.greeting}
          </h3>

          <div className="space-y-4 text-sm sm:text-base text-[#555] leading-relaxed font-normal">
            {aboutData.paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}

            <p className="pt-2 text-[#1A1A1A]">
              If you’d like to work together, talk about a project, or simply have a virtual coffee, feel free to{' '}
              <button
                onClick={onContactClick}
                className="underline underline-offset-4 decoration-[#1A1A1A]/40 hover:decoration-[#1A1A1A] font-bold text-[#1A1A1A] transition-colors inline-flex items-center gap-0.5 cursor-pointer"
              >
                get in touch
                <ArrowUpRight className="w-4 h-4 inline" />
              </button>
              .
            </p>
          </div>

          <div className="pt-6 border-t border-[#1A1A1A]/10 text-xs tracking-wider uppercase">
            <div>
              <span className="block text-[#1A1A1A]/40 text-[10px] font-bold tracking-widest mb-1">LOCATION</span>
              <span className="font-bold text-[#1A1A1A] inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#1A1A1A]" />
                {aboutData.location}
              </span>
            </div>
          </div>
        </div>

        {/* Right / Behind the Scenes Photo Column (5 cols) */}
        <div className="lg:col-span-5">
          <div className="relative border border-[#1A1A1A]/10 bg-[#E5E5E3] p-2">
            <div className="overflow-hidden aspect-4/3 relative bg-[#1A1A1A]">
              <img
                src={aboutData.photoUrl || '/src/assets/images/jahyeon_behind_the_scenes_1788441041611.jpg'}
                alt="Jahyeon Ham behind the scenes on broadcast production set"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center grayscale contrast-110 hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute top-2 left-2 bg-[#1A1A1A] text-white text-[10px] font-mono uppercase px-2 py-0.5 tracking-wider font-bold">
                BTS · On Set
              </div>
            </div>

            <div className="mt-2 px-1 pb-1 flex items-center justify-between text-[10px] text-[#1A1A1A]/60 font-mono uppercase tracking-wider">
              <span className="flex items-center gap-1 font-medium">
                <Camera className="w-3 h-3 text-[#1A1A1A]/50" />
                Behind the scenes · Production monitor
              </span>
              <span>Seoul / Sydney</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

