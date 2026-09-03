const SPREADSHEET_ID = "1Z2hVDXoz7qH7f0SEGlHhmLc7YU53FmR9CxgCCu9Su5o";

// Utilisation de l'API Viz de Google Sheets pour éviter les erreurs de formatage CSV
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json`;

let allCards = [];
let filteredCards = [];
let currentIndex = 0;

// Éléments du DOM
const loadingEl = document.getElementById('loading');
const containerEl = document.getElementById('flashcardContainer');
const cardLesson = document.getElementById('cardLesson');
const cardQuestion = document.getElementById('cardQuestion');
const cardDetails = document.getElementById('cardDetails');
const cardResponse = document.getElementById('cardResponse');
const cardVideoContainer = document.getElementById('cardVideoContainer');
const cardVideo = document.getElementById('cardVideo');
const counterEl = document.getElementById('counter');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const randomBtn = document.getElementById('randomBtn');
const searchInput = document.getElementById('searchInput');

// Téléchargement des données
fetch(SHEET_URL)
  .then(res => res.text())
  .then(text => {
    // Nettoyage de la réponse JSONP transmise par Google
    const jsonString = text.substring(47, text.length - 2);
    const data = JSON.parse(jsonString);
    const rows = data.table.rows;

    if (!rows || rows.length === 0) {
      loadingEl.textContent = "Aucune donnée trouvée dans le Google Sheet.";
      return;
    }

    // Extrait les colonnes du tableau
    allCards = rows.map(row => {
      const c = row.c;
      return {
        q: c[0] && c[0].v ? String(c[0].v).trim() : '',
        lecon: c[1] && c[1].v ? String(c[1].v).trim() : '',
        r: c[2] && c[2].v ? String(c[2].v).trim() : '',
        video: c[4] && c[4].v ? String(c[4].v).trim() : ''
      };
    }).filter(card => card.q.length > 0);

    if (allCards.length === 0) {
      loadingEl.textContent = "Aucune question valide trouvée.";
      return;
    }

    filteredCards = [...allCards];
    loadingEl.classList.add('hidden');
    containerEl.classList.remove('hidden');
    
    showCard(0);
  })
  .catch(err => {
    console.error(err);
    loadingEl.innerHTML = "⚠️ Impossible de charger les cartes.<br><br>Vérifiez les points suivants :<br>1. Le Google Sheet doit être en <strong>'Tous les utilisateurs disposant du lien'</strong>.<br>2. Allez dans Google Sheets > <strong>Fichier</strong> > <strong>Partager</strong> > <strong>Publier sur le Web</strong> puis cliquez sur <strong>Publier</strong>.";
  });

// Afficher une carte selon son index
function showCard(index) {
  if (filteredCards.length === 0) {
    cardQuestion.textContent = "Aucune carte ne correspond à votre recherche.";
    cardLesson.textContent = "Vide";
    cardResponse.textContent = "";
    cardDetails.classList.add('hidden');
    counterEl.textContent = "0 / 0";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  cardDetails.classList.remove('hidden');
  cardDetails.removeAttribute('open'); // Referme la réponse au changement de carte

  currentIndex = index;
  const card = filteredCards[currentIndex];

  cardLesson.textContent = `Leçon ${card.lecon || 'Générale'}`;
  cardQuestion.textContent = card.q;
  cardResponse.textContent = card.r || "Pas de réponse renseignée.";

  if (card.video) {
    cardVideo.href = card.video;
    cardVideoContainer.classList.remove('hidden');
  } else {
    cardVideoContainer.classList.add('hidden');
  }

  // Mise à jour compteur et boutons
  counterEl.textContent = `Carte ${currentIndex + 1} / ${filteredCards.length}`;
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === filteredCards.length - 1;
}

// Navigation
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

// Filtre de recherche
searchInput.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  filteredCards = allCards.filter(c =>
    c.q.toLowerCase().includes(q) ||
    c.r.toLowerCase().includes(q) ||
    c.lecon.toLowerCase().includes(q)
  );
  showCard(0);
});

// Navigation au clavier
document.addEventListener('keydown', (e) => {
  if (document.activeElement === searchInput) return;
  if (e.key === 'ArrowLeft' && !prevBtn.disabled) {
    showCard(currentIndex - 1);
  } else if (e.key === 'ArrowRight' && !nextBtn.disabled) {
    showCard(currentIndex + 1);
  }
});
