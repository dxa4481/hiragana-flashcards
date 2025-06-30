// FlashcardCard.jsx – place controls next to what they control
// -----------------------------------------------------------------------------
// • Word‑level controls live directly under the word.
// • Sentence‑level controls sit inside the "Example sentence" block, right below
//   the text/translation and directly above the optional image.
// • Divider removed—the natural grouping now provides visual clarity.
// -----------------------------------------------------------------------------

(function (global) {
  const { useState } = React;

  function FlashcardCard({
    card,
    showRomaji,
    toggleRomaji,
    showEnglish,
    toggleEnglish,
    playAudio, // plays the main‑word audio (passed from parent)
  }) {
    if (!card) return null;

    // ---------------- Local state ----------------
    const [showSentenceEnglish, setShowSentenceEnglish] = useState(false);
    const [showSentenceImage, setShowSentenceImage]     = useState(false);
    const [hoverIdx, setHoverIdx]                       = useState(null);
    const [clickedIdx, setClickedIdx]                   = useState(null);

    // ---------------- Helpers --------------------
    const playWordAudio = (idx) => {
      if (!card.word_audio?.[idx]) return;
      new Howl({ src: [card.word_audio[idx]], html5: true }).play();
      setClickedIdx(idx);
    };

    const playSentenceAudio = () => {
      if (!card.sentence_audio) return;
      new Howl({ src: [card.sentence_audio], html5: true }).play();
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
            className="bg-emerald-500 text-white px-4 py-2 rounded-2xl shadow"
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
                    {clickedIdx === i && (
                      <span className="block text-xs text-gray-600">
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

