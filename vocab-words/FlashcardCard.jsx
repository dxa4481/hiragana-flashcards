// FlashcardCard.jsx – auto‑reset toggles on card change
// -----------------------------------------------------------------------------
// • All per‑card toggles (Romaji, English, sentence English/image, gloss) now
//   reset to hidden when a new flashcard arrives, so nothing carries over.
// • Achieved with a useEffect that watches card.id.
// -----------------------------------------------------------------------------

(function (global) {
  const { useState, useEffect } = React;

  function FlashcardCard({
    card,
    showRomaji,
    toggleRomaji,
    showEnglish,
    toggleEnglish,
    playAudio, // plays the main‑word audio (passed from parent)
  }) {
    // Add fade-in animation styles
    React.useEffect(() => {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out forwards;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }, []);
    if (!card) return null;

    // ---------------- Local state ----------------
    const [showSentenceEnglish, setShowSentenceEnglish] = useState(false);
    const [showSentenceImage, setShowSentenceImage]     = useState(false);
    const [hoverIdx, setHoverIdx]                       = useState(null);
    const [clickedIdx, setClickedIdx]                   = useState(null);
    const [clickCounts, setClickCounts]                 = useState({});
    const [showDefinitions, setShowDefinitions]         = useState({});

    // Reset all local toggles / highlights when the flashcard changes --------
    useEffect(() => {
      setShowSentenceEnglish(false);
      setShowSentenceImage(false);
      setHoverIdx(null);
      setClickedIdx(null);
      setClickCounts({});
      setShowDefinitions({});
    }, [card.id]);

    // ---------------- Helpers --------------------
    const playWordAudio = (idx) => {
      if (!card.word_audio?.[idx]) return;
      
      const audioPath = card.word_audio[idx];
      const sound = new Howl({
        src: [audioPath],
        preload: true,
        onloaderror: function(id, err) {
          console.warn('Word audio load error for', audioPath, err);
          // Try alternative method if primary fails
          try {
            const audio = new Audio(audioPath);
            audio.play().catch(e => console.warn('Word audio playback failed:', e));
          } catch (e) {
            console.warn('Alternative word audio playback failed:', e);
          }
        },
        onload: function() {
          console.log('Word audio loaded successfully:', audioPath);
        }
      });
      
      sound.play();
      setClickedIdx(idx);
      
      // Increment click count for this word
      const newClickCount = (clickCounts[idx] || 0) + 1;
      setClickCounts(prev => ({ ...prev, [idx]: newClickCount }));
      
      // If this is the 3rd click, show definition after 2 seconds
      if (newClickCount === 3) {
        setTimeout(() => {
          setShowDefinitions(prev => ({ ...prev, [idx]: true }));
        }, 2000);
      }
    };

    const playSentenceAudio = () => {
      if (!card.sentence_audio) return;
      
      const audioPath = card.sentence_audio;
      const sound = new Howl({
        src: [audioPath],
        preload: true,
        onloaderror: function(id, err) {
          console.warn('Sentence audio load error for', audioPath, err);
          // Try alternative method if primary fails
          try {
            const audio = new Audio(audioPath);
            audio.play().catch(e => console.warn('Sentence audio playback failed:', e));
          } catch (e) {
            console.warn('Alternative sentence audio playback failed:', e);
          }
        },
        onload: function() {
          console.log('Sentence audio loaded successfully:', audioPath);
        }
      });
      
      sound.play();
    };

    // ---------------- UI -------------------------
    return (
      <>
        {/* Badge */}
        <span className="text-xs uppercase tracking-wider bg-gray-200 rounded-full px-3 py-1">
          {card.type}
        </span>

        {/* Main word */}
        <h1 className="text-4xl font-bold tracking-wide mt-1">{card.kana}</h1>
        {showRomaji && (
          <p className="text-xl">
            {card.romaji}
            {card.kanji ? ` (${card.kanji})` : ''}
          </p>
        )}
        {showEnglish && <p className="italic text-lg text-center">{card.english}</p>}

        {/* Word‑level controls */}
        <div className="flex gap-3 mt-3 flex-wrap justify-center">
          <button
            onClick={toggleRomaji}
            className="bg-gray-200 px-4 py-2 rounded-2xl shadow"
          >
            {showRomaji ? 'Hide Romaji' : 'Show Romaji'}
          </button>
          <button
            onClick={playAudio}
            className="bg-emerald-500 text-blue px-4 py-2 rounded-2xl shadow"
          >
            ▶︎ Word
          </button>
          <button
            onClick={toggleEnglish}
            className="bg-gray-200 px-4 py-2 rounded-2xl shadow"
          >
            {showEnglish ? 'Hide English' : 'Show English'}
          </button>
        </div>

        {/* Example sentence block */}
        {card.jp_sentence && (
          <div className="mt-8 text-center">
            <h3 className="mb-1 text-sm uppercase text-gray-500 tracking-wider">Example sentence</h3>
            <p className="inline-flex flex-wrap justify-center gap-1 text-xl">
              {card.jp_sentence.map((w, i) => {
                const isFocus = w === card.kana;
                return (
                  <span
                    key={i}
                    onMouseEnter={() => setHoverIdx(i)}
                    onMouseLeave={() => setHoverIdx(null)}
                    onClick={() => playWordAudio(i)}
                    className={`cursor-pointer px-1 rounded transition-all ${hoverIdx === i ? 'bg-yellow-200' : isFocus ? 'text-indigo-600 font-semibold' : ''}`}

                                      >
                      {w}
                      {showDefinitions[i] && (
                        <span className="block text-xs text-gray-600 opacity-0 animate-fade-in">
                          {card.jp_sentence_meaning?.[i] || ''}
                        </span>
                      )}
                    </span>
                );
              })}
            </p>
            {showSentenceEnglish && (
              <p className="mt-2 italic text-gray-700">
                {card.simple_english || card.jp_sentence_meaning?.join(' ')}
              </p>
            )}

            {/* Sentence-level controls */}
            <div className="flex gap-3 mt-3 mb-1 flex-wrap justify-center">
              {card.sentence_audio && (
                <button
                  onClick={playSentenceAudio}
                  className="bg-indigo-500 text-white px-4 py-2 rounded-2xl shadow"
                >
                  ▶︎ Sentence
                </button>
              )}
              <button
                onClick={() => setShowSentenceEnglish(v => !v)}
                className="bg-gray-200 px-4 py-2 rounded-2xl shadow"
              >
                {showSentenceEnglish ? 'Hide English' : 'Sentence Eng'}
              </button>
              {card.image_path && (
                <button
                  onClick={() => setShowSentenceImage(v => !v)}
                  className="bg-gray-200 px-4 py-2 rounded-2xl shadow"
                >
                  {showSentenceImage ? 'Hide Image' : 'Show Image'}
                </button>
              )}
            </div>

            {/* Sentence image */}
            {showSentenceImage && card.image_path && (
              <img
                src={card.image_path}
                alt={card.image_prompt || 'Sentence illustration'}
                className="mt-4 rounded-2xl shadow max-h-60 object-cover mx-auto"
                loading="lazy"
              />
            )}
          </div>
        )}
      </>
    );
  }

  global.FlashcardCard = FlashcardCard;
})(window);

