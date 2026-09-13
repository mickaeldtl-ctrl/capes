// Remplace l'URL ci-dessous par ton lien CSV Google Sheets publié sur le web si nécessaire
const SPREADSHEET_ID = "1Z2hVDXoz7qH7f0SEGlHhmLc7YU53FmR9CxgCCu9Su5o";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv`;

let queue = [];            // File d'attente des cartes à réviser aujourd'hui
let currentCard = null;
let totalSessionCount = 0; // Nombre initial de cartes pour la barre de progression
let completedCount = 0;

// Sélection des éléments HTML
const loadingEl = document.getElementById('loading');
const appEl = document.getElementById('flashcardApp');
const sessionDoneEl = document.getElementById('sessionDone');

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
const searchInput = document.getElementById('searchInput');
const toast = document.getElementById('toast');

const btnAgain = document.getElementById('btnAgain');
const btnHard = document.getElementById('btnHard');
const btnEasy = document.getElementById('btnEasy');
const easyIntervalText = document.getElementById('easyIntervalText');

// Gestion du stockage local
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
    console.error("Erreur de sauvegarde :", e);
  }
}

function sanitizeText(val) {
  if (!val) return '';
  return String(val).trim().replace(/^"|"$/g, '');
}

// Chargement et préparation de la file du jour
Papa.parse(SHEET_URL, {
  download: true,
  header: false,
  skipEmptyLines: true,
  complete: function(results) {
    try {
      const rows = results.data;
      if (!rows || rows.length <= 1) {
        showError("Aucune donnée trouvée dans la feuille.");
        return;
      }

      const srsData = getSRSData();
      const now = Date.now();

      // Extraction de toutes les cartes "OK"
      const allCards = rows.slice(1).map((row) => {
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
        showError("Aucune carte validée avec 'OK' en colonne D.");
        return;
      }

      // FILTRE STRICT : Uniquement les cartes dues aujourd'hui ou jamais vues
      queue = allCards.filter(card => card.nextReview <= now);

      // Tri pour traiter en priorité les cartes les plus anciennes
      queue.sort((a, b) => a.nextReview - b.nextReview);

      totalSessionCount = queue.length;
      completedCount = 0;

      loadingEl?.classList.add('hidden');

      if (queue.length === 0) {
        showSessionFinished();
      } else {
        appEl?.classList.remove('hidden');
        nextCard();
      }

    } catch (err) {
      showError("Erreur d'analyse : " + err.message);
    }
  },
  error: function() {
    showError("Impossible d'accéder au fichier Google Sheets.");
  }
});

function showError(msg) {
  if (loadingEl) {
    loadingEl.innerHTML = `<div style="color:#ef4444; font-weight:bold; text-align:center; padding: 20px;">⚠️ ${msg}</div>`;
  }
}

function showSessionFinished() {
  appEl?.classList.add('hidden');
  sessionDoneEl?.classList.remove('hidden');
}

function nextCard() {
  if (queue.length === 0) {
    showSessionFinished();
    return;
  }

  currentCard = queue[0];

  // Masquer la réponse
  answerSection?.classList.add('hidden');
  srsPanel?.classList.add('hidden');
  revealContainer?.classList.remove('hidden');

  if (cardQuestion) cardQuestion.textContent = currentCard.q;
  if (cardLesson) cardLesson.textContent = `Leçon : ${currentCard.lecon}`;
  if (cardResponse) cardResponse.innerHTML = currentCard.r;

  if (cardVideoContainer && cardVideo) {
    if (currentCard.video && currentCard.video.startsWith('http')) {
      cardVideo.href = currentCard.video;
      cardVideoContainer.classList.remove('hidden');
    } else {
      cardVideoContainer.classList.add('hidden');
    }
  }

  // Calcul dynamique du délai indicatif sur le bouton Facile
  if (easyIntervalText) {
    const nextDays = currentCard.repetitions === 0 ? 3 : Math.round((currentCard.interval || 1) * (currentCard.easeFactor || 2.5));
    easyIntervalText.textContent = `+${nextDays} j`;
  }

  if (counterEl) {
    counterEl.textContent = `Reste à réviser : ${queue.length} carte(s)`;
  }
}

// Révéler la réponse
revealBtn?.addEventListener('click', () => {
  revealContainer?.classList.add('hidden');
  answerSection?.classList.remove('hidden');
  srsPanel?.classList.remove('hidden');
});

// Évaluation SRS
function rateCard(quality) {
  if (!currentCard) return;

  const srsData = getSRSData();
  let interval = currentCard.interval || 0;
  let repetitions = currentCard.repetitions || 0;
  let easeFactor = currentCard.easeFactor || 2.5;
  let toastMsg = "";

  if (quality === 'again') {
    // 🔴 ÉCHEC : La carte reste dans la session du jour
    repetitions = 0;
    interval = 0;
    toastMsg = "🔴 Remise en fin de file";

    // Retirer du début et remettre à la fin de la file
    queue.shift();
    queue.push(currentCard);

  } else if (quality === 'hard') {
    // 🟠 DIFFICILE : Revoir demain (+1 jour)
    interval = repetitions === 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
    repetitions += 1;
    easeFactor = Math.max(1.3, easeFactor - 0.15);
    toastMsg = "🟠 Prévue pour demain";

    queue.shift(); // Sort de la session du jour
    completedCount++;

  } else if (quality === 'easy') {
    // 🟢 FACILE : Espacement accru (+3j, +6j...)
    if (repetitions === 0) interval = 3;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
    easeFactor += 0.1;
    toastMsg = `🟢 Revoir dans ${interval} jours`;

    queue.shift(); // Sort de la session du jour
    completedCount++;
  }

  const nextReview = Date.now() + (interval * 24 * 60 * 60 * 1000);

  // Mettre à jour et sauvegarder localement
  srsData[currentCard.q] = { interval, nextReview, repetitions, easeFactor };
  saveSRSData(srsData);

  currentCard.interval = interval;
  currentCard.nextReview = nextReview;
  currentCard.repetitions = repetitions;
  currentCard.easeFactor = easeFactor;

  showToast(toastMsg);
  nextCard();
}

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 1800);
}

// Événements boutons SRS
btnAgain?.addEventListener('click', () => rateCard('again'));
btnHard?.addEventListener('click', () => rateCard('hard'));
btnEasy?.addEventListener('click', () => rateCard('easy'));

// Réinitialisation globale des cartes
resetSrsBtn?.addEventListener('click', () => {
  if (confirm("Voulez-vous réinitialiser toutes vos révisions ? Toutes les cartes repasseront à réviser aujourd'hui.")) {
    localStorage.removeItem('srs_capes_maths');
    location.reload();
  }
});

// Touche Espace pour révéler la réponse
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && revealContainer && !revealContainer.classList.contains('hidden')) {
    e.preventDefault();
    revealBtn.click();
  }
});
