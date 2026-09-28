import { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
}

const DEFAULT_TITLE = 'برستيج لإدارة وتشغيل الفنادق | Prestige Hotels Management';
const DEFAULT_DESCRIPTION = 'شركة برستيج الرائدة في إدارة وتشغيل الفنادق وتقديم خدمات التسكين والضيافة الراقية بمكة المكرمة والمدينة المنورة.';
const DEFAULT_KEYWORDS = 'برستيج لإدارة الفنادق, تشغيل فنادق مكة, فنادق المدينة المنورة, Prestige Hotels, تسكين معتمرين, عروض العمرة, فنادق قريبة من الحرم';

function setOrCreateMeta(attrName: 'name' | 'property', attrValue: string, content: string | undefined) {
  if (!content) return;
  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export function updateMetaTags(props: SEOProps) {
  const fullTitle = props.title 
    ? (props.title.includes('برستيج') ? props.title : `${props.title} | برستيج لإدارة وتشغيل الفنادق`)
    : DEFAULT_TITLE;
  const description = props.description || DEFAULT_DESCRIPTION;
  const keywords = props.keywords || DEFAULT_KEYWORDS;
  const image = props.image;
  const type = props.type || 'website';

  // Update document title
  document.title = fullTitle;

  // Standard SEO tags
  setOrCreateMeta('name', 'description', description);
  setOrCreateMeta('name', 'keywords', keywords);

  // Open Graph tags
  setOrCreateMeta('property', 'og:title', fullTitle);
  setOrCreateMeta('property', 'og:description', description);
  setOrCreateMeta('property', 'og:type', type);
  if (image) {
    setOrCreateMeta('property', 'og:image', image);
  }
  if (props.url) {
    setOrCreateMeta('property', 'og:url', props.url);
  }

  // Twitter tags
  setOrCreateMeta('name', 'twitter:title', fullTitle);
  setOrCreateMeta('name', 'twitter:description', description);
  if (image) {
    setOrCreateMeta('name', 'twitter:image', image);
  }
}

export function resetMetaTagsToDefault() {
  document.title = DEFAULT_TITLE;
  setOrCreateMeta('name', 'description', DEFAULT_DESCRIPTION);
  setOrCreateMeta('name', 'keywords', DEFAULT_KEYWORDS);
  setOrCreateMeta('property', 'og:title', DEFAULT_TITLE);
  setOrCreateMeta('property', 'og:description', DEFAULT_DESCRIPTION);
  setOrCreateMeta('name', 'twitter:title', DEFAULT_TITLE);
  setOrCreateMeta('name', 'twitter:description', DEFAULT_DESCRIPTION);
}

/**
 * React hook to dynamically update document title and meta tags for SEO.
 * Automatically restores default tags on unmount.
 */
export function useSEO(props: SEOProps) {
  useEffect(() => {
    updateMetaTags(props);

    return () => {
      resetMetaTagsToDefault();
    };
  }, [props.title, props.description, props.keywords, props.image, props.url, props.type]);
}
