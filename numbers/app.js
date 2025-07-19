/* Japanese Numbers Learning App with Flashcard Algorithm */
(() => {
  "use strict";

  // DOM elements
  const numberDisplay = document.getElementById("number-display");
  const hiragana = document.getElementById("hiragana");
  const romaji = document.getElementById("romaji");
  const numberInput = document.getElementById("number-input");
  const checkBtn = document.getElementById("check-btn");
  const nextBtn = document.getElementById("next-btn");
  const feedback = document.getElementById("feedback");
  const feedbackText = document.getElementById("feedback-text");
  const correctAnswer = document.getElementById("correct-answer");
  const player = document.getElementById("player");
  const rangeSelect = document.getElementById("range-select");
  
  // Stats elements
  const correctCount = document.getElementById("correct-count");
  const incorrectCount = document.getElementById("incorrect-count");
  const accuracy = document.getElementById("accuracy");
  const streak = document.getElementById("streak");
  
  // Offline status
  let isOnline = navigator.onLine;
  let serviceWorkerRegistration = null;
  let audioCacheProgress = { percent: 0, cached: 0, total: 0 };
  let audioCacheComplete = false;

  // App state
  let currentNumber = 0;
  let currentRange = "0-10";
  let numberPool = [];
  let answeredCorrectly = [];
  let answeredIncorrectly = []; // Will store objects with {number, lastSeen}
  let currentStreak = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let cycle = 0; // Track review cycles for spaced repetition

  // Mobile audio unlock
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

  // Japanese number mappings
  const japaneseNumbers = {
    0: { hiragana: "ぜろ", romaji: "zero" },
    1: { hiragana: "いち", romaji: "ichi" },
    2: { hiragana: "に", romaji: "ni" },
    3: { hiragana: "さん", romaji: "san" },
    4: { hiragana: "よん", romaji: "yon" },
    5: { hiragana: "ご", romaji: "go" },
    6: { hiragana: "ろく", romaji: "roku" },
    7: { hiragana: "なな", romaji: "nana" },
    8: { hiragana: "はち", romaji: "hachi" },
    9: { hiragana: "きゅう", romaji: "kyuu" },
    10: { hiragana: "じゅう", romaji: "juu" }
  };

  // Generate Japanese number text for larger numbers
  function numberToJapanese(num) {
    if (num <= 10) {
      return japaneseNumbers[num];
    }
    
    // For numbers 11-99
    if (num < 100) {
      const tens = Math.floor(num / 10);
      const ones = num % 10;
      
      if (ones === 0) {
        return { hiragana: japaneseNumbers[tens].hiragana + "じゅう", romaji: japaneseNumbers[tens].romaji + "juu" };
      } else {
        return { hiragana: japaneseNumbers[tens].hiragana + "じゅう" + japaneseNumbers[ones].hiragana, romaji: japaneseNumbers[tens].romaji + "juu" + japaneseNumbers[ones].romaji };
      }
    }
    
    // For numbers 100-999
    if (num < 1000) {
      const hundreds = Math.floor(num / 100);
      const remainder = num % 100;
      
      let hiragana = japaneseNumbers[hundreds].hiragana + "ひゃく";
      let romaji = japaneseNumbers[hundreds].romaji + "hyaku";
      
      if (remainder > 0) {
        const remainderText = numberToJapanese(remainder);
        hiragana += remainderText.hiragana;
        romaji += remainderText.romaji;
      }
      
      return { hiragana, romaji };
    }
    
    // For numbers 1000-9999
    if (num < 10000) {
      const thousands = Math.floor(num / 1000);
      const remainder = num % 1000;
      
      let hiragana = japaneseNumbers[thousands].hiragana + "せん";
      let romaji = japaneseNumbers[thousands].romaji + "sen";
      
      if (remainder > 0) {
        const remainderText = numberToJapanese(remainder);
        hiragana += remainderText.hiragana;
        romaji += remainderText.romaji;
      }
      
      return { hiragana, romaji };
    }
    
    // For 10000
    if (num === 10000) {
      return { hiragana: "いちまん", romaji: "ichiman" };
    }
    
    return { hiragana: "?", romaji: "?" };
  }

  // Initialize number pool based on range
  function initializePool() {
    const range = rangeSelect.value;
    numberPool = [];
    
    switch (range) {
      case "0-10":
        for (let i = 0; i <= 10; i++) numberPool.push(i);
        break;
      case "0-100":
        for (let i = 0; i <= 100; i++) numberPool.push(i);
        break;
      case "0-1000":
        for (let i = 0; i <= 1000; i++) numberPool.push(i);
        break;
      case "0-10000":
        for (let i = 0; i <= 10000; i++) numberPool.push(i);
        break;
    }
    
    // Reset progress for new range
    answeredCorrectly = [];
    answeredIncorrectly = [];
    cycle = 0;
    updateStats();
  }

  // Improved flashcard algorithm with spaced repetition
  function getNextNumber() {
    // If there are incorrect answers that are due for review (after some cycles)
    const dueIncorrect = answeredIncorrectly.filter(entry => {
      // Simple spaced repetition: review incorrect cards after 3-5 cycles
      return (cycle - entry.lastSeen) >= 3;
    });
    
    if (dueIncorrect.length > 0) {
      // Take a random incorrect number that's due
      const randomIndex = Math.floor(Math.random() * dueIncorrect.length);
      const entry = dueIncorrect[randomIndex];
      // Remove from incorrect list temporarily
      const index = answeredIncorrectly.indexOf(entry);
      if (index > -1) {
        answeredIncorrectly.splice(index, 1);
      }
      return entry.number;
    }
    
    // If no incorrect answers are due, get a random number from the pool
    if (numberPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * numberPool.length);
      return numberPool[randomIndex];
    }
    
    // If pool is empty, reset with all numbers
    initializePool();
    return getNextNumber();
  }

  // Display a number
  function displayNumber(num) {
    currentNumber = num;
    const japanese = numberToJapanese(num);
    
    // Hide the number display - user should only see hiragana
    numberDisplay.textContent = "?";
    hiragana.textContent = japanese.hiragana;
    romaji.textContent = japanese.romaji;
    
    // Set up audio with better mobile compatibility
    preloadAudio(num);
    
    // Reset UI
    numberInput.value = "";
    feedback.classList.add("hidden");
    nextBtn.classList.add("hidden");
    checkBtn.classList.remove("hidden"); // Show check button for new card
    numberInput.focus();
  }

  function preloadAudio(num) {
    const audioPath = `audio/${num}.mp3`;
    
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

  // Check answer
  function checkAnswer() {
    const userAnswer = parseInt(numberInput.value);
    const isCorrect = userAnswer === currentNumber;
    
    // Show the correct number after user submits their answer
    numberDisplay.textContent = currentNumber;
    
    // Hide the check button after making a guess
    checkBtn.classList.add("hidden");
    
    if (isCorrect) {
      // Correct answer
      feedback.className = "correct";
      feedbackText.textContent = "✓ Correct!";
      correctAnswer.classList.add("hidden"); // Hide correct answer for correct responses
      currentStreak++;
      totalCorrect++;
      
      // Remove from incorrect list if it was there
      const incorrectIndex = answeredIncorrectly.findIndex(entry => entry.number === currentNumber);
      if (incorrectIndex > -1) {
        answeredIncorrectly.splice(incorrectIndex, 1);
      }
      
      // Add to correct list if not already there
      if (!answeredCorrectly.includes(currentNumber)) {
        answeredCorrectly.push(currentNumber);
      }
      
      // Remove from pool if answered correctly multiple times
      if (answeredCorrectly.filter(n => n === currentNumber).length >= 3) {
        const poolIndex = numberPool.indexOf(currentNumber);
        if (poolIndex > -1) {
          numberPool.splice(poolIndex, 1);
        }
      }
    } else {
      // Incorrect answer
      feedback.className = "incorrect";
      feedbackText.textContent = "✗ Incorrect!";
      correctAnswer.textContent = `The correct answer is: ${currentNumber}`;
      correctAnswer.classList.remove("hidden");
      currentStreak = 0;
      totalIncorrect++;
      
      // Add to incorrect list with cycle tracking
      const existingIndex = answeredIncorrectly.findIndex(entry => entry.number === currentNumber);
      if (existingIndex === -1) {
        // Add new incorrect entry
        answeredIncorrectly.push({ number: currentNumber, lastSeen: cycle });
      } else {
        // Update the last seen cycle for existing incorrect entry
        answeredIncorrectly[existingIndex].lastSeen = cycle;
      }
    }
    
    feedback.classList.remove("hidden");
    nextBtn.classList.remove("hidden");
    updateStats();
  }

  // Update statistics display
  function updateStats() {
    correctCount.textContent = totalCorrect;
    incorrectCount.textContent = totalIncorrect;
    
    const total = totalCorrect + totalIncorrect;
    const accuracyPercent = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;
    accuracy.textContent = `${accuracyPercent}%`;
    
    streak.textContent = currentStreak;
  }

  // Play audio for current number
  function playAudio() {
    if (player.src) {
      // Unlock audio context for mobile browsers
      unlockAudio();
      
      // Reset and play audio with better error handling
      player.currentTime = 0;
      
      // Handle mobile audio context restrictions
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
    }
  }

  // Event listeners
  hiragana.addEventListener("click", playAudio);
  
  checkBtn.addEventListener("click", checkAnswer);
  
  nextBtn.addEventListener("click", () => {
    cycle++; // Increment cycle for spaced repetition
    const nextNum = getNextNumber();
    displayNumber(nextNum);
  });
  
  numberInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      checkAnswer();
    }
  });
  
  rangeSelect.addEventListener("change", () => {
    initializePool();
    const nextNum = getNextNumber();
    displayNumber(nextNum);
  });

  // Add click listener to unlock audio on first user interaction
  document.addEventListener('click', unlockAudio, { once: true });
  document.addEventListener('touchstart', unlockAudio, { once: true });

  // Initialize the app
  function init() {
    initializePool();
    const firstNumber = getNextNumber();
    displayNumber(firstNumber);
    
    // Set up offline status monitoring
    setupOfflineMonitoring();
  }
  
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
        console.log('Service Worker ready:', registration);
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'AUDIO_CACHE_PROGRESS') {
            audioCacheProgress = {
              percent: event.data.progressPercent,
              cached: event.data.totalCached,
              total: event.data.totalFiles
            };
            updateOfflineStatus();
          } else if (event.data.type === 'AUDIO_CACHE_COMPLETE') {
            console.log('Numbers audio cache completed! Total cached:', event.data.totalCached);
            audioCacheComplete = true;
            audioCacheProgress = {
              percent: 100,
              cached: event.data.totalCached,
              total: event.data.totalFiles
            };
            updateOfflineStatus();
          }
        });

        // Start audio caching when app opens
        const startCaching = () => {
          if (registration.active) {
            console.log('Starting numbers audio caching...');
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
        console.error('Service Worker registration failed:', error);
      });
    }
    
    // Initial status update
    updateOfflineStatus();
  }
  
  // Update offline status display
  function updateOfflineStatus() {
    const statusElement = document.getElementById('offline-status');
    if (!statusElement) return;
    
    if (!isOnline) {
      statusElement.textContent = serviceWorkerRegistration ? '🔴 Offline (Cached Audio)' : '🔴 Offline Mode';
      statusElement.className = 'offline-indicator offline';
    } else if (audioCacheComplete) {
      statusElement.textContent = `🟢 Audio Cached (${audioCacheProgress.cached}/${audioCacheProgress.total})`;
      statusElement.className = 'offline-indicator online';
    } else if (serviceWorkerRegistration && audioCacheProgress.total > 0) {
      statusElement.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>🟡 Caching Audio ${audioCacheProgress.percent}%</span>
          <div style="width: 60px; height: 6px; background-color: rgba(255,255,255,0.3); border-radius: 3px; overflow: hidden;">
            <div style="height: 100%; background-color: #ffc107; transition: width 0.3s ease; width: ${audioCacheProgress.percent}%;"></div>
          </div>
        </div>
      `;
      statusElement.className = 'offline-indicator online';
    } else {
      statusElement.textContent = '🟡 Preparing...';
      statusElement.className = 'offline-indicator online';
    }
  }

  // Start the app
  init();
})();