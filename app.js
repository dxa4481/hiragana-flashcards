/* Hiragana flash-card logic – double-click bug fixed & 1-second reveal delay */
(() => {
  "use strict";

  /* ----------------------------- Card list ----------------------------- */
  const cards = [
    /* —— 46 basic —— */
    {k:"あ",r:"a"},{k:"い",r:"i"},{k:"う",r:"u"},{k:"え",r:"e"},{k:"お",r:"o"},
    {k:"か",r:"ka"},{k:"き",r:"ki"},{k:"く",r:"ku"},{k:"け",r:"ke"},{k:"こ",r:"ko"},
    {k:"さ",r:"sa"},{k:"し",r:"shi"},{k:"す",r:"su"},{k:"せ",r:"se"},{k:"そ",r:"so"},
    {k:"た",r:"ta"},{k:"ち",r:"chi"},{k:"つ",r:"tsu"},{k:"て",r:"te"},{k:"と",r:"to"},
    {k:"な",r:"na"},{k:"に",r:"ni"},{k:"ぬ",r:"nu"},{k:"ね",r:"ne"},{k:"の",r:"no"},
    {k:"は",r:"ha"},{k:"ひ",r:"hi"},{k:"ふ",r:"fu"},{k:"へ",r:"he"},{k:"ほ",r:"ho"},
    {k:"ま",r:"ma"},{k:"み",r:"mi"},{k:"む",r:"mu"},{k:"め",r:"me"},{k:"も",r:"mo"},
    {k:"や",r:"ya"},{k:"ゆ",r:"yu"},{k:"よ",r:"yo"},
    {k:"ら",r:"ra"},{k:"り",r:"ri"},{k:"る",r:"ru"},{k:"れ",r:"re"},{k:"ろ",r:"ro"},
    {k:"わ",r:"wa"},{k:"を",r:"wo"},{k:"ん",r:"n"},
    /* —— 濁音・半濁音 —— */
    {k:"が",r:"ga"},{k:"ぎ",r:"gi"},{k:"ぐ",r:"gu"},{k:"げ",r:"ge"},{k:"ご",r:"go"},
    {k:"ざ",r:"za"},{k:"じ",r:"ji"},{k:"ず",r:"zu"},{k:"ぜ",r:"ze"},{k:"ぞ",r:"zo"},
    {k:"だ",r:"da"},{k:"ぢ",r:"ji"},{k:"づ",r:"zu"},{k:"で",r:"de"},{k:"ど",r:"do"},
    {k:"ば",r:"ba"},{k:"び",r:"bi"},{k:"ぶ",r:"bu"},{k:"べ",r:"be"},{k:"ぼ",r:"bo"},
    {k:"ぱ",r:"pa"},{k:"ぴ",r:"pi"},{k:"ぷ",r:"pu"},{k:"ぺ",r:"pe"},{k:"ぽ",r:"po"},
    /* —— 拗音 —— */
    {k:"きゃ",r:"kya"},{k:"きゅ",r:"kyu"},{k:"きょ",r:"kyo"},
    {k:"しゃ",r:"sha"},{k:"しゅ",r:"shu"},{k:"しょ",r:"sho"},
    {k:"ちゃ",r:"cha"},{k:"ちゅ",r:"chu"},{k:"ちょ",r:"cho"},
    {k:"にゃ",r:"nya"},{k:"にゅ",r:"nyu"},{k:"にょ",r:"nyo"},
    {k:"ひゃ",r:"hya"},{k:"ひゅ",r:"hyu"},{k:"ひょ",r:"hyo"},
    {k:"みゃ",r:"mya"},{k:"みゅ",r:"myu"},{k:"みょ",r:"myo"},
    {k:"りゃ",r:"rya"},{k:"りゅ",r:"ryu"},{k:"りょ",r:"ryo"},
    /* —— 拗音＋濁点／半濁点 —— */
    {k:"ぎゃ",r:"gya"},{k:"ぎゅ",r:"gyu"},{k:"ぎょ",r:"gyo"},
    {k:"じゃ",r:"ja"},{k:"じゅ",r:"ju"},{k:"じょ",r:"jo"},
    {k:"びゃ",r:"bya"},{k:"びゅ",r:"byu"},{k:"びょ",r:"byo"},
    {k:"ぴゃ",r:"pya"},{k:"ぴゅ",r:"pyu"},{k:"ぴょ",r:"pyo"}
  ];

  /* -------------------------- DOM references --------------------------- */
  const kana   = document.getElementById("kana");
  const romaji = document.getElementById("romaji");
  const player = document.getElementById("player");
  const next   = document.getElementById("next-btn");
  const stage  = document.getElementById("stage");

  /* --------------------------- State helpers --------------------------- */
  let revealed = false;     // have we shown romaji for current card?
  let timerId  = null;      // pending timeout to show romaji

  const randomCard = () => cards[Math.floor(Math.random() * cards.length)];

  /* ------------------------------ Logic ------------------------------- */
  function display(card) {
    /* kill any scheduled reveal from the previous card */
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }

    revealed = false;
    kana.textContent   = card.k;
    romaji.textContent = card.r;
    romaji.classList.add("hidden");
    player.src = `audio/${card.r}.mp3`;
  }

  function reveal() {
    if (revealed) return;
    revealed = true;

    player.currentTime = 0;
    player.play().catch(() => { /* browser requires first-gesture; ignore */ });

    /* delay romaji by 1 000 ms */
    timerId = setTimeout(() => {
      romaji.classList.remove("hidden");
      timerId = null;
    }, 2000);
  }

  /* ------------------------------ Events ------------------------------ */
  next.addEventListener("click", e => {
    e.stopPropagation();          // stop the click bubbling up to <main>
    display(randomCard());
  });

  stage.addEventListener("click", reveal);

  window.addEventListener("keydown", e => {
    if (e.code === "Space") {
      e.preventDefault();         // keep the page from scrolling
      reveal();
    }
  });

  /* --------------------------- Kick things off ------------------------ */
  display(randomCard());
})();

