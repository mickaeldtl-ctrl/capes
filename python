import os
import pandas as pd

# 1. Remplacez cet ID par l'ID de votre Google Sheet
SPREADSHEET_ID = "VOTRE_SPREADSHEET_ID"

# URL d'exportation directe en CSV du Google Sheet
csv_url = f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/export?format=csv"

print("Téléchargement du Google Sheet...")
df = pd.read_csv(csv_url)

# Nettoyage des colonnes (adaptez si les noms de colonnes changent dans Sheets)
df['Questions'] = df['Questions'].fillna('')
df['Réponse'] = df['Réponse'].fillna('Non spécifié')
df['Leçon(s)'] = df['Leçon(s)'].fillna('Autres')
df['Aide vidéo'] = df['Aide vidéo'].fillna('')

# 2. Export CSV pour Anki
os.makedirs('data', exist_ok=True)
anki_df = pd.DataFrame()
anki_df['Question'] = df['Questions']
anki_df['Reponse'] = df.apply(
    lambda r: f"{r['Réponse']}" + (f"<br><a href='{r['Aide vidéo']}'>Vidéo</a>" if r['Aide vidéo'] else ""), 
    axis=1
)
anki_df['Tags'] = df['Leçon(s)'].apply(lambda l: f"Leçon_{str(l).replace(' ', '_')}")
anki_df.to_csv('data/flashcards_anki.csv', index=False, sep=';', encoding='utf-8-sig')

# 3. Export Markdown par Leçon
os.makedirs('lecons', exist_ok=True)
grouped = df.groupby('Leçon(s)')

for lecon, group in grouped:
    clean_lecon_name = str(lecon).replace('/', '_').replace(' ', '_')
    filename = f"lecons/lecon_{clean_lecon_name}.md"
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"# 📚 Leçon : {lecon}\n\n")
        for idx, row in group.iterrows():
            if not row['Questions']:
                continue
            f.write(f"### ❓ {row['Questions']}\n")
            f.write("<details>\n<summary><b>👉 Afficher la réponse / preuve</b></summary>\n\n")
            f.write(f"- **Démonstration / Réponse :** {row['Réponse']}\n")
            if row['Aide vidéo']:
                f.write(f"- 🎬 **Aide vidéo :** [{row['Aide vidéo']}]({row['Aide vidéo']})\n")
            f.write("\n</details>\n\n---\n\n")

print("Mise à jour des flashcards terminée avec succès !")
