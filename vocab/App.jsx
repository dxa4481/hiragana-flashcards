// App.jsx – clean version with working lists and top-left toolbar
(function (global) {
  const { useState } = React;

  function FlashcardApp() {
    const {
      current, grade, stats,
      wordTotal, wordUnlocked, wordsUnlockedArr,
      phraseTotal, phraseUnlocked, phrasesUnlockedArr,
      addNewWords, addNewPhrases,
    } = global.useFlashcards();

    const [showRomaji, setShowRomaji] = useState(false);
    const [showEnglish, setShowEnglish] = useState(false);
    const [showWordList, setShowWordList] = useState(false);
    const [showPhraseList, setShowPhraseList] = useState(false);

    const playAudio = () => {
      if (!current) return;
      
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
    };

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
            <button onClick={addNewWords} className="bg-purple-500 text-white px-2 py-0.5 rounded text-xs">+20</button>
          )}
          <button onClick={() => setShowWordList(v => !v)} className="bg-gray-200 px-2 py-0.5 rounded text-xs">
            {showWordList ? 'Hide' : 'List'}
          </button>
        </div>

        {/* Phrase controls */}
        <div className="text-sm flex items-center gap-1">
          <span>Phrases {phraseUnlocked}/{phraseTotal}</span>
          {phraseUnlocked < phraseTotal && (
            <button onClick={addNewPhrases} className="bg-indigo-500 text-white px-2 py-0.5 rounded text-xs">+20</button>
          )}
          <button onClick={() => setShowPhraseList(v => !v)} className="bg-gray-200 px-2 py-0.5 rounded text-xs">
            {showPhraseList ? 'Hide' : 'List'}
          </button>
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

    const PhraseListUI = showPhraseList && (
      <div className="mt-24 mb-4 max-h-60 overflow-y-auto bg-white rounded shadow p-3">
        <ul className="text-xs list-decimal pl-4 space-y-0.5">
          {phrasesUnlockedArr.map(card => <li key={card.id}>{card.kana}</li>)}
        </ul>
      </div>
    );

    if (!current) {
      return (
        <div className="pt-24 p-4">
          {TopBar}
          {WordListUI}
          {PhraseListUI}
          <p>No cards – unlock more!</p>
        </div>
      );
    }

    return (
      <div className="pt-24 p-4 max-w-xl mx-auto">
        {TopBar}
        {WordListUI}
        {PhraseListUI}

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

