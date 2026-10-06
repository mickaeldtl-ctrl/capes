const SPREADSHEET_ID = "1Z2hVDXoz7qH7f0SEGlHhmLc7YU53FmR9CxgCCu9Su5o";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv`;

// Dictionnaire officiel Leçons & Thèmes du CAPES
const LESSONS_MAP = {
  1: { title: "1. Exemples de dénombrements dans différentes situations.", theme: "Dénombrements, proba, stats" },
  2: { title: "2. Expérience aléatoire, probabilité, probabilité conditionnelle.", theme: "Dénombrements, proba, stats" },
  3: { title: "3. Variables aléatoires discrètes.", theme: "Dénombrements, proba, stats" },
  4: { title: "4. Variables aléatoires réelles à densité.", theme: "Dénombrements, proba, stats" },
  5: { title: "5. Statistique à une ou deux variables, représentation et analyse de données.", theme: "Dénombrements, proba, stats" },
  6: { title: "6. Multiples et diviseurs dans N, nombres premiers.", theme: "Arithmétique" },
  7: { title: "7. PGCD dans Z.", theme: "Arithmétique" },
  8: { title: "8. Congruences dans Z.", theme: "Arithmétique" },
  9: { title: "9. Différentes écritures d’un nombre complexe.", theme: "Nombres complexes" },
  10: { title: "10. Utilisation des nombres complexes en géométrie.", theme: "Nombres complexes" },
  11: { title: "11. Trigonométrie.", theme: "Géométrie" },
  12: { title: "12. Repérage dans le plan, dans l’espace, sur une sphère.", theme: "Géométrie" },
  13: { title: "13. Droites et plans dans l’espace.", theme: "Géométrie" },
  14: { title: "14. Transformations du plan. Frises et pavages.", theme: "Géométrie" },
  15: { title: "15. Relations métriques et angulaires dans le triangle.", theme: "Géométrie" },
  16: { title: "16. Solides de l’espace : représentations et calculs de volumes.", theme: "Géométrie" },
  17: { title: "17. Périmètres, aires, volumes.", theme: "Géométrie" },
  18: { title: "18. Exemples de résolution de problèmes de géométrie plane à l’aide des vecteurs.", theme: "Géométrie" },
  19: { title: "19. Produit scalaire dans le plan.", theme: "Géométrie" },
  20: { title: "20. Applications de la notion de proportionnalité à la géométrie.", theme: "Proportionnalité et pourcentages" },
  21: { title: "21. Problèmes de constructions géométriques.", theme: "Géométrie" },
  22: { title: "22. Exemples de problèmes d’alignement, de parallélisme.", theme: "Géométrie" },
  23: { title: "23. Exemples de problèmes d’intersection en géométrie.", theme: "Géométrie" },
  24: { title: "24. Pourcentages et taux d’évolution.", theme: "Proportionnalité et pourcentages" },
  25: { title: "25. Problèmes conduisant à une modélisation par des équations ou des inéquations.", theme: "Équations" },
  26: { title: "26. Problèmes conduisant à une modélisation par des graphes, par des matrices.", theme: "Graphes et matrices" },
  27: { title: "27. Fonctions polynômes du second degré. Équations et inéquations du second degré.", theme: "Équations" },
  28: { title: "28. Suites numériques. Limites.", theme: "Analyse" },
  29: { title: "29. Suites définies par récurrence un+1 = f(un).", theme: "Analyse" },
  30: { title: "30. Détermination de limites de fonctions réelles de variable réelle.", theme: "Analyse" },
  31: { title: "31. Théorème des valeurs intermédiaires.", theme: "Analyse" },
  32: { title: "32. Nombre dérivé. Fonction dérivée.", theme: "Analyse" },
  33: { title: "33. Fonctions exponentielles.", theme: "Analyse" },
  34: { title: "34. Fonctions logarithmes.", theme: "Analyse" },
  35: { title: "35. Fonctions convexes.", theme: "Analyse" },
  36: { title: "36. Primitives, équations différentielles.", theme: "Analyse" },
  37: { title: "37. Intégrales, primitives.", theme: "Analyse" },
  38: { title: "38. Exemples de calculs d’intégrales (méthodes exactes, méthodes approchées).", theme: "Analyse" },
  39: { title: "39. Exemples de résolution d’équations (méthodes exactes, méthodes approchées).", theme: "Équations" },
  40: { title: "40. Exemples de modèles d’évolution.", theme: "Analyse" },
  41: { title: "41. Problèmes dont la résolution fait intervenir un algorithme.", theme: "Méthodologie & Modélisation" },
  42: { title: "42. Différents types de raisonnement en mathématiques.", theme: "Méthodologie & Modélisation" },
  43: { title: "43. Exemples d’approche historique de notions mathématiques enseignées au collège, au lycée.", theme: "Méthodologie & Modélisation" },
  44: { title: "44. Applications des mathématiques à d’autres disciplines.", theme: "Méthodologie & Modélisation" }
};

let allCards = [];
let currentDeck = [];
let currentIndex = 0;
let activeBox = 1;
let selectedTheme = "ALL";

// Éléments du DOM
const loadingEl = document.getElementById('loading');
const appEl = document.getElementById('flashcardApp');
const cardQuestion = document.getElementById('cardQuestion');
const cardLesson = document.getElementById('cardLesson');
const cardTheme = document.getElementById('cardTheme');
const answerSection = document.getElementById('answerSection');
const cardResponse = document.getElementById('cardResponse');
const cardVideoContainer = document.getElementById('cardVideoContainer');
const cardVideo = document.getElementById('cardVideo');
const revealContainer = document.getElementById('revealContainer');
const revealBtn = document.getElementById('revealBtn');
const srsPanel = document.getElementById('srsPanel');
const counterEl = document.getElementById('counter');
const resetSrsBtn = document.getElementById('resetSrsBtn');
const themeFilter = document.getElementById('themeFilter');
const toast = document.getElementById('toast');

const btnAgain = document.getElementById('btnAgain');
const btnHard = document.getElementById('btnHard');
const btnEasy = document.getElementById('btnEasy');

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
    console.error("Erreur de sauvegarde :", e);
  }
}

function sanitizeText(val) {
  if (!val) return '';
  return String(val).trim().replace(/^"|"$/g, '');
}

// Rendu LaTeX via KaTeX
function renderMath(element) {
  if (window.renderMathInElement && element) {
    renderMathInElement(element, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false},
        {left: '\\(', right: '\\)', display: false},
        {left: '\\[', right: '\\]', display: true}
      ],
      throwOnError: false
    });
  }
}

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

      const leitnerData = getLeitnerData();

      allCards = rows.slice(1).map((row) => {
        if (!Array.isArray(row) || row.length < 1) return null;

        const question = sanitizeText(row[0]);
        const leconRaw = sanitizeText(row[1]);
        const reponse = sanitizeText(row[2]) || 'Pas de réponse.';
        const statut = sanitizeText(row[3]).toUpperCase();
        const video = sanitizeText(row[4]);

        if (!question || question.toLowerCase() === "questions") return null;

        // Extraction des numéros de leçons
        const matches = leconRaw.match(/\d+/g);
        const leconNums = matches ? matches.map(n => parseInt(n, 10)) : [];

        let leconTitles = [];
        let cardThemes = new Set();

        leconNums.forEach(num => {
          if (LESSONS_MAP[num]) {
            leconTitles.push(LESSONS_MAP[num].title);
            cardThemes.add(LESSONS_MAP[num].theme);
          }
        });

        const leconTitle = leconTitles.length > 0 ? leconTitles.join(" | ") : (leconRaw || 'Leçon --');
        const themeArray = Array.from(cardThemes);
        const themeName = themeArray.length > 0 ? themeArray.join(" / ") : "Général";

        const box = leitnerData[question] || 1;

        return {
          q: question,
          leconNums: leconNums,
          lecon: leconTitle,
          themeArray: themeArray,
          theme: themeName,
          r: reponse,
          statut: statut,
          video: video,
          box: box
        };
      }).filter(card => 
        card !== null && 
        card.q.length > 0 && 
        card.statut === "OK" // Filtrage ultra-strict sur OK
      );

      if (loadingEl) loadingEl.style.display = 'none';
      appEl?.classList.remove('hidden');

      updateBoxCounters();
      filterAndSelectDeck();

    } catch (err) {
      showError("Erreur : " + err.message);
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

function updateBoxCounters() {
  const counts = { 1: 0, 2: 0, 3: 0 };
  
  const filtered = selectedTheme === "ALL" 
    ? allCards 
    : allCards.filter(c => Array.isArray(c.themeArray) && c.themeArray.includes(selectedTheme));

  filtered.forEach(c => { 
    if (counts[c.box] !== undefined) counts[c.box]++; 
  });

  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`box-count-${i}`);
    if (el) el.textContent = counts[i];
  }
}

function filterAndSelectDeck() {
  currentDeck = allCards.filter(c => {
    const matchBox = c.box === activeBox;
    const matchTheme = (selectedTheme === "ALL") || 
                       (Array.isArray(c.themeArray) && c.themeArray.includes(selectedTheme));
    return matchBox && matchTheme;
  });
  showCard(0);
}

function selectBox(boxNumber) {
  activeBox = boxNumber;
  document.querySelectorAll('.box-tab').forEach(tab => tab.classList.remove('active'));
  document.getElementById(`box-tab-${boxNumber}`)?.classList.add('active');
  filterAndSelectDeck();
}

function onThemeChange() {
  selectedTheme = themeFilter.value;
  updateBoxCounters();
  filterAndSelectDeck();
}

function shuffleDeck() {
  if (currentDeck.length <= 1) return;  
  for (let i = currentDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [currentDeck[i], currentDeck[j]] = [currentDeck[j], currentDeck[i]];
  }  
  showToast("🔀 Paquet mélangé !");
  showCard(0);
}

function showCard(index) {
  if (currentDeck.length === 0) {
    if (cardQuestion) cardQuestion.textContent = `Aucune carte disponible.`;
    if (cardResponse) cardResponse.textContent = "";
    if (cardLesson) cardLesson.textContent = "Leçon --";
    if (cardTheme) cardTheme.textContent = "Thème --";
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

  if (cardQuestion) {
    cardQuestion.textContent = card.q;
    renderMath(cardQuestion);
  }

  if (cardLesson) cardLesson.textContent = card.lecon;
  if (cardTheme) cardTheme.textContent = card.theme;

  if (cardResponse) {
    cardResponse.innerHTML = card.r;
    renderMath(cardResponse);
  }

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
    card.box = 1;
    showToast("🔴 Retour en Boîte 1");
  } else if (quality === 'hard') {
    showToast(`🟠 Maintien en Boîte ${card.box}`);
  } else if (quality === 'easy') {
    card.box = Math.min(3, card.box + 1);
    showToast(`🟢 Passage en Boîte ${card.box}`);
  }

  leitnerData[card.q] = card.box;
  saveLeitnerData(leitnerData);

  updateBoxCounters();

  if (card.box !== oldBox) {
    currentDeck.splice(currentIndex, 1);
    if (currentIndex >= currentDeck.length) {
      currentIndex = 0;
    }
    showCard(currentIndex);
  } else {
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
  if (confirm("Réinitialiser toutes les cartes et les remettre en Boîte 1 ?")) {
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
