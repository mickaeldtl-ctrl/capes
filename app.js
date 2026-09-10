const SPREADSHEET_ID = "1Z2hVDXoz7qH7f0SEGlHhmLc7YU53FmR9CxgCCu9Su5o";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`;

let allCards = [];
let filteredCards = [];
let currentIndex = 0;

// Éléments du DOM
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

// Gestionnaire du localStorage
function getSRSData() {
  return JSON.parse(localStorage.getItem('srs_capes_maths') || '{}');
}

function saveSRSData(data) {
  localStorage.setItem('srs_capes_maths', JSON.stringify(data));
}

// Téléchargement des données
Papa.parse(SHEET_URL, {
  download: true,
  header: false,
  complete: function(results) {
    const rows = results.data;
    if (!rows || rows.length <= 1) {
      loadingEl.textContent = "Aucune donnée trouvée.";
      return;
    }

    const srsData = getSRSData();
    const now = Date.now();

    allCards = rows.slice(1).map(row => {
      const question = row[0] ? row[0].trim() : '';
      const cardSRS = srsData[question] || { interval: 0, nextReview: 0, repetitions: 0, easeFactor: 2.5 };

      return {
        q: question,
        lecon: row[1] ? row[1].trim() : 'Non spécifiée',
        r: row[2] ? row[2].trim() : 'Pas de réponse.',
        statut: row[3] ? row[3].trim().toUpperCase() : '',
        video: row[4] ? row[4].trim() : '',
        interval: cardSRS.interval,
        nextReview: cardSRS.nextReview,
        repetitions: cardSRS.repetitions,
        easeFactor: cardSRS.easeFactor
      };
    }).filter(card => card.q.length > 0 && card.q !== "Questions" && card.statut === "OK");

    if (allCards.length === 0) {
      loadingEl.textContent = "Aucune carte validée avec 'OK'.";
      return;
    }

    // Tri : Mettre les cartes dues en premier
    allCards.sort((a, b) => a.nextReview - b.nextReview);

    filteredCards = [...allCards];
    loadingEl.classList.add('hidden');
    appEl.classList.remove('hidden');
    showCard(0);
  },
  error: function() {
    loadingEl.textContent = "⚠️ Échec du chargement du Google Sheet.";
  }
});

// Affichage d'une carte
function showCard(index) {
  if (filteredCards.length === 0) {
    cardQuestion.textContent = "Aucune carte ne correspond.";
    cardResponse.textContent = "";
    cardLesson.textContent = "Leçon --";
    counterEl.textContent = "0 / 0";
    dueBadge.classList.add('hidden');
    return;
  }

  currentIndex = index;
  const card = filteredCards[currentIndex];

  // État initial : Réponse cachée
  answerSection.classList.add('hidden');
  srsPanel.classList.add('hidden');
  revealContainer.classList.remove('hidden');

  // Remplissage des champs
  cardQuestion.textContent = card.q;
  cardLesson.textContent = `Leçon : ${card.lecon}`;
  cardResponse.innerHTML = card.r;

  // Lien vidéo
  if (card.video && card.video.startsWith('http')) {
    cardVideo.href = card.video;
    cardVideoContainer.classList.remove('hidden');
  } else {
    cardVideoContainer.classList.add('hidden');
  }

  // Calcul du délai indicatif sur le bouton "Facile"
  const nextEasyDays = card.repetitions === 0 ? 3 : Math.round((card.interval || 1) * (card.easeFactor || 2.5));
  easyIntervalText.textContent = `+${nextEasyDays} j`;

  // Badge "À réviser"
  const isDue = card.nextReview <= Date.now();
  if (isDue) {
    dueBadge.classList.remove('hidden');
  } else {
    dueBadge.classList.add('hidden');
  }

  // Contrôles
  counterEl.textContent = `Carte ${currentIndex + 1} / ${filteredCards.length}`;
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === filteredCards.length - 1;
}

// Révéler la réponse
revealBtn.addEventListener('click', () => {
  revealContainer.classList.add('hidden');
  answerSection.classList.remove('hidden');
  srsPanel.classList.remove('hidden');
});

// Algorithme SRS & Notification
function rateCard(quality) {
  const card = filteredCards[currentIndex];
  const srsData = getSRSData();

  let interval = card.interval || 0;
  let repetitions = card.repetitions || 0;
  let easeFactor = card.easeFactor || 2.5;
  let toastMsg = "";

  if (quality === 'again') {
    repetitions = 0;
    interval = 0;
    toastMsg = "🔴 Remise en file de révision immédiate";
  } else if (quality === 'hard') {
    interval = repetitions === 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
    repetitions += 1;
    easeFactor = Math.max(1.3, easeFactor - 0.15);
    toastMsg = "🟠 Prévue pour demain";
  } else if (quality === 'easy') {
    if (repetitions === 0) interval = 3;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
    easeFactor += 0.1;
    toastMsg = `🟢 Revoir dans ${interval} jours`;
  }

  const nextReview = Date.now() + (interval * 24 * 60 * 60 * 1000);

  // Sauvegarde
  srsData[card.q] = { interval, nextReview, repetitions, easeFactor };
  saveSRSData(srsData);

  card.interval = interval;
  card.nextReview = nextReview;
  card.repetitions = repetitions;
  card.easeFactor = easeFactor;

  showToast(toastMsg);

  // Passage à la carte suivante
  if (currentIndex < filteredCards.length - 1) {
    showCard(currentIndex + 1);
  } else {
    showCard(0);
  }
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2000);
}

// Événements boutons SRS
btnAgain.addEventListener('click', () => rateCard('again'));
btnHard.addEventListener('click', () => rateCard('hard'));
btnEasy.addEventListener('click', () => rateCard('easy'));

// Navigation manuelle
prevBtn.addEventListener('click', () => currentIndex > 0 && showCard(currentIndex - 1));
nextBtn.addEventListener('click', () => currentIndex < filteredCards.length - 1 && showCard(currentIndex + 1));

randomBtn.addEventListener('click', () => {
  if (filteredCards.length <= 1) return;
  let rand;
  do { rand = Math.floor(Math.random() * filteredCards.length); } while (rand === currentIndex);
  showCard(rand);
});

resetSrsBtn.addEventListener('click', () => {
  if (confirm("Réinitialiser l'historique de révision sur cet appareil ?")) {
    localStorage.removeItem('srs_capes_maths');
    location.reload();
  }
});

// Recherche
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  filteredCards = allCards.filter(c =>
    c.q.toLowerCase().includes(query) ||
    c.r.toLowerCase().includes(query) ||
    c.lecon.toLowerCase().includes(query)
  );
  showCard(0);
});

// Clavier : Espace pour afficher la réponse, Flèches pour naviguer
document.addEventListener('keydown', (e) => {
  if (document.activeElement === searchInput) return;
  if (e.code === 'Space' && !revealContainer.classList.contains('hidden')) {
    e.preventDefault();
    revealBtn.click();
  }
});
