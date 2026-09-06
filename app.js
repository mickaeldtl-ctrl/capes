const SPREADSHEET_ID = "1Z2hVDXoz7qH7f0SEGlHhmLc7YU53FmR9CxgCCu9Su5o";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`;

let allCards = [];
let filteredCards = [];
let currentIndex = 0;

const loadingEl = document.getElementById('loading');
const containerEl = document.getElementById('flashcardContainer');
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

Papa.parse(SHEET_URL, {
  download: true,
  header: false,
  complete: function(results) {
    const rows = results.data;
    if (!rows || rows.length <= 1) {
      loadingEl.textContent = "Aucune donnée trouvée dans le tableau.";
      return;
    }

    // Filtre : Ne conserve que les lignes où la colonne D (index 3) vaut "OK"
    allCards = rows.slice(1).map(row => ({
      q: row[0] ? row[0].trim() : '',
      lecon: row[1] ? row[1].trim() : 'Non spécifiée',
      r: row[2] ? row[2].trim() : 'Pas de réponse renseignée.',
      statut: row[3] ? row[3].trim().toUpperCase() : '', // Colonne D (Statut)
      video: row[4] ? row[4].trim() : ''
    })).filter(card => 
      card.q.length > 0 && 
      card.q !== "Questions" && 
      card.statut === "OK"
    );

    if (allCards.length === 0) {
      loadingEl.textContent = "Aucune carte validée avec 'OK' pour le moment.";
      return;
    }

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
  cardResponse.innerHTML = `
    <p>${card.r}</p>
    <br>
    <p>📌 <strong>Numéro de Leçon :</strong> ${card.lecon}</p>
  `;

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

searchInput.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  filteredCards = allCards.filter(c =>
    c.q.toLowerCase().includes(q) ||
    c.r.toLowerCase().includes(q) ||
    c.lecon.toLowerCase().includes(q)
  );
  showCard(0);
});

document.addEventListener('keydown', (e) => {
  if (document.activeElement === searchInput) return;
  if (e.key === 'ArrowLeft' && !prevBtn.disabled) showCard(currentIndex - 1);
  if (e.key === 'ArrowRight' && !nextBtn.disabled) showCard(currentIndex + 1);
});
