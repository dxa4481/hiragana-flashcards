const CACHE_NAME = 'common-phrases-v1';
const STATIC_CACHE_NAME = 'common-phrases-static-v1';

// Static assets to cache
const STATIC_ASSETS = [
  './',
  './index.html',
  './App.jsx',
  './style.css'
];

// Skip waiting and activate immediately for mobile compatibility
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker for common-phrases');
  
  // Cache static assets
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => {
        console.log('[SW] Static assets cached');
        self.skipWaiting(); // Activate immediately
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker for common-phrases');
  
  event.waitUntil(
    Promise.all([
      // Take control of all clients immediately
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ]).then(() => {
      console.log('[SW] Service worker activated and controlling clients');
    })
  );
});

// Message handler for starting audio caching
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);
  
  if (event.data && event.data.type === 'START_AUDIO_CACHE') {
    console.log('[SW] Starting audio caching process');
    cacheAudioFiles();
  }
});

// Audio caching function
async function cacheAudioFiles() {
  try {
    const response = await fetch('./data.json');
    const data = await response.json();
    
    // Limit to first 1000 entries
    const limitedData = data.slice(0, 1000);
    console.log(`[SW] Caching ${limitedData.length} audio files`);
    
    const cache = await caches.open(CACHE_NAME);
    const batchSize = 10;
    let cached = 0;
    
    for (let i = 0; i < limitedData.length; i += batchSize) {
      const batch = limitedData.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (item) => {
          try {
            await cache.add(`./audio/${item.id}.mp3`);
            cached++;
            
            // Send progress update
            const progress = Math.round((cached / limitedData.length) * 100);
            sendProgressUpdate(progress, cached, limitedData.length);
            
          } catch (error) {
            console.warn(`[SW] Failed to cache audio for ${item.id}:`, error);
          }
        })
      );
      
      // Small delay between batches to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`[SW] Audio caching completed. Cached ${cached}/${limitedData.length} files`);
    sendCacheComplete(cached, limitedData.length);
    
  } catch (error) {
    console.error('[SW] Audio caching failed:', error);
    sendCacheError(error.message);
  }
}

// Send progress update to all clients
function sendProgressUpdate(percent, cached, total) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'AUDIO_CACHE_PROGRESS',
        percent: percent,
        cached: cached,
        total: total
      });
    });
  });
}

// Send cache completion message
function sendCacheComplete(cached, total) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'AUDIO_CACHE_COMPLETE',
        cached: cached,
        total: total
      });
    });
  });
}

// Send cache error message
function sendCacheError(error) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'AUDIO_CACHE_ERROR',
        error: error
      });
    });
  });
}

// Fetch handler for serving cached content
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
      .catch(() => {
        // Fallback for failed requests
        console.log('[SW] Fetch failed for:', event.request.url);
        return new Response('Network error', { status: 503 });
      })
  );
});