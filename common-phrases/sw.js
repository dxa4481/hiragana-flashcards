const CACHE_NAME = 'common-phrases-app-v1';
const AUDIO_CACHE_NAME = 'common-phrases-audio-v1';
const MAX_AUDIO_FILES = 1000;

// Files to cache immediately
const STATIC_FILES = [
  '/common-phrases/',
  '/common-phrases/index.html',
  '/common-phrases/App.jsx',
  '/common-phrases/useFlashcards.js',
  '/common-phrases/FlashcardCard.jsx',
  '/common-phrases/Scoreboard.jsx',
  '/common-phrases/sm2.js',
  '/common-phrases/data/phrases.json'
];

// Install event - cache static files only
self.addEventListener('install', (event) => {
  console.log('Common Phrases Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching common phrases static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Common phrases static files cached successfully');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Error during common phrases service worker install:', error);
      })
  );
});

// Activate event - clean up old caches and start audio caching
self.addEventListener('activate', (event) => {
  console.log('Common Phrases Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== AUDIO_CACHE_NAME) {
              console.log('Deleting old common phrases cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('Common Phrases Service Worker activated, starting audio caching...');
      // Start audio caching after activation
      return cacheAudioFiles();
    }).catch((error) => {
      console.error('Error during common phrases service worker activation:', error);
    })
  );
});

// Fetch event - serve from cache when available
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle audio files
  if (url.pathname.startsWith('/common-phrases/public/audio/') && url.pathname.endsWith('.mp3')) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME)
        .then((cache) => {
          return cache.match(event.request)
            .then((response) => {
              if (response) {
                console.log('Serving common phrases audio from cache:', url.pathname);
                return response;
              }
              
              // If not in cache, try to fetch and cache it
              return fetch(event.request)
                .then((fetchResponse) => {
                  // Only cache if response is ok and not a partial response (206)
                  if (fetchResponse.ok && fetchResponse.status !== 206) {
                    cache.put(event.request, fetchResponse.clone());
                    console.log('Cached new common phrases audio file:', url.pathname);
                  } else if (fetchResponse.status === 206) {
                    console.log('Skipping cache for partial response:', url.pathname);
                  }
                  return fetchResponse;
                })
                .catch((error) => {
                  console.log('Failed to fetch common phrases audio file:', url.pathname, error);
                  return new Response('Audio not available', { status: 404 });
                });
            });
        })
        .catch((error) => {
          console.error('Error in fetch handler for common phrases audio:', error);
          return fetch(event.request);
        })
    );
    return;
  }
  
  // Handle other files
  if (url.pathname.startsWith('/common-phrases/')) {
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
          console.error('Error in fetch handler for common phrases static files:', error);
          return fetch(event.request);
        })
    );
    return;
  }
});

// Function to cache audio files in batches
async function cacheAudioFiles() {
  try {
    console.log('Starting common phrases audio caching process...');
    const audioCache = await caches.open(AUDIO_CACHE_NAME);
    const batchSize = 25; // Reduced batch size for better reliability
    let totalCached = 0;
    
    // Get the phrases data to know which audio files to cache
    const phrasesResponse = await fetch('/common-phrases/data/phrases.json');
    if (!phrasesResponse.ok) {
      console.error('Failed to fetch phrases.json for audio caching');
      return;
    }
    
    const phrases = await phrasesResponse.json();
    const audioFiles = phrases.slice(0, MAX_AUDIO_FILES).map(phrase => phrase.audio);
    
    for (let i = 0; i < audioFiles.length; i += batchSize) {
      const batch = [];
      
      for (let j = 0; j < batchSize && (i + j) < audioFiles.length; j++) {
        const audioFile = audioFiles[i + j];
        const audioUrl = `/common-phrases/public/audio/${audioFile}`;
        
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
                console.log(`Common phrases audio file ${audioFile} returned status:`, response.status);
                return false;
              }
            })
            .catch((error) => {
              console.log(`Failed to cache common phrases audio file ${audioFile}:`, error.message);
              return false;
            })
        );
      }
      
      // Wait for current batch to complete
      const results = await Promise.all(batch);
      const batchCached = results.filter(Boolean).length;
      
      console.log(`Common phrases batch ${Math.floor(i/batchSize) + 1}: Cached ${batchCached}/${batchSize} files`);
      console.log(`Total common phrases cached so far: ${totalCached} files`);
      
      // Longer delay between batches to be more conservative
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`Common phrases audio caching completed! Total files cached: ${totalCached}`);
    
    // Notify clients about completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'AUDIO_CACHE_COMPLETE',
        totalCached: totalCached
      });
    });
    
  } catch (error) {
    console.error('Error in common phrases cacheAudioFiles:', error);
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