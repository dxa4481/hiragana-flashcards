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
  const HIRAGANA_SECTIONS = [
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

  const KATAKANA_SECTIONS = [
    {
      label: "Basic",
      rows: [
        /* vowels */  [{k:"ア",r:"a"},{k:"イ",r:"i"},{k:"ウ",r:"u"},{k:"エ",r:"e"},{k:"オ",r:"o"}],
        /* k-line */  [{k:"カ",r:"ka"},{k:"キ",r:"ki"},{k:"ク",r:"ku"},{k:"ケ",r:"ke"},{k:"コ",r:"ko"}],
        /* s-line */  [{k:"サ",r:"sa"},{k:"シ",r:"shi"},{k:"ス",r:"su"},{k:"セ",r:"se"},{k:"ソ",r:"so"}],
        /* t-line */  [{k:"タ",r:"ta"},{k:"チ",r:"chi"},{k:"ツ",r:"tsu"},{k:"テ",r:"te"},{k:"ト",r:"to"}],
        /* n-line */  [{k:"ナ",r:"na"},{k:"ニ",r:"ni"},{k:"ヌ",r:"nu"},{k:"ネ",r:"ne"},{k:"ノ",r:"no"}],
        /* h-line */  [{k:"ハ",r:"ha"},{k:"ヒ",r:"hi"},{k:"フ",r:"fu"},{k:"ヘ",r:"he"},{k:"ホ",r:"ho"}],
        /* m-line */  [{k:"マ",r:"ma"},{k:"ミ",r:"mi"},{k:"ム",r:"mu"},{k:"メ",r:"me"},{k:"モ",r:"mo"}],
        /* y-line */  [{k:"ヤ",r:"ya"},{k:"ユ",r:"yu"},{k:"ヨ",r:"yo"}],
        /* r-line */  [{k:"ラ",r:"ra"},{k:"リ",r:"ri"},{k:"ル",r:"ru"},{k:"レ",r:"re"},{k:"ロ",r:"ro"}],
        /* w-line */  [{k:"ワ",r:"wa"},{k:"ヲ",r:"wo"}],
        /* ン */      [{k:"ン",r:"n"}]
      ]
    },
    {
      label: "Dakuten / Handakuten",
      rows: [
        [{k:"ガ",r:"ga"},{k:"ギ",r:"gi"},{k:"グ",r:"gu"},{k:"ゲ",r:"ge"},{k:"ゴ",r:"go"}],
        [{k:"ザ",r:"za"},{k:"ジ",r:"ji"},{k:"ズ",r:"zu"},{k:"ゼ",r:"ze"},{k:"ゾ",r:"zo"}],
        [{k:"ダ",r:"da"},{k:"ヂ",r:"ji"},{k:"ヅ",r:"zu"},{k:"デ",r:"de"},{k:"ド",r:"do"}],
        [{k:"バ",r:"ba"},{k:"ビ",r:"bi"},{k:"ブ",r:"bu"},{k:"ベ",r:"be"},{k:"ボ",r:"bo"}],
        [{k:"パ",r:"pa"},{k:"ピ",r:"pi"},{k:"プ",r:"pu"},{k:"ペ",r:"pe"},{k:"ポ",r:"po"}]
      ]
    },
    {
      label: "Youon",
      rows: [
        [{k:"キャ",r:"kya"},{k:"キュ",r:"kyu"},{k:"キョ",r:"kyo"}],
        [{k:"シャ",r:"sha"},{k:"シュ",r:"shu"},{k:"ショ",r:"sho"}],
        [{k:"チャ",r:"cha"},{k:"チュ",r:"chu"},{k:"チョ",r:"cho"}],
        [{k:"ニャ",r:"nya"},{k:"ニュ",r:"nyu"},{k:"ニョ",r:"nyo"}],
        [{k:"ヒャ",r:"hya"},{k:"ヒュ",r:"hyu"},{k:"ヒョ",r:"hyo"}],
        [{k:"ミャ",r:"mya"},{k:"ミュ",r:"myu"},{k:"ミョ",r:"myo"}],
        [{k:"リャ",r:"rya"},{k:"リュ",r:"ryu"},{k:"リョ",r:"ryo"}]
      ]
    },
    {
      label: "Youon Dakuten",
      rows: [
        [{k:"ギャ",r:"gya"},{k:"ギュ",r:"gyu"},{k:"ギョ",r:"gyo"}],
        [{k:"ジャ",r:"ja"},{k:"ジュ",r:"ju"},{k:"ジョ",r:"jo"}],
        [{k:"ビャ",r:"bya"},{k:"ビュ",r:"byu"},{k:"ビョ",r:"byo"}],
        [{k:"ピャ",r:"pya"},{k:"ピュ",r:"pyu"},{k:"ピョ",r:"pyo"}]
      ]
    }
  ];

  // Current mode and sections
  let currentMode = 'hiragana';
  let SECTIONS = HIRAGANA_SECTIONS;

  /* attach SM-2 fields to both datasets */
  HIRAGANA_SECTIONS.flatMap(sec => sec.rows.flat())
          .forEach(c => Object.assign(c,{reps:0,interval:0,ef:2.5,due:0}));
  KATAKANA_SECTIONS.flatMap(sec => sec.rows.flat())
          .forEach(c => Object.assign(c,{reps:0,interval:0,ef:2.5,due:0}));

  /* vowel → column */
  const VOWEL_COL = {a:0,i:1,u:2,e:3,o:4};

  /* ─── legend build ─── */
  const legendBody = document.getElementById("legend-body");
  
  function buildLegend() {
    legendBody.innerHTML = "";
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
  }

  buildLegend();

  /* ─── DOM refs ─── */
  const kana     = document.getElementById("kana");
  const romaji   = document.getElementById("romaji");
  const player   = document.getElementById("player");
  const nextBtn  = document.getElementById("next-btn");
  const stage    = document.getElementById("stage");
  const ans      = document.getElementById("answer-buttons");
  const rightBtn = document.getElementById("right-btn");
  const wrongBtn = document.getElementById("wrong-btn");
  const appTitle = document.getElementById("app-title");
  const hiraganaBtn = document.getElementById("hiragana-btn");
  const katakanaBtn = document.getElementById("katakana-btn");

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

  /* ─── mode switching ─── */
  function switchMode(newMode) {
    if (newMode === currentMode) return;
    
    currentMode = newMode;
    SECTIONS = currentMode === 'hiragana' ? HIRAGANA_SECTIONS : KATAKANA_SECTIONS;
    
    // Update UI
    appTitle.textContent = currentMode === 'hiragana' ? 'Hiragana Flashcards' : 'Katakana Flashcards';
    hiraganaBtn.classList.toggle('active', currentMode === 'hiragana');
    katakanaBtn.classList.toggle('active', currentMode === 'katakana');
    
    // Rebuild legend and reset
    buildLegend();
    rebuild();
    show(nextCard());
    
    // Re-attach event listeners to new checkboxes
    document.querySelectorAll(".row-toggle").forEach(cb=>{
      cb.addEventListener("change",()=>{
        const empty=!pool.length;
        rebuild();
        if(empty||!pool.includes(card)) show(nextCard());
      });
    });
  }

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
    
    // Preload audio for better mobile performance
    preloadAudio(c.r);
  }

  function preloadAudio(romaji) {
    const audioPath = `audio/${romaji}.mp3`;
    
    // Try to preload using fetch to ensure service worker cache is used
    fetch(audioPath)
      .then(response => {
        if (response.ok) {
          console.log('Audio preloaded successfully:', audioPath);
          // Set the player source after successful preload
          player.src = audioPath;
        } else {
          console.warn('Audio preload failed:', audioPath, response.status);
          // Fallback to direct assignment
          player.src = audioPath;
        }
      })
      .catch(error => {
        console.warn('Audio preload error:', audioPath, error);
        // Fallback to direct assignment
        player.src = audioPath;
      });
  }

  function reveal(){
    if(shown||!card) return;
    shown=true;
    
    // Reset and play audio with better error handling
    player.currentTime = 0;
    
    // Handle mobile audio context restrictions
    const playAudio = () => {
      player.play()
        .then(() => {
          console.log('Audio played successfully');
        })
        .catch((error) => {
          console.warn('Audio play failed:', error);
          // Try alternative approach for mobile
          if (error.name === 'NotAllowedError') {
            console.log('Audio blocked by browser policy, user interaction required');
          } else {
            // Try reloading the audio source
            const currentSrc = player.src;
            player.src = '';
            player.src = currentSrc;
            player.play().catch(() => console.warn('Audio retry failed'));
          }
        });
    };
    
    playAudio();
    
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

  // Mode switcher events
  hiraganaBtn.addEventListener("click", () => switchMode('hiragana'));
  katakanaBtn.addEventListener("click", () => switchMode('katakana'));

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
  
  /* ─── mobile audio unlock ─── */
  let audioUnlocked = false;
  
  function unlockAudio() {
    if (audioUnlocked) return;
    
    // Create a silent audio to unlock the audio context
    const silentAudio = new Audio();
    silentAudio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA';
    
    silentAudio.play()
      .then(() => {
        console.log('Mobile audio context unlocked');
        audioUnlocked = true;
      })
      .catch(err => {
        console.log('Audio unlock failed:', err);
      });
  }
  
  // Add click listener to unlock audio on first user interaction
  document.addEventListener('click', unlockAudio, { once: true });
  document.addEventListener('touchstart', unlockAudio, { once: true });
  
  /* ─── offline status monitoring ─── */
  let isOnline = navigator.onLine;
  let serviceWorkerRegistration = null;
  let audioCacheProgress = 0;
  let audioCacheStatus = 'preparing';
  let totalCached = 0;
  let totalFiles = 0;
  
  // Set up offline status monitoring
  function setupOfflineMonitoring() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      isOnline = true;
      updateOfflineStatus();
    });
    
    window.addEventListener('offline', () => {
      isOnline = false;
      updateOfflineStatus();
    });
    
    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        serviceWorkerRegistration = registration;
        updateOfflineStatus();
        console.log('Hiragana Service Worker ready:', registration);
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'AUDIO_CACHE_PROGRESS') {
            audioCacheProgress = event.data.percent;
            totalCached = event.data.cached;
            totalFiles = event.data.total;
            audioCacheStatus = 'caching';
            updateOfflineStatus();
          } else if (event.data.type === 'AUDIO_CACHE_COMPLETE') {
            audioCacheProgress = 100;
            totalCached = event.data.cached;
            totalFiles = event.data.total;
            audioCacheStatus = 'complete';
            updateOfflineStatus();
          } else if (event.data.type === 'AUDIO_CACHE_ERROR') {
            console.error('Audio caching error:', event.data.error);
            audioCacheStatus = 'error';
            updateOfflineStatus();
          }
        });

        // Start audio caching when app opens
        const startCaching = () => {
          if (registration.active) {
            console.log('Starting hiragana audio caching...');
            registration.active.postMessage({ type: 'START_AUDIO_CACHE' });
          } else if (registration.installing) {
            console.log('Service worker installing, waiting...');
            registration.installing.addEventListener('statechange', () => {
              if (registration.installing.state === 'activated') {
                console.log('Service worker activated, starting caching...');
                registration.active.postMessage({ type: 'START_AUDIO_CACHE' });
              }
            });
          } else if (registration.waiting) {
            console.log('Service worker waiting, starting caching...');
            registration.waiting.postMessage({ type: 'START_AUDIO_CACHE' });
          } else {
            console.log('No active service worker, retrying in 1 second...');
            setTimeout(startCaching, 1000);
          }
        };
        startCaching();

        // Alternative approach: Use the controlling service worker
        if (navigator.serviceWorker.controller) {
          console.log('Found controlling service worker, sending message...');
          navigator.serviceWorker.controller.postMessage({ type: 'START_AUDIO_CACHE' });
        }
      }).catch((error) => {
        console.error('Hiragana Service Worker registration failed:', error);
      });
    }
    
    // Initial status update
    updateOfflineStatus();
  }
  
  // Update offline status display (add to header if needed)
  function updateOfflineStatus() {
    // Create status element if it doesn't exist
    let statusElement = document.getElementById('offline-status');
    if (!statusElement) {
      statusElement = document.createElement('div');
      statusElement.id = 'offline-status';
      statusElement.className = 'offline-indicator';
      statusElement.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all 0.3s ease;
        z-index: 1000;
      `;
      document.body.appendChild(statusElement);
    }
    
    if (!isOnline) {
      statusElement.innerHTML = serviceWorkerRegistration ? '🔴 Offline (Cached Audio)' : '🔴 Offline Mode';
      statusElement.style.backgroundColor = '#f8d7da';
      statusElement.style.color = '#721c24';
      statusElement.style.border = '1px solid #f5c6cb';
    } else if (audioCacheStatus === 'complete') {
      statusElement.innerHTML = `🟢 Audio Cached (${totalCached}/${totalFiles})`;
      statusElement.style.backgroundColor = '#d4edda';
      statusElement.style.color = '#155724';
      statusElement.style.border = '1px solid #c3e6cb';
    } else if (serviceWorkerRegistration && audioCacheProgress > 0) {
      statusElement.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>🟡 Caching Audio ${audioCacheProgress}%</span>
          <div style="width: 80px; height: 8px; background-color: rgba(255,255,255,0.3); border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; background-color: #ffc107; transition: width 0.3s ease; width: ${audioCacheProgress}%;"></div>
          </div>
        </div>
      `;
      statusElement.style.backgroundColor = '#fff3cd';
      statusElement.style.color = '#856404';
      statusElement.style.border = '1px solid #ffeaa7';
    } else {
      statusElement.innerHTML = '🟡 Preparing...';
      statusElement.style.backgroundColor = '#fff3cd';
      statusElement.style.color = '#856404';
      statusElement.style.border = '1px solid #ffeaa7';
    }
  }
  
  // Start offline monitoring
  setupOfflineMonitoring();
})();



