// URL du CSV
const SPREADSHEET_ID = "1Z2hVDXoz7qH7f0SEGlHhmLc7YU53FmR9CxgCCu9Su5o";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv`;

let allCards = [];
let filteredCards = [];
let currentIndex = 0;

// Éléments du DOM avec secours explicite
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
const dueBadge = document.getElementById('dueBadge');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const randomBtn = document.getElementById('randomBtn');
const resetSrsBtn = document.getElementById('resetSrsBtn');
const searchInput = document.getElementById('searchInput');
const toast = document.getElementById('toast');

const btnAgain = document.getElementById('btnAgain');
const btnHard = document.getElementById('btnHard');
const btnEasy = document.getElementById('btnEasy');
const easyIntervalText = document.getElementById('easyIntervalText');

function getSRSData() {
  try {
    return JSON.parse(localStorage.getItem('srs_capes_maths') || '{}');
  } catch (e) {
    return {};
  }
}

function saveSRSData(data) {
  try {
    localStorage.setItem('srs_capes_maths', JSON.stringify(data));
  } catch (e) {
    console.error(e);
  }
}

function sanitizeText(val) {
  if (!val) return '';
  return String(val).trim().replace(/^"|"$/g, '');
}

// Téléchargement CSV
Papa.parse(SHEET_URL, {
  download: true,
  header: false,
  skipEmptyLines: true,
  complete: function(results) {
    try {
      const rows = results.data;
      if (!rows || rows.length <= 1) {
        showError("Aucune donnée trouvée.");
        return;
      }

      const srsData = getSRSData();

      allCards = rows.slice(1).map((row) => {
        if (!Array.isArray(row)) return null;

        const question = sanitizeText(row[0]);
        const lecon = sanitizeText(row[1]) || 'Non spécifiée';
        const reponse = sanitizeText(row[2]) || 'Pas de réponse.';
        const statut = sanitizeText(row[3]).toUpperCase();
        const video = sanitizeText(row[4]);

        const cardSRS = srsData[question] || { interval: 0, nextReview: 0, repetitions: 0, easeFactor: 2.5 };

        return {
          q: question,
          lecon: lecon,
          r: reponse,
          statut: statut,
          video: video,
          interval: cardSRS.interval || 0,
          nextReview: cardSRS.nextReview || 0,
          repetitions: cardSRS.repetitions || 0,
          easeFactor: cardSRS.easeFactor || 2.5
        };
      }).filter(card => 
        card !== null && 
        card.q.length > 0 && 
        card.q.toLowerCase() !== "questions" && 
        card.statut === "OK"
      );

      if (allCards.length === 0) {
        showError("Aucune carte 'OK' trouvée dans la colonne D.");
        return;
      }

      allCards.sort((a, b) => a.nextReview - b.nextReview);

      filteredCards = [...allCards];

      if (loadingEl) loadingEl.classList.add('hidden');
      if (appEl) appEl.classList.remove('hidden');

      showCard(0);

    } catch (err) {
      showError("Erreur JS : " + err.message);
    }
  },
  error: function(err) {
    showError("Erreur réseau / CSV : " + err);
  }
});

function showError(msg) {
  if (loadingEl) {
    loadingEl.innerHTML = `<p style="color:#ef4444; font-weight:bold; text-align:center; padding: 20px;">⚠️ ${msg}</p>`;
  }
}

function showCard(index) {
  if (filteredCards.length === 0) {
    if (cardQuestion) cardQuestion.textContent = "Aucune carte trouvée.";
    return;
  }

  currentIndex = index;
  const card = filteredCards[currentIndex];

  if (answerSection) answerSection.classList.add('hidden');
  if (srsPanel) srsPanel.classList.add('hidden');
  if (revealContainer) revealContainer.classList.remove('hidden');

  if (cardQuestion) cardQuestion.textContent = card.q;
  if (cardLesson) cardLesson.textContent = `Leçon : ${card.lecon}`;
  if (cardResponse) cardResponse.innerHTML = card.r;

  if (cardVideoContainer && cardVideo) {
    if (card.video && card.video.startsWith('http')) {
      cardVideo.href = card.video;
      cardVideoContainer.classList.remove('hidden');
    } else {
      cardVideoContainer.classList.add('hidden');
    }
  }

  if (easyIntervalText) {
    const nextEasyDays = card.repetitions === 0 ? 3 : Math.round((card.interval || 1) * (card.easeFactor || 2.5));
    easyIntervalText.textContent = `+${nextEasyDays} j`;
  }

  if (dueBadge) {
    if (card.nextReview <= Date.now()) dueBadge.classList.remove('hidden');
    else dueBadge.classList.add('hidden');
  }

  if (counterEl) counterEl.textContent = `Carte ${currentIndex + 1} / ${filteredCards.length}`;
  if (prevBtn) prevBtn.disabled = currentIndex === 0;
  if (nextBtn) nextBtn.disabled = currentIndex === filteredCards.length - 1;
}

if (revealBtn) {
  revealBtn.addEventListener('click', () => {
    if (revealContainer) revealContainer.classList.add('hidden');
    if (answerSection) answerSection.classList.remove('hidden');
    if (srsPanel) srsPanel.classList.remove('hidden');
  });
}

function rateCard(quality) {
  if (filteredCards.length === 0) return;

  const card = filteredCards[currentIndex];
  const srsData = getSRSData();

  let interval = card.interval || 0;
  let repetitions = card.repetitions || 0;
  let easeFactor = card.easeFactor || 2.5;
  let toastMsg = "";

  if (quality === 'again') {
    repetitions = 0;
    interval = 0;
    toastMsg = "🔴 Remise en file de révision";
  } else if (quality === 'hard') {
    interval = repetitions === 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
    repetitions += 1;
    easeFactor = Math.max(1.3, easeFactor - 0.15);
    toastMsg = "🟠 À revoir demain";
  } else if (quality === 'easy') {
    if (repetitions === 0) interval = 3;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
    easeFactor += 0.1;
    toastMsg = `🟢 Revoir dans ${interval} jours`;
  }

  const nextReview = Date.now() + (interval * 24 * 60 * 60 * 1000);

  srsData[card.q] = { interval, nextReview, repetitions, easeFactor };
  saveSRSData(srsData);

  card.interval = interval;
  card.nextReview = nextReview;
  card.repetitions = repetitions;
  card.easeFactor = easeFactor;

  showToast(toastMsg);

  if (currentIndex < filteredCards.length - 1) {
    showCard(currentIndex + 1);
  } else {
    showCard(0);
  }
}

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2000);
}

if (btnAgain) btnAgain.addEventListener('click', () => rateCard('again'));
if (btnHard) btnHard.addEventListener('click', () => rateCard('hard'));
if (btnEasy) btnEasy.addEventListener('click', () => rateCard('easy'));

if (prevBtn) prevBtn.addEventListener('click', () => currentIndex > 0 && showCard(currentIndex - 1));
if (nextBtn) nextBtn.addEventListener('click', () => currentIndex < filteredCards.length - 1 && showCard(currentIndex + 1));

if (randomBtn) {
  randomBtn.addEventListener('click', () => {
    if (filteredCards.length <= 1) return;
    let rand;
    do { rand = Math.floor(Math.random() * filteredCards.length); } while (rand === currentIndex);
    showCard(rand);
  });
}

if (resetSrsBtn) {
  resetSrsBtn.addEventListener('click', () => {
    if (confirm("Réinitialiser l'historique de révision ?")) {
      localStorage.removeItem('srs_capes_maths');
      location.reload();
    }
  });
}

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    filteredCards = allCards.filter(c =>
      c.q.toLowerCase().includes(query) ||
      c.r.toLowerCase().includes(query) ||
      c.lecon.toLowerCase().includes(query)
    );
    showCard(0);
  });
}

document.addEventListener('keydown', (e) => {
  if (document.activeElement === searchInput) return;
  if (e.code === 'Space' && revealContainer && !revealContainer.classList.contains('hidden')) {
    e.preventDefault();
    revealBtn.click();
  }
});
