const CACHE_NAME = 'vocab-words-app-v2';
const AUDIO_CACHE_NAME = 'vocab-words-audio-v2';
const MAX_AUDIO_FILES = 1000;

// Files to cache immediately
const STATIC_FILES = [
  '/vocab-words/',
  '/vocab-words/index.html',
  '/vocab-words/App.jsx',
  '/vocab-words/useFlashcards.js',
  '/vocab-words/FlashcardCard.jsx',
  '/vocab-words/Scoreboard.jsx',
  '/vocab-words/sm2.js',
  '/vocab-words/data/words.json'
];

// Install event - cache static files only
self.addEventListener('install', (event) => {
  console.log('Vocab Words Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching vocab words static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Vocab words static files cached successfully');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Error during vocab words service worker install:', error);
      })
  );
});

// Activate event - clean up old caches and start audio caching
self.addEventListener('activate', (event) => {
  console.log('Vocab Words Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== AUDIO_CACHE_NAME) {
              console.log('Deleting old vocab words cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('Vocab Words Service Worker activated, starting audio caching...');
      // Start audio caching after activation
      return cacheAudioFiles();
    }).catch((error) => {
      console.error('Error during vocab words service worker activation:', error);
    })
  );
});

// Fetch event - serve from cache when available
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle audio files
  if (url.pathname.startsWith('/vocab-words/public/audio/') && url.pathname.endsWith('.mp3')) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME)
        .then((cache) => {
          return cache.match(event.request)
            .then((response) => {
              if (response) {
                console.log('Serving vocab words audio from cache:', url.pathname);
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
                    console.log('Cached new vocab words audio file:', url.pathname);
                    
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
                  console.log('Failed to fetch vocab words audio file:', url.pathname, error);
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
          console.error('Error in fetch handler for vocab words audio:', error);
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
  if (url.pathname.startsWith('/vocab-words/')) {
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
          console.error('Error in fetch handler for vocab words static files:', error);
          return fetch(event.request);
        })
    );
    return;
  }
});

// Function to cache audio files in batches
async function cacheAudioFiles() {
  try {
    console.log('Starting vocab words audio caching process...');
    const audioCache = await caches.open(AUDIO_CACHE_NAME);
    const batchSize = 25; // Reduced batch size for better reliability
    let totalCached = 0;
    
    // Get the words data to know which audio files to cache
    const wordsResponse = await fetch('/vocab-words/data/words.json');
    if (!wordsResponse.ok) {
      console.error('Failed to fetch words.json for audio caching');
      return;
    }
    
    const words = await wordsResponse.json();
    const audioFiles = words.slice(0, MAX_AUDIO_FILES).map(word => word.audio);
    
    for (let i = 0; i < audioFiles.length; i += batchSize) {
      const batch = [];
      
      for (let j = 0; j < batchSize && (i + j) < audioFiles.length; j++) {
        const audioFile = audioFiles[i + j];
        const audioUrl = `/vocab-words/public/audio/${audioFile}`;
        
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
                console.log(`Skipping cache for partial response: ${audioFile}`);
                return false;
              } else {
                console.log(`Vocab words audio file ${audioFile} returned status:`, response.status);
                return false;
              }
            })
            .catch((error) => {
              console.log(`Failed to cache vocab words audio file ${audioFile}:`, error.message);
              return false;
            })
        );
      }
      
      // Wait for current batch to complete
      const results = await Promise.all(batch);
      const batchCached = results.filter(Boolean).length;
      
      console.log(`Vocab words batch ${Math.floor(i/batchSize) + 1}: Cached ${batchCached}/${batchSize} files`);
      console.log(`Total vocab words cached so far: ${totalCached} files`);
      
      // Longer delay between batches to be more conservative
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`Vocab words audio caching completed! Total files cached: ${totalCached}`);
    
    // Notify clients about completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'AUDIO_CACHE_COMPLETE',
        totalCached: totalCached
      });
    });
    
  } catch (error) {
    console.error('Error in vocab words cacheAudioFiles:', error);
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