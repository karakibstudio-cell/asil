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
    newIcon.type = iconUrl.endsWith('.svg') 
      ? 'image/svg+xml' 
      : iconUrl.endsWith('.png') 
        ? 'image/png' 
        : 'image/x-icon';
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
