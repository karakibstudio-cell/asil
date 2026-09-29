// Video URL parser and embed helper

export interface VideoInfo {
  isEmbed: boolean;
  embedType?: 'youtube' | 'vimeo' | 'direct';
  embedUrl?: string;
  directUrl?: string;
  isValidVideo: boolean;
  isBlob?: boolean;
}

export function parseVideoUrl(rawUrl?: any, isBackground: boolean = false): VideoInfo {
  const url = typeof rawUrl === 'string'
    ? rawUrl
    : (rawUrl && typeof rawUrl === 'object'
        ? (rawUrl.url || rawUrl.videoUrl || rawUrl.src || '')
        : '');

  if (!url || typeof url !== 'string' || !url.trim()) {
    return { isEmbed: false, isValidVideo: false };
  }

  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();

  // Check if it's an image URL mistakenly passed as video
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

  // Detect blob URLs (temporary, non-persistent)
  const isBlob = lower.startsWith('blob:');

  // 1. YouTube detection
  // Format: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
  const ytMatch = trimmed.match(youtubeRegex);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    const embedUrl = isBackground
      ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&modestbranding=1&rel=0&enablejsapi=1`
      : `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

    return {
      isEmbed: true,
      embedType: 'youtube',
      embedUrl,
      isValidVideo: true,
      isBlob: false
    };
  }

  // 2. Vimeo detection
  // Format: vimeo.com/ID
  const vimeoRegex = /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|))(\d+)/;
  const vimeoMatch = trimmed.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[3]) {
    const vimeoId = vimeoMatch[3];
    const embedUrl = isBackground
      ? `https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&autopause=0&background=1`
      : `https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0`;

    return {
      isEmbed: true,
      embedType: 'vimeo',
      embedUrl,
      isValidVideo: true,
      isBlob: false
    };
  }

  // 3. Direct video file (mp4, webm, ogg, mov, data:video, blob:, etc.)
  if (
    lower.startsWith('data:video') ||
    isBlob ||
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
      isValidVideo: true,
      isBlob
    };
  }

  return {
    isEmbed: false,
    embedType: 'direct',
    directUrl: trimmed,
    isValidVideo: true,
    isBlob
  };
}
