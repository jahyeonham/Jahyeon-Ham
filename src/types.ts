export interface Project {
  id: string;
  title: string;
  koreanTitle?: string;
  category: string;
  year: string;
  role: string;
  scope: string;
  metrics?: string;
  highlightBadge?: string;
  thumbnailUrl: string;
  thumbnailPosition?: string; // e.g. '50% 50%', 'center top', or 'x% y%'
  backdropUrl?: string;
  videoUrl?: string;
  videoSourceType?: 'youtube' | 'uploaded' | 'direct_url';
  videoFileName?: string;
  videoDuration?: string;
  about: string;
  contribution: string;
  broadcastNetwork?: string;
  productionDetails?: {
    format?: string;
    cameras?: string;
    targetAudience?: string;
    deliverables?: string[];
  };
  stills?: string[];
  externalUrl?: string;
  isDigital?: boolean;
  isPersonal?: boolean;
}

export interface AboutData {
  greeting: string;
  paragraphs: string[];
  location: string;
  photoUrl: string;
}

export interface CustomLinkItem {
  id: string;
  label: string;
  url: string;
}

export interface ContactLinksData {
  email: string;
  linkedinUrl: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  vimeoUrl?: string;
  locationText?: string;
  customLinks?: CustomLinkItem[];
}

export type ViewMode = 'home' | 'case-study';
