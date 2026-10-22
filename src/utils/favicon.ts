/**
 * Dynamic Browser Favicon & Title Updater
 * يقوم بتحديث أيقونة علامة التبويب (Favicon) وعنوان الصفحة فورياً من الشعار وإعدادات الهوية
 */

export function updateFavicon(iconUrl?: string | null): void {
  if (!iconUrl) return;

  try {
    const head = document.getElementsByTagName('head')[0] || document.documentElement;

    // 1. Remove existing favicon links to force browser reload
    const existingIcons = document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon']");
    existingIcons.forEach(el => el.remove());

    // 2. Create standard icon link
    const newIcon = document.createElement('link');
    newIcon.rel = 'icon';
    const lower = iconUrl.toLowerCase();
    if (lower.startsWith('data:image/svg+xml') || lower.includes('.svg')) {
      newIcon.type = 'image/svg+xml';
    } else if (lower.startsWith('data:image/webp') || lower.includes('.webp')) {
      newIcon.type = 'image/webp';
    } else if (lower.startsWith('data:image/png') || lower.includes('.png')) {
      newIcon.type = 'image/png';
    } else if (lower.startsWith('data:image/jpeg') || lower.startsWith('data:image/jpg') || lower.includes('.jpg') || lower.includes('.jpeg')) {
      newIcon.type = 'image/jpeg';
    } else {
      newIcon.type = 'image/x-icon';
    }
    newIcon.href = iconUrl;
    head.appendChild(newIcon);

    // 3. Create shortcut icon link
    const shortcutIcon = document.createElement('link');
    shortcutIcon.rel = 'shortcut icon';
    shortcutIcon.href = iconUrl;
    head.appendChild(shortcutIcon);

    // 4. Create apple touch icon
    const appleIcon = document.createElement('link');
    appleIcon.rel = 'apple-touch-icon';
    appleIcon.href = iconUrl;
    head.appendChild(appleIcon);
  } catch (err) {
    console.warn('Failed to dynamically update browser favicon:', err);
  }
}
