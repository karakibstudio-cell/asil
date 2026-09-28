/**
 * Global protection against circular structure serialization errors in browser/iframe runtimes.
 * Prevents "TypeError: Converting circular structure to JSON" when DOM elements, FiberNodes, or
 * circular references are passed to JSON.stringify or console bridges.
 */

const nativeStringify = JSON.stringify;

function createCircularSafeReplacer(customReplacer?: ((key: string, value: any) => any) | null) {
  const seen = new WeakSet();
  return function (key: string, value: any) {
    if (typeof value === 'object' && value !== null) {
      if (
        (typeof Node !== 'undefined' && value instanceof Node) ||
        (typeof Element !== 'undefined' && value instanceof Element) ||
        typeof value.nodeType === 'number' ||
        typeof value.tagName === 'string' ||
        value?.constructor?.name?.includes('Element') ||
        value?.constructor?.name?.includes('Fiber') ||
        value?.constructor?.name?.includes('Node') ||
        key.startsWith('__reactFiber') ||
        key.startsWith('__reactProps') ||
        key.startsWith('__reactEvents') ||
        seen.has(value)
      ) {
        return undefined;
      }
      seen.add(value);
    }
    if (typeof customReplacer === 'function') {
      return customReplacer(key, value);
    }
    return value;
  };
}

JSON.stringify = function (value: any, replacer?: any, space?: any): string {
  try {
    return nativeStringify(value, replacer, space);
  } catch (err: any) {
    if (
      err instanceof TypeError &&
      (err.message.includes('circular') || err.message.includes('Converting circular structure'))
    ) {
      try {
        const safeReplacer = createCircularSafeReplacer(typeof replacer === 'function' ? replacer : null);
        return nativeStringify(value, safeReplacer, space);
      } catch {
        return '{}';
      }
    }
    throw err;
  }
};

export {};
