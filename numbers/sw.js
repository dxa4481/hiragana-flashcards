const CACHE_NAME = 'numbers-app-v2';
const AUDIO_CACHE_NAME = 'numbers-audio-v2';
const MAX_AUDIO_FILES = 1000;

// Files to cache immediately
const STATIC_FILES = [
  '/numbers/',
  '/numbers/index.html',
  '/numbers/styles.css',
  '/numbers/app.js'
];

// Install event - cache static files only
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Static files cached successfully');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Error during service worker install:', error);
      })
  );
});

// Activate event - clean up old caches and start audio caching
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== AUDIO_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activated, starting audio caching...');
      // Start audio caching after activation
      return cacheAudioFiles();
    }).catch((error) => {
      console.error('Error during service worker activation:', error);
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
                // Clone the response to ensure it can be consumed multiple times
                const clonedResponse = response.clone();
                // Add headers for better mobile compatibility
                const headers = new Headers(clonedResponse.headers);
                headers.set('Accept-Ranges', 'bytes');
                headers.set('Content-Type', 'audio/mpeg');
                headers.set('Cache-Control', 'public, max-age=86400');
                
                return new Response(clonedResponse.body, {
                  status: clonedResponse.status,
                  statusText: clonedResponse.statusText,
                  headers: headers
                });
              }
              
              // If not in cache, try to fetch and cache it
              return fetch(event.request)
                .then((fetchResponse) => {
                  // Only cache if response is ok and not a partial response (206)
                  if (fetchResponse.ok && fetchResponse.status !== 206) {
                    // Clone for caching
                    const responseToCache = fetchResponse.clone();
                    cache.put(event.request, responseToCache);
                    console.log('Cached new audio file:', url.pathname);
                    
                    // Add headers for better mobile compatibility
                    const headers = new Headers(fetchResponse.headers);
                    headers.set('Accept-Ranges', 'bytes');
                    headers.set('Content-Type', 'audio/mpeg');
                    headers.set('Cache-Control', 'public, max-age=86400');
                    
                    return new Response(fetchResponse.body, {
                      status: fetchResponse.status,
                      statusText: fetchResponse.statusText,
                      headers: headers
                    });
                  } else if (fetchResponse.status === 206) {
                    console.log('Skipping cache for partial response:', url.pathname);
                    return fetchResponse;
                  } else {
                    console.log('Audio fetch failed with status:', fetchResponse.status);
                    return fetchResponse;
                  }
                })
                .catch((error) => {
                  console.log('Failed to fetch audio file:', url.pathname, error);
                  // Return a proper error response instead of text
                  return new Response(null, { 
                    status: 404, 
                    statusText: 'Audio not available offline',
                    headers: { 'Content-Type': 'audio/mpeg' }
                  });
                });
            });
        })
        .catch((error) => {
          console.error('Error in fetch handler for audio:', error);
          return fetch(event.request).catch(() => {
            return new Response(null, { 
              status: 404, 
              statusText: 'Audio not available',
              headers: { 'Content-Type': 'audio/mpeg' }
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
        .catch((error) => {
          console.error('Error in fetch handler for static files:', error);
          return fetch(event.request);
        })
    );
    return;
  }
});

// Function to cache audio files in batches
async function cacheAudioFiles() {
  try {
    console.log('Starting audio caching process...');
    const audioCache = await caches.open(AUDIO_CACHE_NAME);
    const batchSize = 25; // Reduced batch size for better reliability
    let totalCached = 0;
    
    for (let i = 0; i < MAX_AUDIO_FILES; i += batchSize) {
      const batch = [];
      
      for (let j = 0; j < batchSize && (i + j) < MAX_AUDIO_FILES; j++) {
        const number = i + j;
        const audioUrl = `/numbers/audio/${number}.mp3`;
        
        batch.push(
          fetch(audioUrl)
            .then((response) => {
              // Only cache if response is ok and not a partial response (206)
              if (response.ok && response.status !== 206) {
                return audioCache.put(audioUrl, response.clone())
                  .then(() => {
                    totalCached++;
                    return true;
                  });
              } else if (response.status === 206) {
                console.log(`Skipping cache for partial response: ${number}.mp3`);
                return false;
              } else {
                console.log(`Audio file ${number}.mp3 returned status:`, response.status);
                return false;
              }
            })
            .catch((error) => {
              console.log(`Failed to cache audio file ${number}.mp3:`, error.message);
              return false;
            })
        );
      }
      
      // Wait for current batch to complete
      const results = await Promise.all(batch);
      const batchCached = results.filter(Boolean).length;
      
      console.log(`Batch ${Math.floor(i/batchSize) + 1}: Cached ${batchCached}/${batchSize} files (${i} to ${Math.min(i + batchSize - 1, MAX_AUDIO_FILES - 1)})`);
      console.log(`Total cached so far: ${totalCached} files`);
      
      // Longer delay between batches to be more conservative
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`Audio caching completed! Total files cached: ${totalCached}`);
    
    // Notify clients about completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'AUDIO_CACHE_COMPLETE',
        totalCached: totalCached
      });
    });
    
  } catch (error) {
    console.error('Error in cacheAudioFiles:', error);
  }
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
  
  if (event.data && event.data.type === 'START_AUDIO_CACHE') {
    cacheAudioFiles();
  }
});