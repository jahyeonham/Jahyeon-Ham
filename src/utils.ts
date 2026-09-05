/**
 * YouTube and Media Helper Utilities
 */

/**
 * Extracts YouTube Video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 * - Plain VIDEO_ID (11 chars)
 * - <iframe> embed codes
 */
export function extractYouTubeId(urlOrId?: string): string | null {
  if (!urlOrId) return null;
  let trimmed = urlOrId.trim();
  if (!trimmed) return null;

  // Check if it's an iframe snippet e.g. <iframe src="https://www.youtube.com/embed/xyz"...>
  const iframeMatch = trimmed.match(/src=["'](.*?)["']/i);
  if (iframeMatch) {
    trimmed = iframeMatch[1];
  }

  // Plain 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Support all standard YouTube variations
  const patterns = [
    /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|\S*?[?&]v=)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /embed\/([a-zA-Z0-9_-]{11})/,
    /shorts\/([a-zA-Z0-9_-]{11})/,
    /live\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Returns a clean YouTube embed URL
 */
export function getYouTubeEmbedUrl(urlOrId?: string, autoplay: boolean = false): string | null {
  const videoId = extractYouTubeId(urlOrId);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&enablejsapi=1`;
}

/**
 * Returns available frame thumbnails from YouTube (maxresdefault, hqdefault, hq1, hq2, hq3)
 */
export function getYouTubeFrameThumbnails(videoId: string) {
  return [
    {
      id: 'maxres',
      label: '메인 대표 썸네일 (HQ)',
      timeLabel: '공식 고화질 메인',
      url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      fallback: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    },
    {
      id: 'hq1',
      label: '영상 도입부 프레임 (~25%)',
      timeLabel: '초반 하이라이트',
      url: `https://img.youtube.com/vi/${videoId}/hq1.jpg`,
      fallback: `https://img.youtube.com/vi/${videoId}/1.jpg`,
    },
    {
      id: 'hq2',
      label: '영상 중간부 프레임 (~50%)',
      timeLabel: '중반 핵심 장면',
      url: `https://img.youtube.com/vi/${videoId}/hq2.jpg`,
      fallback: `https://img.youtube.com/vi/${videoId}/2.jpg`,
    },
    {
      id: 'hq3',
      label: '영상 후반부 프레임 (~75%)',
      timeLabel: '후반 클라이맥스',
      url: `https://img.youtube.com/vi/${videoId}/hq3.jpg`,
      fallback: `https://img.youtube.com/vi/${videoId}/3.jpg`,
    },
  ];
}

/**
 * Returns YouTube maximum resolution thumbnail URL with fallback
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Checks if a URL or string is a direct video source (HTML5 video compatible)
 * e.g., mp4, webm, ogg, mov, blob URL, data:video, or indexeddb identifier
 */
export function isDirectVideoUrl(urlOrSource?: string): boolean {
  if (!urlOrSource) return false;
  const s = urlOrSource.trim().toLowerCase();
  if (
    s.startsWith('blob:') ||
    s.startsWith('data:video/') ||
    s.startsWith('indexeddb:') ||
    s.endsWith('.mp4') ||
    s.endsWith('.webm') ||
    s.endsWith('.mov') ||
    s.endsWith('.ogg') ||
    s.endsWith('.m4v') ||
    s.includes('.mp4?') ||
    s.includes('.webm?')
  ) {
    return true;
  }
  return false;
}
