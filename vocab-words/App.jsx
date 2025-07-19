// App.jsx – vocab words only
(function (global) {
  const { useState, useEffect } = React;

  function FlashcardApp() {
    const {
      current, grade, stats,
      wordTotal, wordUnlocked, wordsUnlockedArr,
      addNewWords,
    } = global.useFlashcards();

    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
    const [audioCacheProgress, setAudioCacheProgress] = useState({ percent: 0, cached: 0, total: 0 });
    const [audioCacheStatus, setAudioCacheStatus] = useState('preparing');
    const [totalCached, setTotalCached] = useState(0);
    const [totalFiles, setTotalFiles] = useState(0);
    const [audioCacheComplete, setAudioCacheComplete] = useState(false);


    const [showRomaji, setShowRomaji] = useState(false);
    const [showEnglish, setShowEnglish] = useState(false);
    const [showWordList, setShowWordList] = useState(false);
    const [audioPreloaded, setAudioPreloaded] = useState(false);

    // Mobile audio unlock - required for iOS Safari
    const unlockAudioContext = () => {
      if (typeof Howl !== 'undefined' && Howl.ctx && Howl.ctx.state === 'suspended') {
        Howl.ctx.resume().then(() => {
          console.log('Audio context resumed for mobile');
        }).catch(err => {
          console.warn('Failed to resume audio context:', err);
        });
      }
    };

    // Preload current audio file for mobile compatibility
    const preloadCurrentAudio = () => {
      if (!current || audioPreloaded) return;
      
      const audioPath = `public/audio/${current.audio}`;
      const sound = new Howl({
        src: [audioPath],
        preload: true,
        onload: function() {
          console.log('Audio preloaded successfully:', audioPath);
          setAudioPreloaded(true);
        },
        onloaderror: function(id, err) {
          console.warn('Audio preload failed for', audioPath, err);
        }
      });
    };

    const playAudio = () => {
      if (!current) return;
      
      // Unlock audio context for mobile browsers
      unlockAudioContext();
      
      // Try to play from cache first, then fallback to network
      const audioPath = `public/audio/${current.audio}`;
      
      // Create Howl instance without html5 flag for better cache compatibility
      const sound = new Howl({
        src: [audioPath],
        preload: true,
        onloaderror: function(id, err) {
          console.warn('Audio load error for', audioPath, err);
          // Try alternative method if primary fails
          this._tryAlternativePlayback(audioPath);
        },
        onload: function() {
          console.log('Audio loaded successfully:', audioPath);
        }
      });
      
      sound._tryAlternativePlayback = (path) => {
        // Fallback to HTML5 audio if Howl fails
        try {
          const audio = new Audio(path);
          audio.play().catch(e => console.warn('Audio playback failed:', e));
        } catch (e) {
          console.warn('Alternative audio playback failed:', e);
        }
      };
      
      sound.play();
    };

    const resetAll = () => {
      localStorage.clear();
      location.reload();
    };

    const handleGrade = (isRight) => {
      grade(isRight);
      setShowRomaji(false);
      setShowEnglish(false);
      setAudioPreloaded(false); // Reset preload state when moving to next card
    };

    useEffect(() => {
      // Monitor online/offline status
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Listen for service worker messages (SW registered in HTML)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('Received SW message:', event.data);
          
          if (event.data.type === 'AUDIO_CACHE_PROGRESS') {
            setAudioCacheProgress({ percent: event.data.percent, cached: event.data.cached, total: event.data.total });
            setTotalCached(event.data.cached);
            setTotalFiles(event.data.total);
            setAudioCacheStatus('caching');
          } else if (event.data.type === 'AUDIO_CACHE_COMPLETE') {
            setAudioCacheProgress({ percent: 100, cached: event.data.cached, total: event.data.total });
            setTotalCached(event.data.cached);
            setTotalFiles(event.data.total);
            setAudioCacheStatus('complete');
            setAudioCacheComplete(true);
          } else if (event.data.type === 'AUDIO_CACHE_ERROR') {
            console.error('Audio caching error:', event.data.error);
            setAudioCacheStatus('error');
          }
        });

        // Wait for service worker to be ready before starting cache
        navigator.serviceWorker.ready.then(() => {
          setServiceWorkerReady(true);
          if (navigator.serviceWorker.controller) {
            startAudioCaching();
          } else {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              console.log('Service worker now controlling page');
              setServiceWorkerReady(true);
              startAudioCaching();
            });
          }
        });
      }
      
      // Cleanup event listeners
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }, []);

    const startAudioCaching = () => {
      if (navigator.serviceWorker.controller) {
        console.log('Starting audio caching...');
        navigator.serviceWorker.controller.postMessage({
          type: 'START_AUDIO_CACHE'
        });
      } else {
        console.warn('No service worker controller available');
      }
    };

    // Preload audio when current word changes
    useEffect(() => {
      setAudioPreloaded(false);
      if (current) {
        // Small delay to ensure DOM is ready
        setTimeout(preloadCurrentAudio, 100);
      }
    }, [current]);

    if (current === undefined) return <p className="p-4">Loading…</p>;

    // ----------------- Top toolbar -----------------
    const TopBar = (
      <div className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur p-3 flex flex-wrap items-center gap-6 shadow-sm z-10">
        {/* Score */}
        <div className="text-sm">
          Score <span className="text-green-600 font-bold">{stats.right}</span>/<span className="text-red-600 font-bold">{stats.wrong}</span>
          <button onClick={resetAll} className="ml-2 text-xs text-red-600 underline">Reset</button>
        </div>

        {/* Word controls */}
        <div className="text-sm flex items-center gap-1">
          <span>Words {wordUnlocked}/{wordTotal}</span>
          {wordUnlocked < wordTotal && (
            <button onClick={addNewWords} className="bg-purple-500 text-white px-2 py-0.5 rounded text-xs">+10</button>
          )}
          <button onClick={() => setShowWordList(v => !v)} className="bg-gray-200 px-2 py-0.5 rounded text-xs">
            {showWordList ? 'Hide' : 'List'}
          </button>
        </div>

        {/* Offline status */}
        <div className="text-sm">
          {!isOnline ? (
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">🔴 Offline{serviceWorkerReady ? ' (Cached Audio)' : ''}</span>
          ) : audioCacheComplete ? (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">🟢 Audio Cached ({audioCacheProgress.cached}/{audioCacheProgress.total})</span>
          ) : serviceWorkerReady && audioCacheProgress.total > 0 ? (
            <div className="flex items-center gap-2">
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">🟡 Caching Audio {audioCacheProgress.percent}%</span>
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 transition-all duration-300"
                  style={{ width: `${audioCacheProgress.percent}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">🟡 Preparing...</span>
          )}
        </div>
      </div>
    );

    // ----------------- Lists -----------------
    const WordListUI = showWordList && (
      <div className="mt-24 mb-4 max-h-60 overflow-y-auto bg-white rounded shadow p-3">
        <ul className="text-xs list-decimal pl-4 space-y-0.5">
          {wordsUnlockedArr.map(card => <li key={card.id}>{card.kana}</li>)}
        </ul>
      </div>
    );

    if (!current) {
      return (
        <div className="pt-24 p-4">
          {TopBar}
          {WordListUI}
          <p>No cards – unlock more!</p>
        </div>
      );
    }

    return (
      <div className="pt-24 p-4 max-w-xl mx-auto">
        {TopBar}
        {WordListUI}

        <global.FlashcardCard
          card={current}
          showRomaji={showRomaji}
          toggleRomaji={() => setShowRomaji(v => !v)}
          showEnglish={showEnglish}
          toggleEnglish={() => setShowEnglish(v => !v)}
          playAudio={playAudio}
        />

        <div className="flex gap-4 mt-6 justify-center">
          <button onClick={() => handleGrade(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl shadow">✅ Right</button>
          <button onClick={() => handleGrade(false)} className="bg-red-500 text-white px-6 py-3 rounded-2xl shadow">❌ Wrong</button>
        </div>
      </div>
    );
  }

  global.FlashcardApp = FlashcardApp;

  // Mount once everything is ready
  function mountReady() {
    const root = document.getElementById('root');
    if (root && global.useFlashcards && global.FlashcardCard && global.Scoreboard) {
      ReactDOM.createRoot(root).render(<FlashcardApp />);
    } else {
      setTimeout(mountReady, 40);
    }
  }
  if (document.readyState !== 'loading') mountReady();
  else document.addEventListener('DOMContentLoaded', mountReady);
})(window);