/* Hiragana flash-cards with row selection, legend and SM-2 scheduling
   ─────────────────────────────────────────────────────────────────────────
   • Adds anti-determinism: each new due-date gets a ±1-cycle “jitter”.
   • Shuffle is applied whenever ≥2 cards are simultaneously due.
   • SM-2 intervals (1 → 6 → ≈interval×EF) remain exact.
*/
(() => {
  "use strict";

  /* ────────── CONFIG ────────── */
  const JITTER_RANGE = 1;          // ±1 review-cycle noise

  /* ────────── DATA ────────── */
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

  /* attach SM-2 fields */
  SECTIONS.flatMap(sec => sec.rows.flat())
          .forEach(c => Object.assign(c,{reps:0,interval:0,ef:2.5,due:0}));

  /* vowel → column */
  const VOWEL_COL = {a:0,i:1,u:2,e:3,o:4};

  /* ─── legend build ─── */
  const legendBody = document.getElementById("legend-body");
  let globalIdx = 0;

  SECTIONS.forEach(sec=>{
    legendBody.insertAdjacentHTML("beforeend",
      `<tr class="section"><td colspan="6">${sec.label}</td></tr>`);

    sec.rows.forEach(row=>{
      const rowId = globalIdx++;
      const chk = `<td><input type="checkbox" class="row-toggle" data-index="${rowId}"${rowId===0?" checked":""}></td>`;
      const cells = new Array(5).fill("");
      row.forEach(item=>{
        const col = VOWEL_COL[item.r.slice(-1)] ?? 0;
        cells[col] = `<span class="kana">${item.k}</span><span class="roma">${item.r}</span>`;
      });
      legendBody.insertAdjacentHTML("beforeend",
        `<tr>${chk}${cells.map(td=>`<td>${td}</td>`).join("")}</tr>`);
    });
  });

  /* ─── DOM refs ─── */
  const kana     = document.getElementById("kana");
  const romaji   = document.getElementById("romaji");
  const player   = document.getElementById("player");
  const nextBtn  = document.getElementById("next-btn");
  const stage    = document.getElementById("stage");
  const ans      = document.getElementById("answer-buttons");
  const rightBtn = document.getElementById("right-btn");
  const wrongBtn = document.getElementById("wrong-btn");

  /* ─── state ─── */
  let pool   = [];
  let cycle  = 0;      // increments per answer
  let card   = null;
  let shown  = false;  // revealed?
  let delay  = null;

  /* ─── util ─── */
  const shuffle = a=>{
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  };

  /* ─── SM-2 grade ─── */
  function grade(c, correct){
    const q = correct ? 5 : 2;                 // quality
    if(q>=3){
      c.interval = c.reps===0?1:c.reps===1?6:Math.round(c.interval*c.ef);
      c.reps++;
    }else{
      c.reps=0; c.interval=1;
    }
    c.ef += 0.1 - (5-q)*(0.08+(5-q)*0.02);
    if(c.ef<1.3) c.ef = 1.3;

    const jitter = (Math.random()*2-1)*JITTER_RANGE;   // ±1
    c.due = cycle + c.interval + jitter;
  }

  /* ─── next card selector ─── */
  function nextCard(){
    if(!pool.length) return null;
    const dueNow = pool.filter(c=>c.due <= cycle+1e-9);
    if(dueNow.length) return shuffle(dueNow)[0];

    const soon = Math.min(...pool.map(c=>c.due));
    return shuffle(pool.filter(c=>Math.abs(c.due-soon)<1e-9))[0];
  }

  /* ─── pool rebuild ─── */
  function rebuild(){
    pool=[];
    document.querySelectorAll(".row-toggle").forEach(cb=>{
      if(cb.checked){
        let idx=+cb.dataset.index;
        outer:for(const sec of SECTIONS)
          for(const row of sec.rows)
            if(idx--===0){ pool.push(...row); break outer; }
      }
    });
    if(!pool.length){
      kana.textContent="☚ select rows";
      romaji.classList.add("hidden");
      ans.classList.add("hidden");
      card=null;
    }
  }

  /* ─── render ─── */
  function show(c){
    if(!c) return;
    if(delay){clearTimeout(delay);delay=null;}
    card=c; shown=false;
    kana.textContent=c.k;
    romaji.textContent=c.r;
    romaji.classList.add("hidden");
    ans.classList.add("hidden");
    player.src=`audio/${c.r}.mp3`;
  }

  function reveal(){
    if(shown||!card) return;
    shown=true;
    player.currentTime=0; player.play().catch(()=>{});
    delay=setTimeout(()=>{
      romaji.classList.remove("hidden");
      ans.classList.remove("hidden");
      delay=null;
    },1000);
  }

  /* ─── events ─── */
  document.querySelectorAll(".row-toggle").forEach(cb=>{
    cb.addEventListener("change",()=>{
      const empty=!pool.length;
      rebuild();
      if(empty||!pool.includes(card)) show(nextCard());
    });
  });

  nextBtn.addEventListener("click",e=>{
    e.stopPropagation();
    if(pool.length) show(nextCard());
  });
  stage.addEventListener("click",reveal);

  rightBtn.addEventListener("click",e=>{
    e.stopPropagation();
    if(!card) return;
    grade(card,true); cycle++; show(nextCard());
  });
  wrongBtn.addEventListener("click",e=>{
    e.stopPropagation();
    if(!card) return;
    grade(card,false); cycle++; show(nextCard());
  });

  window.addEventListener("keydown",e=>{
    if(e.code==="Space"){ e.preventDefault(); reveal(); }
    else if(e.code==="ArrowRight" && shown) rightBtn.click();
    else if(e.code==="ArrowLeft"  && shown) wrongBtn.click();
  });

  /* ─── init ─── */
  rebuild();
  show(nextCard());
})();

