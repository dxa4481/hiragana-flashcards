const CACHE_NAME = 'hiragana-app-v1';
const AUDIO_CACHE_NAME = 'hiragana-audio-v1';
const MAX_AUDIO_FILES = 1000;

// Files to cache immediately
const STATIC_FILES = [
  '/hiragana/',
  '/hiragana/index.html',
  '/hiragana/styles.css',
  '/hiragana/app.js'
];

// Install event - cache static files only
self.addEventListener('install', (event) => {
  console.log('Hiragana Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching hiragana static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Hiragana static files cached successfully');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Error during hiragana service worker install:', error);
      })
  );
});

// Activate event - clean up old caches and start audio caching
self.addEventListener('activate', (event) => {
  console.log('Hiragana Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== AUDIO_CACHE_NAME) {
              console.log('Deleting old hiragana cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('Hiragana Service Worker activated, starting audio caching...');
      // Start audio caching after activation
      return cacheAudioFiles();
    }).catch((error) => {
      console.error('Error during hiragana service worker activation:', error);
    })
  );
});

// Fetch event - serve from cache when available
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle audio files
  if (url.pathname.startsWith('/hiragana/audio/') && url.pathname.endsWith('.mp3')) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME)
        .then((cache) => {
          return cache.match(event.request)
            .then((response) => {
              if (response) {
                console.log('Serving hiragana audio from cache:', url.pathname);
                return response;
              }
              
              // If not in cache, try to fetch and cache it
              return fetch(event.request)
                .then((fetchResponse) => {
                  if (fetchResponse.ok) {
                    cache.put(event.request, fetchResponse.clone());
                    console.log('Cached new hiragana audio file:', url.pathname);
                  }
                  return fetchResponse;
                })
                .catch((error) => {
                  console.log('Failed to fetch hiragana audio file:', url.pathname, error);
                  return new Response('Audio not available', { status: 404 });
                });
            });
        })
        .catch((error) => {
          console.error('Error in fetch handler for hiragana audio:', error);
          return fetch(event.request);
        })
    );
    return;
  }
  
  // Handle other files
  if (url.pathname.startsWith('/hiragana/')) {
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
          console.error('Error in fetch handler for hiragana static files:', error);
          return fetch(event.request);
        })
    );
    return;
  }
});

// Function to cache audio files in batches
async function cacheAudioFiles() {
  try {
    console.log('Starting hiragana audio caching process...');
    const audioCache = await caches.open(AUDIO_CACHE_NAME);
    const batchSize = 25; // Reduced batch size for better reliability
    let totalCached = 0;
    
    // Hiragana characters to cache (basic hiragana)
    const hiraganaChars = [
      'あ', 'い', 'う', 'え', 'お',
      'か', 'き', 'く', 'け', 'こ',
      'さ', 'し', 'す', 'せ', 'そ',
      'た', 'ち', 'つ', 'て', 'と',
      'な', 'に', 'ぬ', 'ね', 'の',
      'は', 'ひ', 'ふ', 'へ', 'ほ',
      'ま', 'み', 'む', 'め', 'も',
      'や', 'ゆ', 'よ',
      'ら', 'り', 'る', 'れ', 'ろ',
      'わ', 'を', 'ん'
    ];
    
    for (let i = 0; i < hiraganaChars.length; i += batchSize) {
      const batch = [];
      
      for (let j = 0; j < batchSize && (i + j) < hiraganaChars.length; j++) {
        const char = hiraganaChars[i + j];
        const audioUrl = `/hiragana/audio/${char}.mp3`;
        
        batch.push(
          fetch(audioUrl)
            .then((response) => {
              if (response.ok) {
                return audioCache.put(audioUrl, response.clone())
                  .then(() => {
                    totalCached++;
                    return true;
                  });
              } else {
                console.log(`Hiragana audio file ${char}.mp3 returned status:`, response.status);
                return false;
              }
            })
            .catch((error) => {
              console.log(`Failed to cache hiragana audio file ${char}.mp3:`, error.message);
              return false;
            })
        );
      }
      
      // Wait for current batch to complete
      const results = await Promise.all(batch);
      const batchCached = results.filter(Boolean).length;
      
      console.log(`Hiragana batch ${Math.floor(i/batchSize) + 1}: Cached ${batchCached}/${batchSize} files`);
      console.log(`Total hiragana cached so far: ${totalCached} files`);
      
      // Longer delay between batches to be more conservative
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`Hiragana audio caching completed! Total files cached: ${totalCached}`);
    
    // Notify clients about completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'AUDIO_CACHE_COMPLETE',
        totalCached: totalCached
      });
    });
    
  } catch (error) {
    console.error('Error in hiragana cacheAudioFiles:', error);
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