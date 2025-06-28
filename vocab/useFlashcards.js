// useFlashcards.js – expose unlocked arrays for UI lists
(function (global) {
  const { useState, useEffect, useCallback, useRef } = React;

  const STORAGE_PROGRESS = "jp-flashcards-progress";
  const STORAGE_STATS    = "jp-flashcards-stats";
  const BATCH            = 20;

  function useFlashcards() {
    const [cards, setCards]     = useState([]);
    const [current, setCurrent] = useState(undefined);
    const [stats, setStats]     = useState(() => {
      try { return JSON.parse(localStorage.getItem(STORAGE_STATS)) || { right:0, wrong:0 }; }
      catch { return { right:0, wrong:0 }; }
    });
    const lastType = useRef('phrase');

    // ---------------- load JSON & merge progress ----------------
    useEffect(() => {
      (async () => {
        const [wordsJSON, phrasesJSON] = await Promise.all([
          fetch('./data/words.json').then(r=>r.json()),
          fetch('./data/phrases.json').then(r=>r.json()),
        ]);
        const words   = wordsJSON.map(o   => ({ ...o, type:'word'   }));
        const phrases = phrasesJSON.map(o => ({ ...o, type:'phrase' }));

        let saved = {};
        try { saved = JSON.parse(localStorage.getItem(STORAGE_PROGRESS)) || {}; } catch {}

        let w=0,p=0;
        const merged = [...words, ...phrases].map(item => {
          const s = saved[item.id] || {};
          let unlocked = s.unlocked;
          if (unlocked === undefined) {
            if (item.type==='word'   && w<BATCH) { unlocked=true; w++; }
            if (item.type==='phrase' && p<BATCH) { unlocked=true; p++; }
          }
          return { ...item, unlocked: !!unlocked, repetitions: s.repetitions || 0 };
        });
        setCards(merged);
      })();
    }, []);

    // ---------------- persistence ----------------
    useEffect(() => {
      if (!cards.length) return;
      const out = {};
      cards.forEach(c => { out[c.id] = { unlocked:c.unlocked, repetitions:c.repetitions }; });
      localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(out));
    }, [cards]);
    useEffect(() => { localStorage.setItem(STORAGE_STATS, JSON.stringify(stats)); }, [stats]);

    // ---------------- strict alternator ----------------
    const pickNext = useCallback(() => {
      const words   = cards.filter(c => c.unlocked && c.type==='word');
      const phrases = cards.filter(c => c.unlocked && c.type==='phrase');
      if (!words.length && !phrases.length) { setCurrent(null); return; }
      let bucket;
      if (words.length && phrases.length) {
        bucket = lastType.current==='word' ? phrases : words;
      } else {
        bucket = words.length ? words : phrases;
      }
      const next = bucket[Math.random()*bucket.length|0];
      lastType.current = next.type;
      setCurrent(next);
    }, [cards]);
    useEffect(() => { pickNext(); }, [cards]);

    // ---------------- actions ----------------
    const unlockBatch = (type) => {
      setCards(prev => {
        const up = [...prev];
        let added = 0;
        for (const c of up) {
          if (!c.unlocked && c.type===type && added<BATCH) { c.unlocked=true; added++; }
        }
        return up;
      });
    };
    const addNewWords   = () => unlockBatch('word');
    const addNewPhrases = () => unlockBatch('phrase');

    const grade = (isRight) => {
      if (!current) return;
      setCards(prev => prev.map(c => c.id===current.id? { ...c, repetitions:c.repetitions+(isRight?1:0) }:c));
      setStats(s => ({ ...s, [isRight?'right':'wrong']: s[isRight?'right':'wrong']+1 }));
    };

    // --------------- counts & arrays ----------------
    const wordsUnlockedArr   = cards.filter(c => c.type==='word'   && c.unlocked);
    const phrasesUnlockedArr = cards.filter(c => c.type==='phrase' && c.unlocked);

    const wordTotal      = cards.filter(c => c.type==='word').length;
    const wordUnlocked   = wordsUnlockedArr.length;
    const phraseTotal    = cards.filter(c => c.type==='phrase').length;
    const phraseUnlocked = phrasesUnlockedArr.length;

    return {
      current,
      grade,
      stats,
      wordTotal,
      wordUnlocked,
      phraseTotal,
      phraseUnlocked,
      wordsUnlockedArr,
      phrasesUnlockedArr,
      addNewWords,
      addNewPhrases,
    };
  }

  global.useFlashcards = useFlashcards;
})(window);
