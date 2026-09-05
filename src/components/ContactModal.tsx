import React, { useState } from 'react';
import { X, Copy, Check, Mail, ExternalLink, Send, Edit3, Youtube, Video } from 'lucide-react';
import { ContactLinksData } from '../types';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactLinks?: ContactLinksData;
  isAdmin?: boolean;
  onEditLinks?: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  contactLinks,
  isAdmin = false,
  onEditLinks,
}) => {
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const email = contactLinks?.email || 'jahyeonham@gmail.com';
  const linkedinUrl = contactLinks?.linkedinUrl || 'https://www.linkedin.com/in/jahyeonham';
  const instagramUrl = contactLinks?.instagramUrl;
  const youtubeUrl = contactLinks?.youtubeUrl;
  const vimeoUrl = contactLinks?.vimeoUrl;
  const locationText = contactLinks?.locationText || 'Sydney, Australia';
  const customLinks = contactLinks?.customLinks || [];

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoSubject = encodeURIComponent(
      subject || `Project Inquiry from ${name || 'Collaborator'}`
    );
    const mailtoBody = encodeURIComponent(
      `Hello Jahyeon,\n\n${message}\n\nBest regards,\n${name}`
    );
    window.location.href = `mailto:${email}?subject=${mailtoSubject}&body=${mailtoBody}`;
  };

  return (
    <div
      id="contact-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="contact-modal-content"
        className="bg-[#F8F8F7] border border-[#1A1A1A] w-full max-w-lg p-6 sm:p-8 shadow-2xl relative text-[#1A1A1A]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-contact-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors cursor-pointer p-1"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 text-[#1A1A1A] mb-1">
            GET IN TOUCH
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase text-[#1A1A1A]">
            Let&apos;s talk stories &amp; projects.
          </h2>
          <p className="text-xs sm:text-sm text-[#555] mt-2 leading-relaxed">
            Currently based in {locationText}. Open for directing, producing, and digital video opportunities.
          </p>
        </div>

        {/* Email Direct Copy Box */}
        <div className="bg-[#E5E5E3] border border-[#1A1A1A]/10 p-3.5 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#1A1A1A] text-xs sm:text-sm font-mono truncate font-semibold">
            <Mail className="w-4 h-4 text-[#1A1A1A]/60 shrink-0" />
            <span className="truncate">{email}</span>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 bg-[#1A1A1A] text-white hover:opacity-80 transition-opacity shrink-0 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>COPIED</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>COPY</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Message Form */}
        <form onSubmit={handleSendEmail} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
              Your Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Kim / Production Studio"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Project Inquiry / Directing / Coffee Chat"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 mb-1">
              Message
            </label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell me a bit about what you're working on or want to create..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#1A1A1A]/20 focus:outline-none focus:border-[#1A1A1A] transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#1A1A1A] text-white text-[10px] font-bold tracking-[0.2em] uppercase hover:opacity-85 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>OPEN EMAIL DRAFT</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Social Links */}
        <div className="mt-6 pt-5 border-t border-[#1A1A1A]/10 flex flex-wrap items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A]/60">
          <span>Connect:</span>
          <div className="flex flex-wrap items-center gap-3 text-[#1A1A1A]">
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-50 transition-opacity inline-flex items-center gap-1"
              >
                <span>LinkedIn</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            )}

            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-50 transition-opacity inline-flex items-center gap-1"
              >
                <span>Instagram</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            )}

            {youtubeUrl && (
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-50 transition-opacity inline-flex items-center gap-1"
              >
                <span>YouTube</span>
                <Youtube className="w-3 h-3 opacity-50" />
              </a>
            )}

            {vimeoUrl && (
              <a
                href={vimeoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-50 transition-opacity inline-flex items-center gap-1"
              >
                <span>Vimeo</span>
                <Video className="w-3 h-3 opacity-50" />
              </a>
            )}

            {customLinks.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-50 transition-opacity inline-flex items-center gap-1"
              >
                <span>{item.label}</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            ))}
          </div>
        </div>

        {/* Admin Quick Action in Modal */}
        {isAdmin && onEditLinks && (
          <div className="mt-4 pt-3 border-t border-dashed border-[#1A1A1A]/15 text-center">
            <button
              onClick={() => {
                onClose();
                onEditLinks();
              }}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>관리자: 연결 링크 및 연락처 정보 수정하기</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
