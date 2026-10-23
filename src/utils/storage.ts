// Helper to detect DOM nodes, Elements, Fiber nodes, Window, and non-plain data objects
function isDomOrNonSerializable(val: any): boolean {
  if (!val || typeof val !== 'object') return false;

  // 1. Check constructor name
  const name = val?.constructor?.name;
  if (
    name && 
    (name.includes('Element') || 
     name.includes('Node') || 
     name.includes('Fiber') || 
     name.includes('Window') || 
     name.includes('Document') || 
     name.includes('Event') ||
     name === 'HTMLVideoElement' ||
     name === 'HTMLMediaElement' ||
     name === 'HTMLElement')
  ) {
    return true;
  }

  // 2. Check standard DOM properties
  if (
    typeof val.nodeType === 'number' || 
    typeof val.tagName === 'string' ||
    'ownerDocument' in val ||
    ('play' in val && typeof val.play === 'function' && 'pause' in val)
  ) {
    return true;
  }

  // 3. Check React internal keys (Fiber / Props / Events)
  try {
    for (const key of Object.getOwnPropertyNames(val)) {
      if (key.startsWith('__reactFiber') || key.startsWith('__reactProps') || key.startsWith('__reactEvents')) {
        return true;
      }
    }
  } catch {}

  // 4. Check prototype: For data objects in JSON, prototype must be Object.prototype or null (or Array)
  if (!Array.isArray(val)) {
    try {
      const proto = Object.getPrototypeOf(val);
      if (proto !== null && proto !== Object.prototype) {
        return true;
      }
    } catch {}
  }

  return false;
}

// Deeply sanitize an object to strip non-serializable properties and break cycles
export function deepSanitizeData(data: any, seen = new WeakSet()): any {
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (isDomOrNonSerializable(data) || seen.has(data)) {
    return undefined;
  }
  seen.add(data);

  if (Array.isArray(data)) {
    return data
      .map(item => deepSanitizeData(item, seen))
      .filter(item => item !== undefined);
  }

  const result: Record<string, any> = {};
  try {
    for (const [k, v] of Object.entries(data)) {
      if (k.startsWith('__reactFiber') || k.startsWith('__reactProps') || k.startsWith('__reactEvents')) continue;
      const sanitizedVal = deepSanitizeData(v, seen);
      if (sanitizedVal !== undefined) {
        result[k] = sanitizedVal;
      }
    }
  } catch {
    return {};
  }
  return result;
}

// Safe JSON stringify helper that handles circular structures, DOM elements, React nodes & functions safely
export function safeStringify(obj: any, replacer?: (key: string, value: any) => any): string {
  try {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (isDomOrNonSerializable(value) || seen.has(value)) {
          return undefined;
        }
        seen.add(value);
      }
      if (replacer) {
        return replacer(key, value);
      }
      return value;
    });
  } catch (err) {
    try {
      const sanitized = deepSanitizeData(obj);
      return JSON.stringify(sanitized, replacer);
    } catch {
      return '{}';
    }
  }
}

// Safe LocalStorage setter that handles QuotaExceededError and circular references gracefully
export function safeSetLocalStorage(key: string, value: any): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const serialized = typeof value === 'string' ? value : safeStringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (_err) {
    try {
      // Clear non-critical caches first to free up space
      try {
        localStorage.removeItem('diy_messages_cache');
        localStorage.removeItem('diy_reviews_cache');
        localStorage.removeItem('diy_offers_cache');
      } catch {}

      if (typeof value === 'object' && value !== null) {
        // Strip out huge data URLs / base64 images from the local cache copy
        const maxLen = key === 'diy_site_settings' ? 500000 : 50000;
        const strippedStr = safeStringify(value, (_k, v) => {
          if (typeof v === 'string' && (v.startsWith('data:image/') || v.startsWith('data:video/') || v.startsWith('blob:')) && v.length > maxLen) {
            return '';
          }
          return v;
        });
        localStorage.setItem(key, strippedStr);
        return true;
      }
    } catch (_innerErr) {
      // Gracefully handle storage quota limit - data is safe in Supabase/Firebase
    }
    return false;
  }
}

export function safeGetLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
