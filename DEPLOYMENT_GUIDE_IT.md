# 📱 Guida al Deployment Web & Utilizzo Offline (PWA) — TravelMind AI

Questa guida spiega passo-passo come pubblicare **TravelMind AI** sul Web in modo che tu possa aprirla e utilizzarla ovunque nel mondo durante i tuoi viaggi da smartphone, tablet o laptop, anche in **modalità Offline**.

---

## 🌐 1. Pubblicare il Frontend su Vercel (Gratuito & Senza Chiavi API)

> [!NOTE]
> **Nessuna Chiave Google Maps Richiesta!**
> L'app utilizza ora **OpenStreetMap e Leaflet**, 100% gratuiti e pronti all'uso senza carte di credito o chiavi API.

Per rendere l'app raggiungibile da qualsiasi browser (es. `https://la-tua-app.vercel.app`):

1. **Accedi a [Vercel](https://vercel.com/)** con il tuo account GitHub.
2. **Importa il progetto**:
   - Clicca su **"Add New Project"** e seleziona il tuo repository `TravelMind-AI`.
   - Seleziona la cartella `frontend`.
3. **Environment Variables**:
   - `NEXT_PUBLIC_BACKEND_URL`: Inserisci l'URL del tuo backend Render (oppure lascia vuoto se stai testando solo il frontend).
4. Clicca **Deploy**. In circa 1 minuto l'app sarà pubblicata e raggiungibile su internet!

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

## 🚇 3. Mappe & Mezzi Pubblici Integrati

L'applicazione include direttamente:
- **Mappa Interattiva OpenStreetMap**: Esplora Tokyo, Kyoto, Osaka, Monte Fuji e visualizza i principali nodi ferroviari e stazioni.
- **Calcolatore Mezzi Pubblici**: Cerca al volo orari, costi e coincidenze per Shinkansen, metropolitane, treni JR e bus locali.

---

## 📲 4. Come installare l'App sullo Smartphone per usarla in Viaggio

TravelMind AI è una **PWA (Progressive Web App)**. Non serve scaricarla da App Store o Google Play Store:

### 🍎 Su iPhone / iPad (iOS):
1. Apri **Safari** e visita l'URL della tua app Vercel.
2. Tocca l'icona **Condividi** (il quadrato con la freccia verso l'alto in basso al centro).
3. Scorri e seleziona **"Aggiungi alla schermata Home"**.
4. Conferma con **"Aggiungi"**.

### 🤖 Su Android (Chrome / Edge / Firefox):
1. Apri **Chrome** e naviga sull'URL della tua app.
2. Tocca il menu con i **tre punti in alto a destra**.
3. Seleziona **"Installa applicazione"** oppure **"Aggiungi a schermata Home"**.

---

## ✈️ 5. Modalità Offline durante il Viaggio

- **Cache Automatica**: Il Service Worker salvaguarda l'interfaccia, le mappe e i tuoi dati sul dispositivo.
- **Funzionamento Senza Internet**: Aprendo l'app da Home Screen in aereo o senza dati, vedrai il badge **"Offline • Modalità Viaggio Attiva"** ed avrai accesso a tutti i tuoi dati.

---
 Buon Viaggio con **TravelMind AI**! 🚀🇯🇵
