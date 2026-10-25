// Smart Canvas Image Loader with CORS Bypass and Fallback Proxies
// Resolves "Access-Control-Allow-Origin: null" and missing CORS headers
// when pasting image URLs from Bangladesh and international news sites.

export interface SafeImageResult {
  image: HTMLImageElement | null;
  status: 'clean' | 'proxied' | 'preview_only' | 'error';
  sourceUrl: string;
  blobUrl?: string;
  errorMessage?: string;
}

/**
 * Helper to load an Image element with a specific crossOrigin mode and timeout.
 */
function tryLoadImage(src: string, useCrossOrigin: boolean, timeoutMs = 5000): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let isSettled = false;

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        img.src = '';
        reject(new Error(`Timeout loading image (${timeoutMs}ms)`));
      }
    }, timeoutMs);

    img.onload = () => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        resolve(img);
      }
    };

    img.onerror = (err) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        reject(err || new Error(`Image error loading from ${src}`));
      }
    };

    if (useCrossOrigin) {
      img.crossOrigin = 'anonymous';
    }
    img.src = src;
  });
}

/**
 * Safely loads an image URL for Canvas 2D export without CORS blocking or canvas tainting.
 * Order of attempts:
 * 1. Data URLs, Blob URLs, or local relative paths (same origin)
 * 2. Direct load with crossOrigin = 'anonymous' (works if server sends valid CORS)
 * 3. Specialized image proxy CDN (images.weserv.nl)
 * 4. Open-source CORS proxy (api.allorigins.win)
 * 5. Generic CORS proxy (corsproxy.io)
 * 6. Non-CORS visual preview fallback (allows on-screen viewing)
 */
export async function loadSafeCanvasImage(rawUrl: string): Promise<SafeImageResult> {
  const url = (rawUrl || '').trim();
  if (!url) {
    return { image: null, status: 'error', sourceUrl: '', errorMessage: 'Empty URL' };
  }

  // 1. Fast path for local / data / blob URLs
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) {
    try {
      const img = await tryLoadImage(url, true, 8000);
      return { image: img, status: 'clean', sourceUrl: url };
    } catch (err: any) {
      return { image: null, status: 'error', sourceUrl: url, errorMessage: err?.message };
    }
  }

  // 2. Direct load with crossOrigin = 'anonymous'
  try {
    const img = await tryLoadImage(url, true, 4000);
    return { image: img, status: 'clean', sourceUrl: url };
  } catch {
    console.info(`[ImageLoader] Direct CORS failed for ${url}. Trying CORS bypass proxies...`);
  }

  // 3. Fallback Proxy 1: images.weserv.nl (Specialized global image CDN)
  try {
    const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}&default=${encodeURIComponent(url)}`;
    const img = await tryLoadImage(proxyUrl, true, 5000);
    console.info('[ImageLoader] Image successfully loaded via weserv.nl proxy.');
    return { image: img, status: 'proxied', sourceUrl: proxyUrl };
  } catch {
    console.info('[ImageLoader] weserv.nl failed. Trying allorigins...');
  }

  // 4. Fallback Proxy 2: api.allorigins.win
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const img = await tryLoadImage(proxyUrl, true, 5000);
    console.info('[ImageLoader] Image successfully loaded via allorigins proxy.');
    return { image: img, status: 'proxied', sourceUrl: proxyUrl };
  } catch {
    console.info('[ImageLoader] allorigins failed. Trying corsproxy.io...');
  }

  // 5. Fallback Proxy 3: corsproxy.io
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const img = await tryLoadImage(proxyUrl, true, 5000);
    console.info('[ImageLoader] Image successfully loaded via corsproxy.io.');
    return { image: img, status: 'proxied', sourceUrl: proxyUrl };
  } catch {
    console.warn('[ImageLoader] All CORS proxies exhausted. Loading in non-CORS visual preview mode...');
  }

  // 6. Visual Preview Fallback: Load WITHOUT crossOrigin
  // Displays the image on canvas for layout inspection even if the origin blocks exports
  try {
    const img = await tryLoadImage(url, false, 5000);
    return {
      image: img,
      status: 'preview_only',
      sourceUrl: url,
      errorMessage: 'Source server blocked CORS. Image loaded in visual preview mode; right-click "Copy Image" and press Ctrl+V to enable export.',
    };
  } catch (err: any) {
    return {
      image: null,
      status: 'error',
      sourceUrl: url,
      errorMessage: err?.message || 'Could not load image from any source',
    };
  }
}
