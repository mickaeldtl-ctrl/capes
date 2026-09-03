const SPREADSHEET_ID = "1Z2hVDXoz7qH7f0SEGlHhmLc7YU53FmR9CxgCCu9Su5o";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`;

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
  .then(res => {
    if (!res.ok) throw new Error("Erreur de chargement");
    return res.text();
  })
  .then(csvText => {
    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) {
      loadingEl.textContent = "Aucune donnée trouvée dans le Google Sheet.";
      return;
    }

    // Parser CSV
    allCards = lines.slice(1).map(line => {
      const cols = line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
      return {
        q: cols[0] ? cols[0].replace(/^"|"$/g, '').trim() : '',
        lecon: cols[1] ? cols[1].replace(/^"|"$/g, '').trim() : '',
        r: cols[2] ? cols[2].replace(/^"|"$/g, '').trim() : '',
        video: cols[4] ? cols[4].replace(/^"|"$/g, '').trim() : ''
      };
    }).filter(c => c.q.length > 0);

    filteredCards = [...allCards];
    loadingEl.classList.add('hidden');
    containerEl.classList.remove('hidden');
    
    showCard(0);
  })
  .catch(err => {
    console.error(err);
    loadingEl.innerHTML = "⚠️ Impossible de charger les cartes.<br>Vérifiez le partage du Google Sheet ('Tous les utilisateurs avec le lien').";
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
  cardDetails.removeAttribute('open'); // Referme le détail quand on change de carte

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

// Navigation au clavier (Flèches Gauche / Droite)
document.addEventListener('keydown', (e) => {
  if (document.activeElement === searchInput) return; // Ne pas interférer avec la saisie de texte
  if (e.key === 'ArrowLeft' && !prevBtn.disabled) {
    showCard(currentIndex - 1);
  } else if (e.key === 'ArrowRight' && !nextBtn.disabled) {
    showCard(currentIndex + 1);
  }
});
