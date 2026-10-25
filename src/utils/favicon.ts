/**
 * Dynamic Browser Favicon & Title Updater
 * يقوم بتحديث أيقونة علامة التبويب (Favicon) وعنوان الصفحة فورياً وسلساً دون وميض
 */

export function resolveFaviconUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return '/favicon-48x48.png';
  }

  const trimmed = rawUrl.trim();
  // If points to large Supabase raw upload or default paths, resolve to static ultra-fast 48x48 favicon
  if (
    trimmed.includes('prestige-media/brand/favicon_') ||
    trimmed.includes('prestige-media/brand/logo_') ||
    trimmed === '/favicon.svg' ||
    trimmed === '/favicon.ico' ||
    trimmed.includes('brand-user-logo')
  ) {
    return '/favicon-48x48.png';
  }

  return trimmed;
}

export function updateFavicon(iconUrl?: string | null): void {
  try {
    const finalUrl = resolveFaviconUrl(iconUrl);
    if (!finalUrl || typeof document === 'undefined') return;

    const head = document.getElementsByTagName('head')[0] || document.documentElement;

    // Detect MIME type
    const lower = finalUrl.toLowerCase();
    let mimeType = 'image/png';
    if (lower.startsWith('data:image/svg+xml') || lower.includes('.svg')) {
      mimeType = 'image/svg+xml';
    } else if (lower.startsWith('data:image/webp') || lower.includes('.webp')) {
      mimeType = 'image/webp';
    } else if (lower.endsWith('.ico') || lower.includes('.ico')) {
      mimeType = 'image/x-icon';
    } else if (lower.includes('.jpg') || lower.includes('.jpeg')) {
      mimeType = 'image/jpeg';
    }

    // Update or create standard <link rel="icon">
    let linkIcon = document.querySelector<HTMLLinkElement>("link[rel='icon']:not([sizes])") ||
      document.querySelector<HTMLLinkElement>("link[rel='icon'][sizes='48x48']");

    if (linkIcon) {
      if (linkIcon.href.endsWith(finalUrl) || linkIcon.href === finalUrl) {
        // Already matching, no DOM mutation needed
        return;
      }
      linkIcon.type = mimeType;
      linkIcon.href = finalUrl;
    } else {
      const newIcon = document.createElement('link');
      newIcon.rel = 'icon';
      newIcon.type = mimeType;
      newIcon.href = finalUrl;
      head.appendChild(newIcon);
    }

    // Update or create <link rel="shortcut icon">
    let linkShortcut = document.querySelector<HTMLLinkElement>("link[rel='shortcut icon']");
    if (linkShortcut) {
      linkShortcut.href = finalUrl;
    } else {
      const sc = document.createElement('link');
      sc.rel = 'shortcut icon';
      sc.href = finalUrl;
      head.appendChild(sc);
    }

    // Update Apple Touch Icon
    let linkApple = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    const appleUrl = finalUrl.endsWith('.ico') ? '/apple-touch-icon.png' : finalUrl;
    if (linkApple) {
      linkApple.href = appleUrl;
    } else {
      const apple = document.createElement('link');
      apple.rel = 'apple-touch-icon';
      apple.href = appleUrl;
      head.appendChild(apple);
    }
  } catch (err) {
    console.warn('Failed to dynamically update browser favicon:', err);
  }
}
