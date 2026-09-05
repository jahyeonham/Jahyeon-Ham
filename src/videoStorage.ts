/**
 * IndexedDB Video Storage
 * Allows storing large user-uploaded video files (MP4, WebM, MOV) locally in the browser
 * without hitting the 5MB localStorage limit.
 */

const DB_NAME = 'PortfolioVideoStorage';
const STORE_NAME = 'videos';
const DB_VERSION = 1;

// In-memory cache of created object URLs to prevent duplicate memory allocations
const objectUrlCache = new Map<string, string>();

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Save a video file/blob into IndexedDB for a specific project
 * Returns a live Blob Object URL for immediate playback.
 */
export async function saveVideoFileToStorage(projectId: string, fileOrBlob: Blob): Promise<string> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const key = `proj_video_${projectId}`;

    const putRequest = store.put(fileOrBlob, key);

    putRequest.onsuccess = () => {
      // Revoke old cache if exists
      if (objectUrlCache.has(key)) {
        URL.revokeObjectURL(objectUrlCache.get(key)!);
      }
      const newUrl = URL.createObjectURL(fileOrBlob);
      objectUrlCache.set(key, newUrl);
      resolve(newUrl);
    };

    putRequest.onerror = () => {
      reject(putRequest.error);
    };
  });
}

/**
 * Get the live video URL from IndexedDB for a given project ID
 */
export async function getVideoUrlFromStorage(projectId: string): Promise<string | null> {
  const key = `proj_video_${projectId}`;

  // Return cached Object URL if already active in this session
  if (objectUrlCache.has(key)) {
    return objectUrlCache.get(key)!;
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get(key);

      getRequest.onsuccess = () => {
        const blob = getRequest.result as Blob | undefined;
        if (blob) {
          const url = URL.createObjectURL(blob);
          objectUrlCache.set(key, url);
          resolve(url);
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Delete a video from IndexedDB
 */
export async function deleteVideoFromStorage(projectId: string): Promise<void> {
  const key = `proj_video_${projectId}`;
  if (objectUrlCache.has(key)) {
    URL.revokeObjectURL(objectUrlCache.get(key)!);
    objectUrlCache.delete(key);
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const delRequest = store.delete(key);

      delRequest.onsuccess = () => resolve();
      delRequest.onerror = () => reject(delRequest.error);
    });
  } catch {
    // ignore
  }
}

/**
 * Instantly captures the currently displayed frame from an active HTMLVideoElement
 * without re-loading or re-seeking the video.
 */
export function captureFromVideoElement(videoEl: HTMLVideoElement, quality: number = 0.88): string {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth || 1280;
  canvas.height = videoEl.videoHeight || 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Captures a representative still frame from a video file or video URL
 * Returns a high quality JPEG data URL for use as a thumbnail.
 */
export function captureVideoStill(source: Blob | string, atTimeSeconds: number = 0.5): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    let objectUrlToRevoke: string | null = null;

    if (typeof source === 'string') {
      video.src = source;
    } else {
      objectUrlToRevoke = URL.createObjectURL(source);
      video.src = objectUrlToRevoke;
    }

    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };

    video.onloadedmetadata = () => {
      // Seek to desired time (bound by video duration)
      const targetTime = Math.min(atTimeSeconds, Math.max(0, video.duration - 0.1));
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        cleanup();
        resolve(dataUrl);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = (err) => {
      cleanup();
      reject(err);
    };

    // Timeout safety
    setTimeout(() => {
      cleanup();
      reject(new Error('Video frame capture timed out'));
    }, 6000);
  });
}
