import React from 'react';

export const Intro: React.FC = () => {
  return (
    <section id="intro-section" className="max-w-6xl mx-auto px-6 sm:px-10 pt-10 pb-12 sm:pt-14 sm:pb-16">
      <div className="max-w-3xl">
        <div className="text-[15px] sm:text-[17px] leading-relaxed text-[#2A2A2A] font-normal space-y-3">
          <p>
            <span className="font-semibold text-[#1A1A1A]">Jahyeon Ham</span>
            <span className="text-[#666] font-normal mx-1">
              (pronounced jah-hyun)
            </span>
            is a Korean producer and storyteller currently based in Sydney, Australia.
          </p>
          <p className="text-[#444]">
            She specializes in video production, editing, and digital content. Her work spans broadcast television, social media, and branded content, with a particular interest in creating stories that connect with audiences.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-[10px] tracking-widest uppercase font-bold text-[#1A1A1A]">
          <span className="px-2.5 py-1 bg-[#E5E5E3] text-[#1A1A1A]">Directing</span>
          <span className="px-2.5 py-1 bg-[#E5E5E3] text-[#1A1A1A]">Production Planning</span>
          <span className="px-2.5 py-1 bg-[#E5E5E3] text-[#1A1A1A]">Broadcast Television</span>
          <span className="px-2.5 py-1 bg-[#E5E5E3] text-[#1A1A1A]">Digital Content</span>
          <span className="px-2.5 py-1 bg-[#E5E5E3] text-[#1A1A1A]">Video Editing</span>
        </div>
      </div>
    </section>
  );
};

