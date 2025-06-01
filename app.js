/* Hiragana flash-card logic with selectable rows & aligned legend */
(() => {
  "use strict";

  /* -------- Data grouped by sections & rows -------- */
  const SECTIONS = [
    {
      label: "Basic",
      rows: [
        /* vowels */  [{k:"あ",r:"a"},{k:"い",r:"i"},{k:"う",r:"u"},{k:"え",r:"e"},{k:"お",r:"o"}],
        /* k-line */  [{k:"か",r:"ka"},{k:"き",r:"ki"},{k:"く",r:"ku"},{k:"け",r:"ke"},{k:"こ",r:"ko"}],
        /* s-line */  [{k:"さ",r:"sa"},{k:"し",r:"shi"},{k:"す",r:"su"},{k:"せ",r:"se"},{k:"そ",r:"so"}],
        /* t-line */  [{k:"た",r:"ta"},{k:"ち",r:"chi"},{k:"つ",r:"tsu"},{k:"て",r:"te"},{k:"と",r:"to"}],
        /* n-line */  [{k:"な",r:"na"},{k:"に",r:"ni"},{k:"ぬ",r:"nu"},{k:"ね",r:"ne"},{k:"の",r:"no"}],
        /* h-line */  [{k:"は",r:"ha"},{k:"ひ",r:"hi"},{k:"ふ",r:"fu"},{k:"へ",r:"he"},{k:"ほ",r:"ho"}],
        /* m-line */  [{k:"ま",r:"ma"},{k:"み",r:"mi"},{k:"む",r:"mu"},{k:"め",r:"me"},{k:"も",r:"mo"}],
        /* y-line */  [{k:"や",r:"ya"},{k:"ゆ",r:"yu"},{k:"よ",r:"yo"}],
        /* r-line */  [{k:"ら",r:"ra"},{k:"り",r:"ri"},{k:"る",r:"ru"},{k:"れ",r:"re"},{k:"ろ",r:"ro"}],
        /* w-line */  [{k:"わ",r:"wa"},{k:"を",r:"wo"}],
        /* ん */      [{k:"ん",r:"n"}]
      ]
    },
    {
      label: "Dakuten / Handakuten",
      rows: [
        [{k:"が",r:"ga"},{k:"ぎ",r:"gi"},{k:"ぐ",r:"gu"},{k:"げ",r:"ge"},{k:"ご",r:"go"}],
        [{k:"ざ",r:"za"},{k:"じ",r:"ji"},{k:"ず",r:"zu"},{k:"ぜ",r:"ze"},{k:"ぞ",r:"zo"}],
        [{k:"だ",r:"da"},{k:"ぢ",r:"ji"},{k:"づ",r:"zu"},{k:"で",r:"de"},{k:"ど",r:"do"}],
        [{k:"ば",r:"ba"},{k:"び",r:"bi"},{k:"ぶ",r:"bu"},{k:"べ",r:"be"},{k:"ぼ",r:"bo"}],
        [{k:"ぱ",r:"pa"},{k:"ぴ",r:"pi"},{k:"ぷ",r:"pu"},{k:"ぺ",r:"pe"},{k:"ぽ",r:"po"}]
      ]
    },
    {
      label: "Youon",
      rows: [
        [{k:"きゃ",r:"kya"},{k:"きゅ",r:"kyu"},{k:"きょ",r:"kyo"}],
        [{k:"しゃ",r:"sha"},{k:"しゅ",r:"shu"},{k:"しょ",r:"sho"}],
        [{k:"ちゃ",r:"cha"},{k:"ちゅ",r:"chu"},{k:"ちょ",r:"cho"}],
        [{k:"にゃ",r:"nya"},{k:"にゅ",r:"nyu"},{k:"にょ",r:"nyo"}],
        [{k:"ひゃ",r:"hya"},{k:"ひゅ",r:"hyu"},{k:"ひょ",r:"hyo"}],
        [{k:"みゃ",r:"mya"},{k:"みゅ",r:"myu"},{k:"みょ",r:"myo"}],
        [{k:"りゃ",r:"rya"},{k:"りゅ",r:"ryu"},{k:"りょ",r:"ryo"}]
      ]
    },
    {
      label: "Youon Dakuten",
      rows: [
        [{k:"ぎゃ",r:"gya"},{k:"ぎゅ",r:"gyu"},{k:"ぎょ",r:"gyo"}],
        [{k:"じゃ",r:"ja"},{k:"じゅ",r:"ju"},{k:"じょ",r:"jo"}],
        [{k:"びゃ",r:"bya"},{k:"びゅ",r:"byu"},{k:"びょ",r:"byo"}],
        [{k:"ぴゃ",r:"pya"},{k:"ぴゅ",r:"pyu"},{k:"ぴょ",r:"pyo"}]
      ]
    }
  ];

  /* map last vowel to table column (a-i-u-e-o) */
  const VOWEL_COL = { a:0, i:1, u:2, e:3, o:4 };

  /* ------- Build legend table -------- */
  const legendBody = document.getElementById("legend-body");
  let rowIndex = 0;                  // global row index for check-box IDs

  SECTIONS.forEach(section => {
    /* section label row */
    const secTr = document.createElement("tr");
    secTr.className = "section";
    secTr.innerHTML = `<td colspan="6">${section.label}</td>`;
    legendBody.appendChild(secTr);

    /* data rows */
    section.rows.forEach(row => {
      const tr = document.createElement("tr");

      /* checkbox cell */
      const tdChk = document.createElement("td");
      const cb    = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "row-toggle";
      cb.dataset.index = rowIndex;
      if (rowIndex === 0) cb.checked = true;      // only vowels default on
      tdChk.appendChild(cb);
      tr.appendChild(tdChk);

      /* prepare five placeholders */
      const cols = new Array(5).fill(null);
      row.forEach(item => {
        const col = VOWEL_COL[item.r.slice(-1)] ?? 0;   // ん -> col 0 fallback
        cols[col] = item;
      });

      /* render cells */
      cols.forEach(cell => {
        const td = document.createElement("td");
        if (cell) {
          td.innerHTML =
            `<span class="kana">${cell.k}</span>` +
            `<span class="roma">${cell.r}</span>`;
        }
        tr.appendChild(td);
      });

      legendBody.appendChild(tr);
      rowIndex++;
    });
  });

  /* ---------- Flash-card DOM refs ---------- */
  const kana   = document.getElementById("kana");
  const romaji = document.getElementById("romaji");
  const player = document.getElementById("player");
  const next   = document.getElementById("next-btn");
  const stage  = document.getElementById("stage");

  /* ---------- State ---------- */
  let pool     = [];    // flattened active cards
  let revealed = false;
  let timerId  = null;
  let current  = null;

  /* rebuild pool from checked rows */
  const rebuildPool = () => {
    pool = [];
    document.querySelectorAll(".row-toggle").forEach(cb => {
      if (cb.checked) {
        /* unravel row index back into section.rows[rowOffset] */
        let idx = Number(cb.dataset.index);
        outer: for (const sec of SECTIONS) {
          for (const r of sec.rows) {
            if (idx-- === 0) { pool.push(...r); break outer; }
          }
        }
      }
    });

    if (!pool.length) {             // no selection
      kana.textContent   = "☚ select rows";
      romaji.textContent = "";
      romaji.classList.add("hidden");
      current = null;
    }
  };

  const randomCard = () => pool[Math.floor(Math.random() * pool.length)];

  function display(card) {
    if (!card) return;              // nothing selected
    if (timerId) { clearTimeout(timerId); timerId = null; }

    revealed = false;
    current  = card;
    kana.textContent   = card.k;
    romaji.textContent = card.r;
    romaji.classList.add("hidden");
    player.src = `audio/${card.r}.mp3`;
  }

  function reveal() {
    if (revealed || !current) return;
    revealed = true;

    player.currentTime = 0;
    player.play().catch(() => { /* gesture policy */ });

    timerId = setTimeout(() => {
      romaji.classList.remove("hidden");
      timerId = null;
    }, 1000);
  }

  /* ----------- Event wiring ----------- */
  document.querySelectorAll(".row-toggle").forEach(cb => {
    cb.addEventListener("change", () => {
      const wasEmpty = !pool.length;
      rebuildPool();
      if (wasEmpty || !pool.includes(current)) display(randomCard());
    });
  });

  next.addEventListener("click", e => {
    e.stopPropagation();
    if (pool.length) display(randomCard());
  });

  stage.addEventListener("click", reveal);
  window.addEventListener("keydown", e => {
    if (e.code === "Space") { e.preventDefault(); reveal(); }
  });

  /* ------------- Init ------------- */
  rebuildPool();
  display(randomCard());
})();

