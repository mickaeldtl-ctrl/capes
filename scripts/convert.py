import os
import pandas as pd

# Remplace par l'ID de ton Google Sheet
SPREADSHEET_ID = "1Z2hVDXoz7qH7f0SEGlHhmLc7YU53FmR9CxgCCu9Su5o"

csv_url = f"https://docs.google.com/spreadsheets/d/{1Z2hVDXoz7qH7f0SEGlHhmLc7YU53FmR9CxgCCu9Su5o}/export?format=csv"

print("Téléchargement des données...")
df = pd.read_csv(csv_url)

# Nettoyage des données
df['Questions'] = df['Questions'].fillna('')
df['Réponse'] = df['Réponse'].fillna('Non spécifié')
df['Leçon(s)'] = df['Leçon(s)'].fillna('Autres')
if 'Aide vidéo' in df.columns:
    df['Aide vidéo'] = df['Aide vidéo'].fillna('')
else:
    df['Aide vidéo'] = ''

# Export unique vers data/flashcards.csv
os.makedirs('data', exist_ok=True)
df.to_csv('data/flashcards.csv', index=False, encoding='utf-8-sig')

print("Fichier data/flashcards.csv généré avec succès !")
