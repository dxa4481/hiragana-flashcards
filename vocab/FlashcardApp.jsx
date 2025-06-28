// FlashcardApp.jsx (stand‑alone)
// -----------------------------------------------------------------------------
// • Alternates queues without auto‑advance
// • Advances only on Right/Wrong
// • Shows badge “WORD” or “PHRASE” for the current card
// • Persists progress + stats in localStorage
// • Uses *relative* path for audio so hosting under sub‑folders works
// -----------------------------------------------------------------------------

const { useEffect, useState, useCallback, useRef } = React;

// -------------------------- Local‑storage keys -----------------------------
const STORAGE_PROGRESS = "jp-flashcards-progress";
const STORAGE_STATS     = "jp-flashcards-stats";

// -------------------------- SM‑2 helper ------------------------------------
function updateSM2(card, quality) {
  let { repetitions = 0, interval = 0, easeFactor = 2.5 } = card;
  if (quality < 3) { repetitions = 0; interval = 1; }
  else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }
  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  return { ...card, repetitions, interval, easeFactor, nextReview: dayjs().add(interval, "day").format("YYYY-MM-DD") };
}

// -------------------------- Main component ---------------------------------
function FlashcardApp() {
  const [cards, setCards] = useState([]);
  const [current, setCurrent] = useState(null);
  const [showRomaji, setShowRomaji] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [stats, setStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_STATS)) || { right: 0, wrong: 0 }; }
    catch { return { right: 0, wrong: 0 }; }
  });
  const lastTypeRef = useRef("phrase");

  // ---------------------- load data & restore progress ---------------------
  useEffect(() => {
    (async () => {
      const [wordList, phraseList] = await Promise.all([
        fetch("./data/words.json").then(r => r.json()),
        fetch("./data/phrases.json").then(r => r.json()),
      ]);
      let saved = {};
      try { saved = JSON.parse(localStorage.getItem(STORAGE_PROGRESS)) || {}; } catch {}
      const merged = [...wordList, ...phraseList].map(c => ({
        repetitions: 0,
        interval: 0,
        easeFactor: 2.5,
        nextReview: dayjs().format("YYYY-MM-DD"),
        ...c,
        ...saved[c.id],
      }));
      setCards(merged);
    })();
  }, []);

  // ---------------------- persist progress & stats -------------------------
  useEffect(() => {
    if (!cards.length) return;
    const out = {};
    cards.forEach(c => { out[c.id] = { repetitions: c.repetitions, interval: c.interval, easeFactor: c.easeFactor, nextReview: c.nextReview }; });
    localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(out));
  }, [cards]);
  useEffect(() => { localStorage.setItem(STORAGE_STATS, JSON.stringify(stats)); }, [stats]);

  // ---------------------- pick next due card -------------------------------
  const pickNext = useCallback(() => {
    const now = dayjs();
    const due = cards.filter(c => now.isAfter(dayjs(c.nextReview)));
    if (!due.length) { setCurrent(null); return; }
    const dueWords   = due.filter(c => c.type === "word");
    const duePhrases = due.filter(c => c.type === "phrase");
    let next = null;
    if (dueWords.length && duePhrases.length) {
      if (lastTypeRef.current === "word") next = duePhrases[Math.floor(Math.random() * duePhrases.length)];
      else next = dueWords[Math.floor(Math.random() * dueWords.length)];
    } else if (dueWords.length) next = dueWords[Math.floor(Math.random() * dueWords.length)];
    else next = duePhrases[Math.floor(Math.random() * duePhrases.length)];
    if (next) {
      lastTypeRef.current = next.type;
      setCurrent(next);
      setShowRomaji(false);
      setShowEnglish(false);
    }
  }, [cards]);
  useEffect(() => { if (cards.length) pickNext(); }, [cards, pickNext]);

  // ---------------------- audio (relative path) ---------------------------
  const playAudio = () => {
    if (!current) return;
    const audioPath = `public/audio/${current.audio}`; // relative to current dir, works under sub‑folders
    new Howl({ src: [audioPath] }).play();
  };

  // ---------------------- grading -----------------------------------------
  const grade = isRight => {
    if (!current) return;
    const updated = updateSM2(current, isRight ? 5 : 2);
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
    setStats(s => ({ ...s, [isRight ? "right" : "wrong"]: s[isRight ? "right" : "wrong"] + 1 }));
  };

  // ---------------------- UI ----------------------------------------------
  if (!cards.length) return <p className="p-4">Loading…</p>;
  if (!current) return (
    <div className="p-4 text-center space-y-4">
      <h2 className="text-2xl font-bold">All done for today! 🎉</h2>
      <p>Score: <span className="text-green-600 font-bold">{stats.right}</span> ✅ | <span className="text-red-600 font-bold">{stats.wrong}</span> ❌</p>
      <button className="bg-blue-500 text-white px-4 py-2 rounded-2xl shadow" onClick={() => setCards([...cards])}>Review Again</button>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Scoreboard */}
      <p className="text-sm self-start">Score: <span className="text-green-600 font-bold">{stats.right}</span> ✅ | <span className="text-red-600 font-bold">{stats.wrong}</span> ❌</p>

      {/* Badge */}
      <span className="text-xs uppercase tracking-wider bg-gray-200 rounded-full px-3 py-1">{current.type}</span>

      {/* Card */}
      <h1 className="text-4xl font-bold tracking-wide">{current.kana}</h1>
      {showRomaji && <p className="text-xl">{current.romaji}{current.kanji ? ` (${current.kanji})` : ""}</p>}
      {showEnglish && <p className="italic text-lg text-center">{current.english}</p>}

      {/* Action buttons */}
      <div className="flex gap-3 mt-4 flex-wrap justify-center">
        <button onClick={() => setShowRomaji(v => !v)} className="bg-gray-200 px-4 py-2 rounded-2xl shadow">{showRomaji ? "Hide Romaji" : "Show Romaji"}</button>
        <button onClick={playAudio} className="bg-emerald-500 text-white px-4 py-2 rounded-2xl shadow">▶︎ Audio</button>
        <button onClick={() => setShowEnglish(v => !v)} className="bg-gray-200 px-4 py-2 rounded-2xl shadow">{showEnglish ? "Hide English" : "Show English"}</button>
      </div>

      {/* Grading */}
      <div className="flex gap-4 mt-6">
        <button onClick={() => grade(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl shadow">✅ Right</button>
        <button onClick={() => grade(false)} className="bg-red-500 text-white px-6 py-3 rounded-2xl shadow">❌ Wrong</button>
      </div>
    </div>
  );
}

window.FlashcardApp = FlashcardApp;

