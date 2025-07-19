// App.jsx – vocab words only
(function (global) {
  const { useState } = React;

  function FlashcardApp() {
    const {
      current, grade, stats,
      wordTotal, wordUnlocked, wordsUnlockedArr,
      addNewWords,
    } = global.useFlashcards();

    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [serviceWorkerReady, setServiceWorkerReady] = useState(false);

    const [showRomaji, setShowRomaji] = useState(false);
    const [showEnglish, setShowEnglish] = useState(false);
    const [showWordList, setShowWordList] = useState(false);

    const playAudio = () => {
      if (!current) return;
      new Howl({ src: [`public/audio/${current.audio}`], html5: true }).play();
    };

    const resetAll = () => {
      localStorage.clear();
      location.reload();
    };

    const handleGrade = (isRight) => {
      grade(isRight);
      setShowRomaji(false);
      setShowEnglish(false);
    };

    // Set up offline status monitoring
    useEffect(() => {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Check service worker status
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          setServiceWorkerReady(true);
          console.log('Vocab Words Service Worker ready:', registration);
          
          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'AUDIO_CACHE_COMPLETE') {
              console.log('Vocab words audio cache completed! Total cached:', event.data.totalCached);
            }
          });
        }).catch((error) => {
          console.error('Vocab Words Service Worker registration failed:', error);
        });
      }
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }, []);

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
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">🔴 Offline</span>
          ) : serviceWorkerReady ? (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">🟢 Cached</span>
          ) : (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">🟡 Online</span>
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