/**
 * Brand Logo & Identity Asset Resolver
 * يضمن عرض الشعار فورياً (0ms) بالاعتماد على النسخ المحسنة محلياً حتى في حال وجود رابط سحابي غير مضغوط
 */

export function getBrandLogoUrl(rawUrl?: string | null, variant: 'header' | 'default' = 'default'): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return variant === 'header' ? '/images/brand/logo-header.webp' : '/images/brand/logo.webp';
  }

  const trimmed = rawUrl.trim();

  // If URL points to large uncompressed Supabase upload (e.g. 1.75MB) or local default paths:
  // Map immediately to the preloaded, optimized ~5KB/34KB WebP asset for 0ms paint
  if (
    trimmed.includes('prestige-media/brand/logo_') ||
    trimmed.includes('prestige-media/brand/favicon_') ||
    trimmed.includes('brand-user-logo') ||
    trimmed === '/images/brand/logo.png' ||
    trimmed === '/images/brand/logo.webp' ||
    trimmed === '/images/brand/about_logo.png' ||
    trimmed === '/images/brand/about_logo.webp'
  ) {
    return variant === 'header' ? '/images/brand/logo-header.webp' : '/images/brand/logo.webp';
  }

  return trimmed;
}
