// sm2.js
// -----------------------------------------------------------------------------
// Classic SM‑2 spaced‑repetition algorithm (Anki v1).
// Stand‑alone UMD‑style: attaches `updateSM2` to the global window object so it
// can be called anywhere without import/export (keeps things bundler‑free).
// -----------------------------------------------------------------------------

(function (global) {
  function updateSM2(card, quality) {
    let { repetitions = 0, interval = 0, easeFactor = 2.5 } = card;

    if (quality < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.round(interval * easeFactor);
      repetitions += 1;
    }

    easeFactor = Math.max(
      1.3,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    return {
      ...card,
      repetitions,
      interval,
      easeFactor,
      nextReview: dayjs().add(interval, "day").format("YYYY-MM-DD"),
    };
  }

  global.updateSM2 = updateSM2;
})(window);

