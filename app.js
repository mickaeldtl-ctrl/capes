// 1. Mets l'ID de ton Google Sheet ici
const SPREADSHEET_ID = "1Z2hVDXoz7qH7f0SEGlHhmLc7YU53FmR9CxgCCu9Su5o";

// URL d'export CSV direct depuis Google Sheets
const SHEET_URL = `https://docs.google.com/spreadsheets/d/1Z2hVDXoz7qH7f0SEGlHhmLc7YU53FmR9CxgCCu9Su5o/edit?gid=0#gid=0`;

let allCards = [];

// Téléchargement direct des données
fetch(SHEET_URL)
  .then(response => {
    if (!response.ok) throw new Error("Accès au Google Sheet impossible");
    return response.text();
  })
  .then(csvText => {
    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) {
      document.getElementById('cardsContainer').innerHTML = "<p class='loading'>Aucune carte trouvée dans le tableau.</p>";
      return;
    }

    // Découpage du CSV
    allCards = lines.slice(1).map(line => {
      const cols = line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
      return {
        q: cols[0] ? cols[0].replace(/^"|"$/g, '').trim() : '',
        lecon: cols[1] ? cols[1].replace(/^"|"$/g, '').trim() : '',
        r: cols[2] ? cols[2].replace(/^"|"$/g, '').trim() : '',
        video: cols[4] ? cols[4].replace(/^"|"$/g, '').trim() : ''
      };
    }).filter(card => card.q.length > 0);

    renderCards(allCards);
  })
  .catch(err => {
    console.error(err);
    document.getElementById('cardsContainer').innerHTML = 
      "<p class='error-msg'>⚠️ Impossible de charger le Google Sheet.<br>Vérifiez que le partage du Google Sheet est bien réglé sur <strong>'Tous les utilisateurs disposant du lien'</strong>.</p>";
  });

function renderCards(cards) {
  const container = document.getElementById('cardsContainer');
  if (cards.length === 0) {
    container.innerHTML = "<p class='loading'>Aucune carte ne correspond à votre recherche.</p>";
    return;
  }

  container.innerHTML = cards.map(c => `
    <article class="card">
      <span class="badge">Leçon ${c.lecon || 'Générale'}</span>
      <div class="question">❓ ${c.q}</div>
      <details>
        <summary>👉 Afficher la réponse / preuve</summary>
        <div class="response-content">
          <p><strong>Preuve / Démonstration :</strong> ${c.r}</p>
          ${c.video ? `<a class="video-link" href="${c.video}" target="_blank">🎬 Aide vidéo</a>` : ''}
        </div>
      </details>
    </article>
  `).join('');
}

// Filtre de recherche en temps réel
document.getElementById('searchInput').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = allCards.filter(c => 
    c.q.toLowerCase().includes(query) || 
    c.r.toLowerCase().includes(query) || 
    c.lecon.toLowerCase().includes(query)
  );
  renderCards(filtered);
});
