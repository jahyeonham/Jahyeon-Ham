import React from 'react';

interface HeaderProps {
  onContactClick: () => void;
  onHomeClick?: () => void;
  linkedinUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onContactClick,
  onHomeClick,
  linkedinUrl = 'https://www.linkedin.com/in/jahyeonham',
}) => {
  return (
    <header className="w-full bg-[#F8F8F7]/95 backdrop-blur-sm sticky top-0 z-40 border-t border-[#1A1A1A]">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 pt-4 pb-4 flex items-center justify-between border-b border-[#1A1A1A]/10">
        {/* Left: JAHYEON HAM */}
        <button
          id="header-logo-btn"
          onClick={onHomeClick}
          className="text-xs font-semibold uppercase tracking-widest text-[#1A1A1A] hover:opacity-50 transition-opacity text-left cursor-pointer"
        >
          JAHYEON HAM
        </button>

        {/* Right: LINKEDIN & CONTACT */}
        <nav className="flex items-center gap-8 text-xs font-semibold uppercase tracking-widest text-[#1A1A1A]">
          {linkedinUrl ? (
            <a
              id="nav-linkedin-link"
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-50 transition-opacity"
            >
              LinkedIn
            </a>
          ) : (
            <button
              onClick={onContactClick}
              className="hover:opacity-50 transition-opacity cursor-pointer"
            >
              LinkedIn
            </button>
          )}

          <button
            id="nav-contact-btn"
            onClick={onContactClick}
            className="hover:opacity-50 transition-opacity cursor-pointer uppercase font-semibold"
          >
            Contact
          </button>
        </nav>
      </div>
    </header>
  );
};

