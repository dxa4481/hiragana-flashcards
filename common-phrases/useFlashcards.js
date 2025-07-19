// useFlashcards.js – common phrases only
(function (global) {
  const { useState, useEffect, useCallback, useRef } = React;

  const STORAGE_PROGRESS = "jp-common-phrases-progress";
  const STORAGE_STATS    = "jp-common-phrases-stats";
  const BATCH            = 20;

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
        const phrasesJSON = await fetch('./data/phrases.json').then(r=>r.json());
        const phrases = phrasesJSON.map(o => ({ ...o, type:'phrase' }));

        let saved = {};
        try { saved = JSON.parse(localStorage.getItem(STORAGE_PROGRESS)) || {}; } catch {}

        let p=0;
        const merged = phrases.map(item => {
          const s = saved[item.id] || {};
          let unlocked = s.unlocked;
          if (unlocked === undefined) {
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
          if (!c.unlocked && c.type==='phrase' && added<BATCH) { c.unlocked=true; added++; }
        }
        return up;
      });
    };
    const addNewPhrases = () => unlockBatch();

    const grade = (isRight) => {
      if (!current) return;
      setCards(prev => prev.map(c => c.id===current.id? { ...c, repetitions:c.repetitions+(isRight?1:0) }:c));
      setStats(s => ({ ...s, [isRight?'right':'wrong']: s[isRight?'right':'wrong']+1 }));
    };

    // --------------- counts & arrays ----------------
    const phrasesUnlockedArr = cards.filter(c => c.type==='phrase' && c.unlocked);

    const phraseTotal    = cards.filter(c => c.type==='phrase').length;
    const phraseUnlocked = phrasesUnlockedArr.length;

    return {
      current,
      grade,
      stats,
      phraseTotal,
      phraseUnlocked,
      phrasesUnlockedArr,
      addNewPhrases,
    };
  }

  global.useFlashcards = useFlashcards;
})(window);
