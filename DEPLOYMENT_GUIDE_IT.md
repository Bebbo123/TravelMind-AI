# 📱 Guida al Deployment Web & Utilizzo Offline (PWA) — TravelMind AI

Questa guida spiega passo-passo come pubblicare **TravelMind AI** sul Web in modo che tu possa aprirla e utilizzarla ovunque nel mondo durante i tuoi viaggi da smartphone, tablet o laptop, anche in **modalità Offline**.

---

## 🌐 1. Pubblicare il Frontend su Vercel (Gratuito)

Per rendere l'app raggiungibile da qualsiasi browser (es. `https://la-tua-app.vercel.app`):

1. **Crea un account o accedi a [Vercel](https://vercel.com/)** (puoi accedere con GitHub o email).
2. **Carica il codice su GitHub**:
   - Crea un nuovo repository su GitHub.
   - Esegui i comandi nel terminale della tua macchina:
     ```bash
     git init
     git add .
     git commit -m "TravelMind AI - Versione Italiana PWA"
     git remote add origin https://github.com/TUO_UTENTE/travelmind-ai.git
     git push -u origin main
     ```
3. **Importa il progetto in Vercel**:
   - Clicca su **"Add New Project"** -> seleziona la cartella `frontend`.
   - Vercel rileverà automaticamente Next.js.
   - Nella sezione **Environment Variables**, aggiungi:
     - `NEXT_PUBLIC_BACKEND_URL`: URL del tuo backend (es. su Render/Railway).
     - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: La tua chiave Google Maps.
   - Clicca **Deploy**. In circa 1 minuto l'app sarà pubblicata e raggiungibile da qualsiasi browser!

---

## 🛜 2. Pubblicare il Backend su Render (Gratuito)

Per far funzionare le chiamate AI (Gemini) e il database remoto:

1. Crea un account su [Render.com](https://render.com/).
2. Clicca su **"New +" -> "Web Service"**.
3. Collega il tuo repository GitHub e seleziona la cartella `backend`.
4. Configura le impostazioni:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
5. Aggiungi la variabile d'ambiente `GEMINI_API_KEY` con la tua API Key di Google Gemini.
6. Salva e fai il deploy. Copia l'URL generato da Render e inseriscilo in Vercel come `NEXT_PUBLIC_BACKEND_URL`.

---

## 📲 3. Come installare l'App sullo Smartphone per usarla in Viaggio

TravelMind AI è una **PWA (Progressive Web App)**. Non serve scaricarla da App Store o Google Play Store:

### 🍎 Su iPhone / iPad (iOS):
1. Apri **Safari** e visita l'URL della tua app (es. `https://la-tua-app.vercel.app`).
2. Tocca l'icona **Condividi** (il quadrato con la freccia verso l'alto in basso al centro).
3. Scorri e seleziona **"Aggiungi alla schermata Home"**.
4. Conferma con **"Aggiungi"**. L'app apparirà come un'icona nativa sulla tua schermata home!

### 🤖 Su Android (Chrome / Edge / Firefox):
1. Apri **Chrome** e naviga sull'URL della tua app.
2. Tocca il menu con i **tre punti in alto a destra**.
3. Seleziona **"Installa applicazione"** oppure **"Aggiungi a schermata Home"**.
4. L'app si installerà come applicazione indipendente sul tuo dispositivo.

---

## ✈️ 4. Come funziona la Modalità Offline durante il Viaggio

Quando sei in aereo, in treno Shinkansen senza Wi-Fi o in zone senza copertura dati:

- **Cache Automatica**: Il Service Worker salva automaticamente l'interfaccia, le mappe recenti e i tuoi dati sul dispositivo durante il primo utilizzo online.
- **Consultazione Senza Connessione**: Aprendo l'icona dell'app dalla Home Screen senza internet, l'app si aprirà istantaneamente mostrando il badge **"Offline • Modalità Viaggio Attiva"**.
- **Sincronizzazione**: Appena ritroverai la connessione (es. Wi-Fi dell'hotel o SIM dati giapponese/internazionale), l'app si sincronizzerà automaticamente con i server cloud.

---
 Buon Viaggio con **TravelMind AI**! 🚀🇯🇵
