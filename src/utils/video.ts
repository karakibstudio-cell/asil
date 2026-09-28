// Video URL parser and embed helper

export interface VideoInfo {
  isEmbed: boolean;
  embedType?: 'youtube' | 'vimeo' | 'direct';
  embedUrl?: string;
  directUrl?: string;
  isValidVideo: boolean;
}

export function parseVideoUrl(url?: string | null): VideoInfo {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { isEmbed: false, isValidVideo: false };
  }

  const trimmed = url.trim();

  // Check if it's an image URL mistakenly passed as video
  const lower = trimmed.toLowerCase();
  if (
    lower.endsWith('.jpg') || 
    lower.endsWith('.jpeg') || 
    lower.endsWith('.png') || 
    lower.endsWith('.webp') || 
    lower.endsWith('.gif') ||
    lower.includes('images.unsplash.com')
  ) {
    return { isEmbed: false, isValidVideo: false };
  }

  // 1. YouTube detection
  // Format: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
  const ytMatch = trimmed.match(youtubeRegex);
  if (ytMatch && ytMatch[1]) {
    return {
      isEmbed: true,
      embedType: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`,
      isValidVideo: true
    };
  }

  // 2. Vimeo detection
  // Format: vimeo.com/ID
  const vimeoRegex = /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|))(\d+)/;
  const vimeoMatch = trimmed.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[3]) {
    return {
      isEmbed: true,
      embedType: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1&title=0&byline=0&portrait=0`,
      isValidVideo: true
    };
  }

  // 3. Direct video file (mp4, webm, ogg, mov, data:video, blob:, etc.)
  if (
    lower.startsWith('data:video') ||
    lower.startsWith('blob:') ||
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.ogg') ||
    lower.endsWith('.mov') ||
    lower.includes('gtv-videos-bucket') ||
    lower.includes('video') ||
    trimmed.startsWith('http')
  ) {
    return {
      isEmbed: false,
      embedType: 'direct',
      directUrl: trimmed,
      isValidVideo: true
    };
  }

  return {
    isEmbed: false,
    embedType: 'direct',
    directUrl: trimmed,
    isValidVideo: true
  };
}
