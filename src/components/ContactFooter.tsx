import React, { useState } from 'react';
import { ArrowUp, Check, Copy, ExternalLink, Mail, Edit3, Youtube, Video } from 'lucide-react';
import { ContactLinksData } from '../types';

interface ContactFooterProps {
  onContactClick: () => void;
  onAdminClick?: () => void;
  onEditLinks?: () => void;
  isAdmin?: boolean;
  contactLinks?: ContactLinksData;
}

export const ContactFooter: React.FC<ContactFooterProps> = ({
  onContactClick,
  onAdminClick,
  onEditLinks,
  isAdmin = false,
  contactLinks,
}) => {
  const [copied, setCopied] = useState(false);
  const email = contactLinks?.email || 'jahyeonham@gmail.com';
  const linkedinUrl = contactLinks?.linkedinUrl || 'https://www.linkedin.com/in/jahyeonham';
  const instagramUrl = contactLinks?.instagramUrl;
  const youtubeUrl = contactLinks?.youtubeUrl;
  const vimeoUrl = contactLinks?.vimeoUrl;
  const locationText = contactLinks?.locationText || 'Sydney, Australia';
  const customLinks = contactLinks?.customLinks || [];

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="contact-footer-section" className="border-t border-[#1A1A1A]/10 bg-[#F8F8F7] pt-16 sm:pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-6 sm:px-10">
        {/* Main Final Section: Split layout with large Thank You on left, and GET IN TOUCH & CONNECT side-by-side on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-start pb-16 sm:pb-20">
          {/* Left Column: Thank you for checking out! */}
          <div className="lg:col-span-7">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tighter uppercase leading-[0.98] text-[#1A1A1A] font-sans">
              Thank you<br />
              for checking out!
            </h2>
            <p className="text-[10px] uppercase tracking-widest mt-6 opacity-40 font-bold text-[#1A1A1A]">
              © 2026 Jahyeon Ham · {locationText}
            </p>
          </div>

          {/* Right Column: GET IN TOUCH & CONNECT */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row gap-10 sm:gap-16 lg:pl-4">
            {/* GET IN TOUCH */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 text-[#1A1A1A]">
                  GET IN TOUCH
                </p>
                {isAdmin && onEditLinks && (
                  <button
                    onClick={onEditLinks}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-0.5 cursor-pointer underline"
                    title="연락처 및 이메일 수정"
                  >
                    <Edit3 className="w-2.5 h-2.5" />
                    <span>수정</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <a
                  id="footer-email-link"
                  href={`mailto:${email}`}
                  className="text-xs sm:text-sm font-semibold text-[#1A1A1A] hover:opacity-50 transition-opacity block"
                >
                  {email}
                </a>

                <button
                  id="footer-copy-email-btn"
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] hover:opacity-70 transition-opacity px-2 py-1 bg-[#E5E5E3] cursor-pointer"
                  title="Copy email to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* CONNECT */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 text-[#1A1A1A]">
                  CONNECT
                </p>
                {isAdmin && onEditLinks && (
                  <button
                    onClick={onEditLinks}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-0.5 cursor-pointer underline"
                    title="소셜 및 외부 링크 수정"
                  >
                    <Edit3 className="w-2.5 h-2.5" />
                    <span>수정</span>
                  </button>
                )}
              </div>

              <ul className="text-xs sm:text-sm font-semibold space-y-2 text-[#1A1A1A]">
                {linkedinUrl && (
                  <li>
                    <a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:opacity-50 transition-opacity group"
                    >
                      <span>LinkedIn</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                )}

                {instagramUrl && (
                  <li>
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:opacity-50 transition-opacity group"
                    >
                      <span>Instagram</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                )}

                {youtubeUrl && (
                  <li>
                    <a
                      href={youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:opacity-50 transition-opacity group"
                    >
                      <span>YouTube</span>
                      <Youtube className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                )}

                {vimeoUrl && (
                  <li>
                    <a
                      href={vimeoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:opacity-50 transition-opacity group"
                    >
                      <span>Vimeo</span>
                      <Video className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                )}

                {/* Custom External Links */}
                {customLinks.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:opacity-50 transition-opacity group"
                    >
                      <span>{item.label}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}

                <li>
                  <button
                    onClick={onContactClick}
                    className="inline-flex items-center gap-1 hover:opacity-50 transition-opacity group cursor-pointer"
                  >
                    <span>Email</span>
                    <Mail className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Small Bottom Footer */}
        <div className="pt-6 border-t border-[#1A1A1A]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono uppercase tracking-widest text-[#1A1A1A]/50">
          <div className="flex items-center gap-3">
            <span>VIDEO PRODUCER &amp; DIRECTOR · SYDNEY &amp; SEOUL</span>
            {onAdminClick && (
              <>
                <span>·</span>
                <button
                  onClick={onAdminClick}
                  className="hover:text-[#1A1A1A] underline underline-offset-2 transition-colors cursor-pointer"
                  title="관리자 설정"
                >
                  {isAdmin ? 'ADMIN ACTIVE' : 'ADMIN'}
                </button>
              </>
            )}
          </div>

          <button
            id="back-to-top-btn"
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 text-[#1A1A1A] hover:opacity-50 transition-opacity font-bold tracking-widest uppercase cursor-pointer py-1"
          >
            <span>BACK TO TOP</span>
            <ArrowUp className="w-3 h-3" />
          </button>
        </div>
      </div>
    </footer>
  );
};
