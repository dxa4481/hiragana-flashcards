// FlashcardCard.jsx
// -----------------------------------------------------------------------------
// UI for a single flashcard with Romaji / English toggles and Audio playback.
// -----------------------------------------------------------------------------

(function (global) {
  function FlashcardCard({ card, showRomaji, toggleRomaji, showEnglish, toggleEnglish, playAudio }) {
    if (!card) return null;
    return (
      <>
        {/* Badge */}
        <span className="text-xs uppercase tracking-wider bg-gray-200 rounded-full px-3 py-1">
          {card.type}
        </span>

        {/* Main text */}
        <h1 className="text-4xl font-bold tracking-wide">{card.kana}</h1>

        {showRomaji && (
          <p className="text-xl">
            {card.romaji}
            {card.kanji ? ` (${card.kanji})` : ''}
          </p>
        )}
        {showEnglish && <p className="italic text-lg text-center">{card.english}</p>}

        {/* Action buttons */}
        <div className="flex gap-3 mt-4 flex-wrap justify-center">
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
            ▶︎ Audio
          </button>
          <button
            onClick={toggleEnglish}
            className="bg-gray-200 px-4 py-2 rounded-2xl shadow"
          >
            {showEnglish ? 'Hide English' : 'Show English'}
          </button>
        </div>
      </>
    );
  }

  global.FlashcardCard = FlashcardCard;
})(window);

