const CACHE_NAME = 'numbers-app-v1';
const AUDIO_CACHE_NAME = 'numbers-audio-v1';
const MAX_AUDIO_FILES = 1000;

// Files to cache immediately
const STATIC_FILES = [
  '/numbers/',
  '/numbers/index.html',
  '/numbers/styles.css',
  '/numbers/app.js'
];

// Install event - cache static files and start caching audio files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Starting audio file caching...');
        return cacheAudioFiles();
      })
      .catch((error) => {
        console.error('Error during service worker install:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== AUDIO_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache when available
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle audio files
  if (url.pathname.startsWith('/numbers/audio/') && url.pathname.endsWith('.mp3')) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME)
        .then((cache) => {
          return cache.match(event.request)
            .then((response) => {
              if (response) {
                console.log('Serving audio from cache:', url.pathname);
                return response;
              }
              
              // If not in cache, try to fetch and cache it
              return fetch(event.request)
                .then((fetchResponse) => {
                  if (fetchResponse.ok) {
                    cache.put(event.request, fetchResponse.clone());
                    console.log('Cached new audio file:', url.pathname);
                  }
                  return fetchResponse;
                })
                .catch(() => {
                  console.log('Failed to fetch audio file:', url.pathname);
                  return new Response('Audio not available', { status: 404 });
                });
            });
        })
    );
    return;
  }
  
  // Handle other files
  if (url.pathname.startsWith('/numbers/')) {
    event.respondWith(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.match(event.request)
            .then((response) => {
              if (response) {
                return response;
              }
              return fetch(event.request);
            });
        })
    );
    return;
  }
});

// Function to cache audio files in batches
async function cacheAudioFiles() {
  const audioCache = await caches.open(AUDIO_CACHE_NAME);
  const batchSize = 50; // Cache 50 files at a time to avoid overwhelming the browser
  
  for (let i = 0; i < MAX_AUDIO_FILES; i += batchSize) {
    const batch = [];
    
    for (let j = 0; j < batchSize && (i + j) < MAX_AUDIO_FILES; j++) {
      const number = i + j;
      const audioUrl = `/numbers/audio/${number}.mp3`;
      batch.push(
        fetch(audioUrl)
          .then((response) => {
            if (response.ok) {
              return audioCache.put(audioUrl, response);
            }
            return Promise.resolve();
          })
          .catch((error) => {
            console.log(`Failed to cache audio file ${number}.mp3:`, error);
            return Promise.resolve();
          })
      );
    }
    
    // Wait for current batch to complete before starting next batch
    await Promise.all(batch);
    console.log(`Cached audio files ${i} to ${Math.min(i + batchSize - 1, MAX_AUDIO_FILES - 1)}`);
    
    // Small delay between batches to avoid overwhelming the browser
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('Audio caching completed');
}

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    event.ports[0].postMessage({
      type: 'CACHE_STATUS',
      cacheName: AUDIO_CACHE_NAME
    });
  }
});