/* ==========================================================================
   D EAT - MOTS CACHÉS DE LA GASTRONOMIE HAÏTIENNE
   Application dédiée au service de livraison connecté aux restaurants haïtiens
   ========================================================================== */

const LEVELS_DATA = [
  {
    title: "Niveau 1 : Avant-goût & Ti-Gouté Rapides (Cheap & Bon)",
    words: ["PATE", "MARINADE", "PATATE", "BANANE", "AKRA", "PIKLIZ", "KASAV", "KNET"]
  },
  {
    title: "Niveau 2 : Les Fritures Populaires (Fritay Lakou)",
    words: ["GRIOT", "TASSO", "POULET", "SAUCISSE", "BOULETTE", "SAUCE", "CHENAIT", "PEZE"]
  },
  {
    title: "Niveau 3 : Entremets, Soupes & Entrées Chaudes",
    words: ["SOUPE", "JOUMOU", "BOUILLON", "MAYI", "CONSOME", "TREMPE", "CALALOU", "MAMBA"]
  },
  {
    title: "Niveau 4 : Les Grands Riz Haïtiens (Diri D Eat)",
    words: ["DJONDJON", "DIRI", "POIS", "KOLE", "SHELLA", "BLANC", "LALO", "ARROZ"]
  },
  {
    title: "Niveau 5 : Les Grands Plats de Résistance (Viande & Sauces)",
    words: ["CABRIT", "BOEUF", "COCHON", "PINTADE", "RAGOUT", "LEGUME", "PIMENT", "EPICE"]
  },
  {
    title: "Niveau 6 : Spécialités de la Mer (Pêche Haïtienne)",
    words: ["POISSON", "LAMBI", "CRABE", "HOMARD", "CREVETTE", "GROSMONTE", "BOUCANE"]
  },
  {
    title: "Niveau 7 : Desserts Traditional & Douceurs",
    words: ["DOUCE", "PAIN", "PATATE", "TORTEAU", "MAIZENA", "BONBON", "SIROP", "GATOT"]
  },
  {
    title: "Niveau 8 : Boissons, Jus Naturels & Rafraîchissements",
    words: ["JUS", "KOROSOL", "PASSION", "PAPAYE", "CITRON", "PRESTIGE", "RHUM", "BARBANCOURT"]
  },
  {
    title: "Niveau 9 : Les Ingrédients du Chef & Assaisonnements",
    words: ["EPIS", "AIL", "PERSIL", "GIRAFE", "OIGNON", "GIROFLE", "ORANGE", "SURELLE"]
  },
  {
    title: "Niveau 10 : Le Service D Eat & Expérience Livraison",
    words: ["LIVRAISON", "RESTO", "COMMANDE", "REPAS", "CHAUD", "LAKOU", "DEAT", "RAPIDE"]
  }
];

const GRID_SIZE = 15;
let currentLevelIndex = 0;
let gridLetters = [];
let targetWords = [];
let foundWords = new Set();
let selectedCells = [];
let isSelecting = false;
let startCell = null;

let timerInterval = null;
let secondsElapsed = 0;
let isMuted = false;

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const splash = document.getElementById("splashScreen");
    if (splash) {
      splash.style.opacity = "0";
      setTimeout(() => splash.style.display = "none", 600);
    }
  }, 1800);

  initEventListeners();
  loadLevel(currentLevelIndex);
});

function initEventListeners() {
  document.getElementById("muteBtn").addEventListener("click", toggleMute);
  document.getElementById("nightModeBtn").addEventListener("click", toggleNightMode);

  document.getElementById("prevLevelBtn").addEventListener("click", prevLevel);
  document.getElementById("nextLevelBtn").addEventListener("click", nextLevel);
  document.getElementById("restartLevelBtn").addEventListener("click", () => loadLevel(currentLevelIndex));
  document.getElementById("hintBtn").addEventListener("click", giveHint);
  document.getElementById("shareBtn").addEventListener("click", shareScore);

  document.getElementById("bgRed").addEventListener("input", updateCustomColors);
  document.getElementById("bgGreen").addEventListener("input", updateCustomColors);
  document.getElementById("bgBlue").addEventListener("input", updateCustomColors);
  document.getElementById("boxOpacity").addEventListener("input", updateCustomColors);

  const gridEl = document.getElementById("wordGrid");
  
  gridEl.addEventListener("mousedown", handleStartSelection);
  gridEl.addEventListener("mouseover", handleMoveSelection);
  window.addEventListener("mouseup", handleEndSelection);

  gridEl.addEventListener("touchstart", handleTouchStart, { passive: false });
  gridEl.addEventListener("touchmove", handleTouchMove, { passive: false });
  window.addEventListener("touchend", handleEndSelection);
}

function loadLevel(index) {
  currentLevelIndex = Math.max(0, Math.min(index, LEVELS_DATA.length - 1));
  const levelData = LEVELS_DATA[currentLevelIndex];
  
  targetWords = levelData.words;
  foundWords.clear();
  selectedCells = [];
  startCell = null;

  document.getElementById("levelTitle").textContent = levelData.title;
  document.getElementById("levelDisplay").textContent = `${currentLevelIndex + 1} / ${LEVELS_DATA.length}`;

  generateGrid(targetWords);
  renderGrid();
  renderWordList();
  updateFoundCount();

  resetTimer();
  startTimer();
}

function generateGrid(words) {
  gridLetters = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(""));

  const directions = [
    [0, 1],   // Horizontale
    [1, 0],   // Verticale
    [1, 1],   // Diagonale descendante
    [-1, 1]   // Diagonale ascendante
  ];

  words.forEach(word => {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 250) {
      attempts++;
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const [dirR, dirC] = dir;

      const startR = Math.floor(Math.random() * GRID_SIZE);
      const startC = Math.floor(Math.random() * GRID_SIZE);

      const endR = startR + dirR * (word.length - 1);
      const endC = startC + dirC * (word.length - 1);

      if (endR >= 0 && endR < GRID_SIZE && endC >= 0 && endC < GRID_SIZE) {
        let fits = true;
        for (let i = 0; i < word.length; i++) {
          const r = startR + dirR * i;
          const c = startC + dirC * i;
          if (gridLetters[r][c] !== "" && gridLetters[r][c] !== word[i]) {
            fits = false;
            break;
          }
        }

        if (fits) {
          for (let i = 0; i < word.length; i++) {
            gridLetters[startR + dirR * i][startC + dirC * i] = word[i];
          }
          placed = true;
        }
      }
    }
  });

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (gridLetters[r][c] === "") {
        gridLetters[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
  }
}

function renderGrid() {
  const gridEl = document.getElementById("wordGrid");
  gridEl.innerHTML = "";
  gridEl.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement("div");
      cell.classList.add("grid-cell");
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.textContent = gridLetters[r][c];
      gridEl.appendChild(cell);
    }
  }
}

function renderWordList() {
  const listEl = document.getElementById("wordList");
  listEl.innerHTML = "";

  targetWords.forEach(word => {
    const item = document.createElement("div");
    item.classList.add("word-item");
    if (foundWords.has(word)) item.classList.add("found");
    item.id = `word-${word}`;
    item.textContent = word;
    listEl.appendChild(item);
  });
}

function updateFoundCount() {
  document.getElementById("foundDisplay").textContent = `${foundWords.size} / ${targetWords.length}`;
}

function handleStartSelection(e) {
  if (!e.target.classList.contains("grid-cell")) return;
  isSelecting = true;
  startCell = e.target;
  selectedCells = [startCell];
  highlightSelected();
}

function handleMoveSelection(e) {
  if (!isSelecting || !e.target.classList.contains("grid-cell")) return;
  updateSelectionLine(startCell, e.target);
}

function handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (target && target.classList.contains("grid-cell")) {
    isSelecting = true;
    startCell = target;
    selectedCells = [startCell];
    highlightSelected();
  }
}

function handleTouchMove(e) {
  e.preventDefault();
  if (!isSelecting) return;
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (target && target.classList.contains("grid-cell")) {
    updateSelectionLine(startCell, target);
  }
}

function updateSelectionLine(fromCell, toCell) {
  const r1 = parseInt(fromCell.dataset.row);
  const c1 = parseInt(fromCell.dataset.col);
  const r2 = parseInt(toCell.dataset.row);
  const c2 = parseInt(toCell.dataset.col);

  const dr = r2 - r1;
  const dc = c2 - c1;

  const isHorizontal = dr === 0;
  const isVertical = dc === 0;
  const isDiagonal = Math.abs(dr) === Math.abs(dc);

  if (!isHorizontal && !isVertical && !isDiagonal) return;

  const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
  const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
  const distance = Math.max(Math.abs(dr), Math.abs(dc));

  const newSelection = [];
  for (let i = 0; i <= distance; i++) {
    const r = r1 + stepR * i;
    const c = c1 + stepC * i;
    const cellEl = document.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
    if (cellEl) newSelection.push(cellEl);
  }

  selectedCells = newSelection;
  highlightSelected();
}

function handleEndSelection() {
  if (!isSelecting) return;
  isSelecting = false;

  const selectedWord = selectedCells.map(cell => cell.textContent).join("");
  const reversedWord = selectedWord.split("").reverse().join("");

  let matchedWord = null;
  if (targetWords.includes(selectedWord) && !foundWords.has(selectedWord)) {
    matchedWord = selectedWord;
  } else if (targetWords.includes(reversedWord) && !foundWords.has(reversedWord)) {
    matchedWord = reversedWord;
  }

  if (matchedWord) {
    foundWords.add(matchedWord);
    selectedCells.forEach(cell => cell.classList.add("found"));
    playSound("found");

    const wordItem = document.getElementById(`word-${matchedWord}`);
    if (wordItem) wordItem.classList.add("found");

    updateFoundCount();

    if (foundWords.size === targetWords.length) {
      stopTimer();
      playSound("win");
      setTimeout(() => alert("🎉 Brao ! Menu D Eat complété avec succès !"), 300);
    }
  } else {
    selectedCells.forEach(cell => cell.classList.remove("selected"));
  }

  selectedCells = [];
  startCell = null;
}

function highlightSelected() {
  document.querySelectorAll(".grid-cell").forEach(cell => {
    if (!cell.classList.contains("found")) cell.classList.remove("selected");
  });

  selectedCells.forEach(cell => {
    if (!cell.classList.contains("found")) cell.classList.add("selected");
  });
}

function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    secondsElapsed++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() { if (timerInterval) clearInterval(timerInterval); }
function resetTimer() { secondsElapsed = 0; updateTimerDisplay(); }

function updateTimerDisplay() {
  const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
  const secs = String(secondsElapsed % 60).padStart(2, '0');
  document.getElementById("timerDisplay").textContent = `${mins}:${secs}`;
}

function giveHint() {
  const remaining = targetWords.filter(w => !foundWords.has(w));
  if (remaining.length === 0) return;
  secondsElapsed += 10;
  updateTimerDisplay();
  alert(`💡 Indice D Eat : Cherchez le met "${remaining[0][0]}..." (${remaining[0].length} lettres)`);
}

function prevLevel() { if (currentLevelIndex > 0) loadLevel(currentLevelIndex - 1); }
function nextLevel() { if (currentLevelIndex < LEVELS_DATA.length - 1) loadLevel(currentLevelIndex + 1); }

function toggleMute() {
  isMuted = !isMuted;
  document.getElementById("muteBtn").textContent = isMuted ? "🔇 Mute" : "🔊 Mute";
}

function toggleNightMode() { document.body.classList.toggle("night-mode"); }

function updateCustomColors() {
  const r = document.getElementById("bgRed").value;
  const g = document.getElementById("bgGreen").value;
  const b = document.getElementById("bgBlue").value;
  const opacity = document.getElementById("boxOpacity").value;

  document.documentElement.style.setProperty('--color-bg-rgb', `${r}, ${g}, ${b}`);
  document.documentElement.style.setProperty('--box-opacity', opacity);
}

function playSound(type) {
  if (isMuted) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);

    if (type === "found") {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else if (type === "win") {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.start(); osc.stop(ctx.currentTime + 0.6);
    }
  } catch (e) {}
}

function shareScore() {
  const text = "J'ai complété un menu sur D Eat - L'application de livraison des restaurants haïtiens ! 🛵💨";
  if (navigator.share) {
    navigator.share({ title: 'D Eat Gastronomie Haïti', text, url: window.location.href }).catch(() => {});
  } else {
    navigator.clipboard.writeText(`${text} ${window.location.href}`);
    alert("Lien copié dans le presse-papier !");
  }
}