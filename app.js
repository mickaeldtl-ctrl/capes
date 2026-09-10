const SPREADSHEET_ID = "1Z2hVDXoz7qH7f0SEGlHhmLc7YU53FmR9CxgCCu9Su5o";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`;

let allCards = [];
let filteredCards = [];
let currentIndex = 0;

// Éléments du DOM
const loadingEl = document.getElementById('loading');
const containerEl = document.getElementById('flashcardContainer');
const cardQuestion = document.getElementById('cardQuestion');
const cardLesson = document.getElementById('cardLesson');
const cardDetails = document.getElementById('cardDetails');
const cardResponse = document.getElementById('cardResponse');
const cardVideoContainer = document.getElementById('cardVideoContainer');
const cardVideo = document.getElementById('cardVideo');
const counterEl = document.getElementById('counter');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const randomBtn = document.getElementById('randomBtn');
const resetSrsBtn = document.getElementById('resetSrsBtn');
const searchInput = document.getElementById('searchInput');

const btnAgain = document.getElementById('btnAgain');
const btnHard = document.getElementById('btnHard');
const btnEasy = document.getElementById('btnEasy');

// Gestionnaire du stockage local (localStorage pour la répétition espacée)
function getSRSData() {
  return JSON.parse(localStorage.getItem('srs_capes_maths') || '{}');
}

function saveSRSData(data) {
  localStorage.setItem('srs_capes_maths', JSON.stringify(data));
}

// Chargement du CSV depuis Google Sheets
Papa.parse(SHEET_URL, {
  download: true,
  header: false,
  complete: function(results) {
    const rows = results.data;
    if (!rows || rows.length <= 1) {
      loadingEl.textContent = "Aucune donnée trouvée dans le tableau.";
      return;
    }

    const srsData = getSRSData();

    // Lecture des colonnes : A=Question, B=Leçon, C=Réponse, D=Statut, E=Vidéo
    allCards = rows.slice(1).map(row => {
      const question = row[0] ? row[0].trim() : '';
      const cardSRS = srsData[question] || { interval: 0, nextReview: 0, repetitions: 0, easeFactor: 2.5 };

      return {
        q: question,
        lecon: row[1] ? row[1].trim() : 'Non spécifiée',
        r: row[2] ? row[2].trim() : 'Pas de réponse renseignée.',
        statut: row[3] ? row[3].trim().toUpperCase() : '',
        video: row[4] ? row[4].trim() : '',
        interval: cardSRS.interval,
        nextReview: cardSRS.nextReview,
        repetitions: cardSRS.repetitions,
        easeFactor: cardSRS.easeFactor
      };
    }).filter(card => 
      card.q.length > 0 && 
      card.q !== "Questions" && 
      card.statut === "OK"
    );

    if (allCards.length === 0) {
      loadingEl.textContent = "Aucune carte validée avec 'OK' pour le moment.";
      return;
    }

    // Tri prioritaire SRS : cartes à réviser en premier
    allCards.sort((a, b) => a.nextReview - b.nextReview);

    filteredCards = [...allCards];
    loadingEl.classList.add('hidden');
    containerEl.classList.remove('hidden');
    showCard(0);
  },
  error: function(err) {
    console.error(err);
    loadingEl.innerHTML = "⚠️ Impossible d'accéder au tableau Google Sheet.";
  }
});

function showCard(index) {
  if (filteredCards.length === 0) {
    cardQuestion.textContent = "Aucune carte ne correspond à la recherche.";
    cardResponse.textContent = "";
    cardLesson.textContent = "Leçon --";
    cardDetails.classList.add('hidden');
    counterEl.textContent = "0 / 0";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  cardDetails.classList.remove('hidden');
  cardDetails.removeAttribute('open');

  currentIndex = index;
  const card = filteredCards[currentIndex];

  cardQuestion.textContent = card.q;
  cardLesson.textContent = `Leçon : ${card.lecon}`;
  cardResponse.innerHTML = `<p>${card.r}</p>`;

  if (card.video && card.video.startsWith('http')) {
    cardVideo.href = card.video;
    cardVideoContainer.classList.remove('hidden');
  } else {
    cardVideoContainer.classList.add('hidden');
  }

  counterEl.textContent = `Carte ${currentIndex + 1} / ${filteredCards.length}`;
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === filteredCards.length - 1;
}

// Algorithme de Répétition Espacée (SuperMemo-2 simplifié)
function rateCard(quality) {
  if (filteredCards.length === 0) return;

  const card = filteredCards[currentIndex];
  const srsData = getSRSData();

  let interval = card.interval || 0;
  let repetitions = card.repetitions || 0;
  let easeFactor = card.easeFactor || 2.5;

  if (quality === 'again') {
    repetitions = 0;
    interval = 0; // À revoir dans la session courante / aujourd'hui
  } else if (quality === 'hard') {
    if (repetitions === 0) {
      interval = 1;
    } else {
      interval = Math.max(1, Math.round(interval * 1.2));
    }
    repetitions += 1;
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else if (quality === 'easy') {
    if (repetitions === 0) {
      interval = 3;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
    easeFactor += 0.1;
  }

  const nextReview = Date.now() + (interval * 24 * 60 * 60 * 1000);

  // Sauvegarde dans le localStorage
  srsData[card.q] = { interval, nextReview, repetitions, easeFactor };
  saveSRSData(srsData);

  // Mise à jour de l'objet local
  card.interval = interval;
  card.nextReview = nextReview;
  card.repetitions = repetitions;
  card.easeFactor = easeFactor;

  // Passage automatique à la carte suivante
  if (currentIndex < filteredCards.length - 1) {
    showCard(currentIndex + 1);
  } else {
    showCard(0);
  }
}

// Événements d'évaluation
btnAgain.addEventListener('click', () => rateCard('again'));
btnHard.addEventListener('click', () => rateCard('hard'));
btnEasy.addEventListener('click', () => rateCard('easy'));

// Événements de navigation
prevBtn.addEventListener('click', () => {
  if (currentIndex > 0) showCard(currentIndex - 1);
});

nextBtn.addEventListener('click', () => {
  if (currentIndex < filteredCards.length - 1) showCard(currentIndex + 1);
});

randomBtn.addEventListener('click', () => {
  if (filteredCards.length <= 1) return;
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * filteredCards.length);
  } while (newIndex === currentIndex);
  showCard(newIndex);
});

resetSrsBtn.addEventListener('click', () => {
  if (confirm("Réinitialiser tout l'historique de révision enregistrer sur cet appareil ?")) {
    localStorage.removeItem('srs_capes_maths');
    location.reload();
  }
});

// Barre de recherche
searchInput.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  filteredCards = allCards.filter(c =>
    c.q.toLowerCase().includes(q) ||
    c.r.toLowerCase().includes(q) ||
    c.lecon.toLowerCase().includes(q)
  );
  showCard(0);
});

// Raccourcis clavier
document.addEventListener('keydown', (e) => {
  if (document.activeElement === searchInput) return;
  if (e.key === 'ArrowLeft' && !prevBtn.disabled) showCard(currentIndex - 1);
  if (e.key === 'ArrowRight' && !nextBtn.disabled) showCard(currentIndex + 1);
});
