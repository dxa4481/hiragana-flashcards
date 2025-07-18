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

  // App state
  let currentNumber = 0;
  let currentRange = "0-10";
  let numberPool = [];
  let answeredCorrectly = [];
  let answeredIncorrectly = [];
  let currentStreak = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;

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
    updateStats();
  }

  // Flashcard algorithm: prioritize incorrectly answered numbers
  function getNextNumber() {
    // If there are incorrect answers, prioritize them
    if (answeredIncorrectly.length > 0) {
      // Take a random incorrect number
      const randomIndex = Math.floor(Math.random() * answeredIncorrectly.length);
      const number = answeredIncorrectly.splice(randomIndex, 1)[0];
      return number;
    }
    
    // If no incorrect answers, get a random number from the pool
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
    
    // Set up audio
    player.src = `audio/${num}.mp3`;
    
    // Reset UI
    numberInput.value = "";
    feedback.classList.add("hidden");
    nextBtn.classList.add("hidden");
    numberInput.focus();
  }

  // Check answer
  function checkAnswer() {
    const userAnswer = parseInt(numberInput.value);
    const isCorrect = userAnswer === currentNumber;
    
    // Show the correct number after user submits their answer
    numberDisplay.textContent = currentNumber;
    
    if (isCorrect) {
      // Correct answer
      feedback.className = "correct";
      feedbackText.textContent = "✓ Correct!";
      currentStreak++;
      totalCorrect++;
      
      // Remove from incorrect list if it was there
      const incorrectIndex = answeredIncorrectly.indexOf(currentNumber);
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
      
      // Add to incorrect list
      if (!answeredIncorrectly.includes(currentNumber)) {
        answeredIncorrectly.push(currentNumber);
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
      player.currentTime = 0;
      player.play().catch(() => {
        console.log("Audio playback failed - user gesture required");
      });
    }
  }

  // Event listeners
  hiragana.addEventListener("click", playAudio);
  
  checkBtn.addEventListener("click", checkAnswer);
  
  nextBtn.addEventListener("click", () => {
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

  // Initialize the app
  function init() {
    initializePool();
    const firstNumber = getNextNumber();
    displayNumber(firstNumber);
  }

  // Start the app
  init();
})();