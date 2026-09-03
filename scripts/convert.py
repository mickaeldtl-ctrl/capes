import os
import pandas as pd

# ------------------------------------------------------------------------------
# 1. Identifiant de ton Google Sheet
# Ex: https://docs.google.com/spreadsheets/d/1ABC123xyz.../edit#gid=0
# L'ID est la partie : 1ABC123xyz...
# ------------------------------------------------------------------------------
SPREADSHEET_ID = "TON_ID_GOOGLE_SHEET"

# URL d'exportation directe en CSV
csv_url = f"https://docs.google.com/spreadsheets/d/{1Z2hVDXoz7qH7f0SEGlHhmLc7YU53FmR9CxgCCu9Su5o}/export?format=csv"

print("Téléchargement du Google Sheet...")
try:
    df = pd.read_csv(csv_url)
except Exception as e:
    print(f"Erreur lors du téléchargement : {e}")
    exit(1)

# Nettoyage et gestion des valeurs vides
df['Questions'] = df['Questions'].fillna('')
df['Réponse'] = df['Réponse'].fillna('Non spécifié')
df['Leçon(s)'] = df['Leçon(s)'].fillna('Autres')
if 'Aide vidéo' in df.columns:
    df['Aide vidéo'] = df['Aide vidéo'].fillna('')
else:
    df['Aide vidéo'] = ''

# ------------------------------------------------------------------------------
# 2. Export CSV pour Anki (dans le dossier /data)
# ------------------------------------------------------------------------------
os.makedirs('data', exist_ok=True)
anki_df = pd.DataFrame()
anki_df['Question'] = df['Questions']
anki_df['Reponse'] = df.apply(
    lambda r: f"{r['Réponse']}" + (f"<br><a href='{r['Aide vidéo']}'>Vidéo</a>" if r['Aide vidéo'] else ""), 
    axis=1
)
anki_df['Tags'] = df['Leçon(s)'].apply(lambda l: f"Leçon_{str(l).replace(' ', '_')}")
anki_df.to_csv('data/flashcards_anki.csv', index=False, sep=';', encoding='utf-8-sig')

# ------------------------------------------------------------------------------
# 3. Export Fichiers Markdown pour le site web Docsify (dans le dossier /lecons)
# ------------------------------------------------------------------------------
os.makedirs('lecons', exist_ok=True)
grouped = df.groupby('Leçon(s)')

sidebar_links = ["* [🏠 Accueil](README.md)\n\n* **📚 Leçons**\n"]

for lecon, group in grouped:
    clean_lecon_name = str(lecon).replace('/', '_').replace(' ', '_')
    filename = f"lecons/lecon_{clean_lecon_name}.md"
    
    # Ajout au menu de navigation (_sidebar.md)
    sidebar_links.append(f"  * [Leçon {lecon}]({filename})")
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"# 📚 Leçon : {lecon}\n\n")
        for idx, row in group.iterrows():
            if not str(row['Questions']).strip():
                continue
            f.write(f"### ❓ {row['Questions']}\n")
            f.write("<details>\n<summary><b>👉 Afficher la réponse / preuve</b></summary>\n\n")
            f.write(f"- **Démonstration / Réponse :** {row['Réponse']}\n")
            if row['Aide vidéo']:
                f.write(f"- 🎬 **Aide vidéo :** [{row['Aide vidéo']}]({row['Aide vidéo']})\n")
            f.write("\n</details>\n\n---\n\n")

# Mise à jour automatique du menu latéral _sidebar.md pour Docsify
with open('_sidebar.md', 'w', encoding='utf-8') as f:
    f.write("\n".join(sidebar_links))

print("Conversion et mise à jour du site terminées avec succès !")
