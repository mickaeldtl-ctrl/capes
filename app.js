// URL du Google Sheets
const SPREADSHEET_ID = "1Z2hVDXoz7qH7f0SEGlHhmLc7YU53FmR9CxgCCu9Su5o";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv`;

let allCards = [];
let currentDeck = [];
let currentIndex = 0;
let activeBox = 1; // Boîte active par défaut

// Éléments DOM
const loadingEl = document.getElementById('loading');
const appEl = document.getElementById('flashcardApp');
const cardQuestion = document.getElementById('cardQuestion');
const cardLesson = document.getElementById('cardLesson');
const answerSection = document.getElementById('answerSection');
const cardResponse = document.getElementById('cardResponse');
const cardVideoContainer = document.getElementById('cardVideoContainer');
const cardVideo = document.getElementById('cardVideo');
const revealContainer = document.getElementById('revealContainer');
const revealBtn = document.getElementById('revealBtn');
const srsPanel = document.getElementById('srsPanel');
const counterEl = document.getElementById('counter');
const resetSrsBtn = document.getElementById('resetSrsBtn');
const toast = document.getElementById('toast');

const btnAgain = document.getElementById('btnAgain');
const btnHard = document.getElementById('btnHard');
const btnEasy = document.getElementById('btnEasy');

// Gestion du stockage local Leitner
function getLeitnerData() {
  try {
    return JSON.parse(localStorage.getItem('leitner_capes_maths') || '{}');
  } catch (e) {
    return {};
  }
}

function saveLeitnerData(data) {
  try {
    localStorage.setItem('leitner_capes_maths', JSON.stringify(data));
  } catch (e) {
    console.error("Erreur de sauvegarde locale:", e);
  }
}

function sanitizeText(val) {
  if (!val) return '';
  return String(val).trim().replace(/^"|"$/g, '');
}

// Chargement CSV avec PapaParse
Papa.parse(SHEET_URL, {
  download: true,
  header: false,
  skipEmptyLines: true,
  complete: function(results) {
    try {
      const rows = results.data;
      if (!rows || rows.length <= 1) {
        showError("Aucune donnée disponible.");
        return;
      }

      const leitnerData = getLeitnerData();

      allCards = rows.slice(1).map((row) => {
        if (!Array.isArray(row)) return null;

        const question = sanitizeText(row[0]);
        const lecon = sanitizeText(row[1]) || 'Non spécifiée';
        const reponse = sanitizeText(row[2]) || 'Pas de réponse.';
        const statut = sanitizeText(row[3]).toUpperCase();
        const video = sanitizeText(row[4]);

        // Boîte 1 par défaut pour toute nouvelle carte
        const box = leitnerData[question] || 1;

        return {
          q: question,
          lecon: lecon,
          r: reponse,
          statut: statut,
          video: video,
          box: box
        };
      }).filter(card => 
        card !== null && 
        card.q.length > 0 && 
        card.q.toLowerCase() !== "questions" && 
        card.statut === "OK"
      );

      loadingEl?.classList.add('hidden');
      appEl?.classList.remove('hidden');

      updateBoxCounters();
      selectBox(1); // Démarre sur la Boîte 1

    } catch (err) {
      showError("Erreur d'exécution : " + err.message);
    }
  },
  error: function() {
    showError("Impossible d'accéder au CSV.");
  }
});

function showError(msg) {
  if (loadingEl) {
    loadingEl.innerHTML = `<div style="color:#ef4444; font-weight:bold; text-align:center; padding: 20px;">⚠️ ${msg}</div>`;
  }
}

// Mise à jour des compteurs de chaque boîte
function updateBoxCounters() {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  allCards.forEach(c => { counts[c.box] = (counts[c.box] || 0) + 1; });

  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById(`box-count-${i}`);
    if (el) el.textContent = counts[i];
  }
}

// Filtrer le paquet selon la boîte sélectionnée
function selectBox(boxNumber) {
  activeBox = boxNumber;
  currentDeck = allCards.filter(c => c.box === activeBox);
  
  // Highlight visuel sur la boîte active
  document.querySelectorAll('.box-tab').forEach(tab => tab.classList.remove('active'));
  document.getElementById(`box-tab-${boxNumber}`)?.classList.add('active');

  showCard(0);
}

function showCard(index) {
  if (currentDeck.length === 0) {
    if (cardQuestion) cardQuestion.textContent = `Aucune carte dans la Boîte ${activeBox}.`;
    if (cardResponse) cardResponse.textContent = "";
    if (cardLesson) cardLesson.textContent = "Leçon --";
    if (counterEl) counterEl.textContent = "0 / 0";
    answerSection?.classList.add('hidden');
    srsPanel?.classList.add('hidden');
    revealContainer?.classList.add('hidden');
    return;
  }

  currentIndex = index;
  const card = currentDeck[currentIndex];

  answerSection?.classList.add('hidden');
  srsPanel?.classList.add('hidden');
  revealContainer?.classList.remove('hidden');

  if (cardQuestion) cardQuestion.textContent = card.q;
  if (cardLesson) cardLesson.textContent = `Leçon : ${card.lecon} (Boîte ${card.box})`;
  if (cardResponse) cardResponse.innerHTML = card.r;

  if (cardVideoContainer && cardVideo) {
    if (card.video && card.video.startsWith('http')) {
      cardVideo.href = card.video;
      cardVideoContainer.classList.remove('hidden');
    } else {
      cardVideoContainer.classList.add('hidden');
    }
  }

  if (counterEl) counterEl.textContent = `Carte ${currentIndex + 1} / ${currentDeck.length}`;
}

revealBtn?.addEventListener('click', () => {
  revealContainer?.classList.add('hidden');
  answerSection?.classList.remove('hidden');
  srsPanel?.classList.remove('hidden');
});

function rateCard(quality) {
  if (currentDeck.length === 0) return;

  const card = currentDeck[currentIndex];
  const leitnerData = getLeitnerData();
  let oldBox = card.box;

  if (quality === 'again') {
    card.box = 1; // Retour direct en boîte 1
    showToast("🔴 Retour en Boîte 1");
  } else if (quality === 'hard') {
    // Reste dans la boîte actuelle
    showToast(`🟠 Maintien en Boîte ${card.box}`);
  } else if (quality === 'easy') {
    card.box = Math.min(5, card.box + 1); // Monte d'une boîte (max 5)
    showToast(`🟢 Passage en Boîte ${card.box}`);
  }

  leitnerData[card.q] = card.box;
  saveLeitnerData(leitnerData);

  updateBoxCounters();

  // Si la carte a changé de boîte, elle quitte la vue actuelle
  if (card.box !== oldBox) {
    currentDeck.splice(currentIndex, 1);
    if (currentIndex >= currentDeck.length) {
      currentIndex = 0;
    }
    showCard(currentIndex);
  } else {
    // Si la carte reste, passe à la suivante
    if (currentIndex < currentDeck.length - 1) {
      showCard(currentIndex + 1);
    } else {
      showCard(0);
    }
  }
}

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 1500);
}

btnAgain?.addEventListener('click', () => rateCard('again'));
btnHard?.addEventListener('click', () => rateCard('hard'));
btnEasy?.addEventListener('click', () => rateCard('easy'));

resetSrsBtn?.addEventListener('click', () => {
  if (confirm("Réinitialiser toutes les cartes en Boîte 1 ?")) {
    localStorage.removeItem('leitner_capes_maths');
    location.reload();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && revealContainer && !revealContainer.classList.contains('hidden')) {
    e.preventDefault();
    revealBtn.click();
  }
});
