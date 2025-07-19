// useFlashcards.js – vocab words only
(function (global) {
  const { useState, useEffect, useCallback, useRef } = React;

  const STORAGE_PROGRESS = "jp-vocab-words-progress";
  const STORAGE_STATS    = "jp-vocab-words-stats";
  const BATCH            = 10;

  function useFlashcards() {
    const [cards, setCards]     = useState([]);
    const [current, setCurrent] = useState(undefined);
    const [stats, setStats]     = useState(() => {
      try { return JSON.parse(localStorage.getItem(STORAGE_STATS)) || { right:0, wrong:0 }; }
      catch { return { right:0, wrong:0 }; }
    });

    // ---------------- load JSON & merge progress ----------------
    useEffect(() => {
      (async () => {
        const wordsJSON = await fetch('./data/words.json').then(r=>r.json());
        const words = wordsJSON.map(o => ({ ...o, type:'word' }));

        let saved = {};
        try { saved = JSON.parse(localStorage.getItem(STORAGE_PROGRESS)) || {}; } catch {}

        let w=0;
        const merged = words.map(item => {
          const s = saved[item.id] || {};
          let unlocked = s.unlocked;
          if (unlocked === undefined) {
            if (item.type==='word' && w<BATCH) { unlocked=true; w++; }
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

    // ---------------- pick next card ----------------
    const pickNext = useCallback(() => {
      const unlockedCards = cards.filter(c => c.unlocked);
      if (!unlockedCards.length) { setCurrent(null); return; }
      const next = unlockedCards[Math.random()*unlockedCards.length|0];
      setCurrent(next);
    }, [cards]);
    useEffect(() => { pickNext(); }, [cards]);

    // ---------------- actions ----------------
    const unlockBatch = () => {
      setCards(prev => {
        const up = [...prev];
        let added = 0;
        for (const c of up) {
          if (!c.unlocked && c.type==='word' && added<BATCH) { c.unlocked=true; added++; }
        }
        return up;
      });
    };
    const addNewWords = () => unlockBatch();

    const grade = (isRight) => {
      if (!current) return;
      setCards(prev => prev.map(c => c.id===current.id? { ...c, repetitions:c.repetitions+(isRight?1:0) }:c));
      setStats(s => ({ ...s, [isRight?'right':'wrong']: s[isRight?'right':'wrong']+1 }));
    };

    // --------------- counts & arrays ----------------
    const wordsUnlockedArr = cards.filter(c => c.type==='word' && c.unlocked);

    const wordTotal      = cards.filter(c => c.type==='word').length;
    const wordUnlocked   = wordsUnlockedArr.length;

    return {
      current,
      grade,
      stats,
      wordTotal,
      wordUnlocked,
      wordsUnlockedArr,
      addNewWords,
    };
  }

  global.useFlashcards = useFlashcards;
})(window);
