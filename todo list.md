# **📝 Master To-Do List: Magazzino "Caos Ordinato"**

Questa lista copre l'intero ciclo di sviluppo, dando priorità assoluta alla velocità d'uso ("Speed-First") e alla tolleranza agli errori.

## **🏗️ FASE 0: Infrastruttura & Setup (Fondamenta)**

L'obiettivo è avere un ambiente Docker stabile che supporti HTTPS (obbligatorio per le API Camera).

* \[ \] **Docker Setup**  
  * \[ \] Creare Dockerfile per Backend (Python/FastAPI).  
  * \[ \] Creare Dockerfile per Frontend (Node/React/Vite).  
  * \[ \] Configurare docker-compose.yml con volumi persistenti:  
    * \[ \] /data per il DB SQLite.  
    * \[ \] /uploads per le immagini (Full-res e Thumbnails).  
  * \[ \] **Configurare Reverse Proxy / HTTPS**:  
    * \[ \] Setup Nginx o Traefik (o certificati self-signed per dev) per garantire che l'app risponda su https://. *Critico per navigator.share e getUserMedia.*  
* \[ \] **Database (SQLite) Setup**  
  * \[ \] Inizializzare warehouse.db.  
  * \[ \] **Abilitare WAL Mode**: Assicurarsi che alla connessione venga eseguito PRAGMA journal\_mode=WAL; (per concorrenza multi-utente).  
  * \[ \] **Abilitare Foreign Keys**: PRAGMA foreign\_keys \= ON;.

## **🧠 FASE 1: Backend Core (FastAPI)**

* \[ \] **Database Schema (Models)**  
  * \[ \] Tabella locations: id, name, description, parent\_id (gerarchia), context\_photos (JSON), deleted\_at.  
  * \[ \] Tabella items: id, location\_id, photo\_path, thumbnail\_path, description (FTS indexed), status (AVAILABLE, IN\_HAND, LOST, LOANED), created\_at, deleted\_at.  
  * \[ \] Tabella adjacency (per Fase 2): box\_a\_id, box\_b\_id, weight, last\_seen.  
* \[ \] **Gestione Immagini (Performance)**  
  * \[ \] Implementare endpoint POST /upload.  
  * \[ \] **EXIF Rotation Fix**: Utilizzare libreria (es. Pillow ImageOps.exif\_transpose) per ruotare le foto verticali prima del salvataggio.  
  * \[ \] **Resize**: Ridimensionare originali a max 1200px lato lungo.  
  * \[ \] **Thumbnails**: Generare *sempre* una miniatura (max 300px webp/jpg) al salvataggio. Le API di lista devono restituire il path della thumbnail.  
* \[ \] **API Endpoints (CRUD Base)**  
  * \[ \] GET /locations: Includere conteggio items per location ("Bin Density").  
  * \[ \] POST /locations: Creazione nuova scatola.  
  * \[ \] GET /items: Supporto paginazione e filtri.  
  * \[ \] POST /items: Creazione item.  
  * \[ \] PATCH /items/{id}: Per spostamenti e "Soft Delete".  
* \[ \] **Ricerca Avanzata**  
  * \[ \] Abilitare e configurare **SQLite FTS5** (Full-Text Search) sulla colonna description degli items.  
  * \[ \] Endpoint GET /search?q=... che restituisce risultati rapidi con Location attuale.

## **🎨 FASE 2: Frontend Core (React \+ PWA)**

* \[ \] **Project Setup**  
  * \[ \] Inizializzare React con Vite e Tailwind CSS.  
  * \[ \] Configurare PWA (Manifest manifest.json, Service Workers) per installazione su Home Screen.  
  * \[ \] Configurare palette colori (Dark Mode default).  
* \[ \] **Gestione Stato & Offline**  
  * \[ \] Implementare "Upload Queue" (via Context o Redux \+ LocalStorage).  
  * \[ \] Gestire stato di rete: se offline, salvare in coda e mostrare indicatore giallo. Se online, svuotare coda.  
* \[ \] **Componenti UI Base**  
  * \[ \] Layout App (Mobile First): Header fisso, Content scrollabile, Bottom Navigation/Action Bar.  
  * \[ \] **Camera Component**: Wrapper per getUserMedia con gestione permessi e switch fotocamera (environment).

## **🚀 FASE 3: Feature "Giorno Zero" & Etichettatura**

* \[ \] **Deep Linking & Routing**  
  * \[ \] Gestire rotta /loc/:id.  
  * \[ \] Logica: All'apertura di /loc/100:  
    * \[ \] Se ID esiste: Impostare "Context" su Location 100 \-\> Aprire Camera Inserimento.  
    * \[ \] Se ID non esiste: Aprire Modal "Claiming" (Attiva Scatola) \-\> Crea Location \-\> Apri Camera.  
* \[ \] **Tools: Label Generator**  
  * \[ \] Pagina /tools.  
  * \[ \] Form: Range ID (da 100 a 200), Base URL.  
  * \[ \] **Export CSV**: Generare file scaricabile con colonne ID, Label, QR\_Url (formattato per software etichettatrici Brother/Dymo).

## **📸 FASE 4: Il Workflow di Inserimento ("The Loop")**

* \[ \] **Camera HUD (Heads-Up Display)**  
  * \[ \] Sovraimprimere il nome della Location corrente (es. "SCATOLA A1") al centro della vista fotocamera (opacity 50%, testo grande).  
  * \[ \] Tasto "Torcia" manuale.  
* \[ \] **Modulo "Ali-Hack" (Magic Search)**  
  * \[ \] Implementare tasto "Cerca su Cataloghi".  
  * \[ \] **Logica Clean Share**:  
    * \[ \] Prendere blob foto scattata.  
    * \[ \] Ridimensionare client-side (max 800px).  
    * \[ \] Invocare navigator.share({ files: \[file\] }) **senza** title o text (Cruciale per iOS\!).  
  * \[ \] **Auto-Paste**:  
    * \[ \] Listener su visibilitychange.  
    * \[ \] Al ritorno sull'app, leggere clipboard e pre-compilare campo descrizione (se permesso) o mostrare tasto "Incolla".  
* \[ \] **Optimistic Save (Fire & Forget)**  
  * \[ \] Al click su "Salva", resettare interfaccia istantaneamente per la foto successiva.  
  * \[ \] Gestire l'upload in background (mostrare solo piccolo spinner non bloccante in un angolo).

## **⚡ FASE 5: Gestione Caos & Movimenti**

* \[ \] **Pocket Logic (Tasca Digitale)**  
  * \[ \] Creare stato globale pockets (lista items ID).  
  * \[ \] UI: Footer persistente "Oggetti in mano" (se \> 0).  
  * \[ \] Azione **"PRENDO ✋"** (Scheda Item): Sposta item in status IN\_HAND, location\_id \= NULL.  
  * \[ \] Azione **"POSA 👇"** (Footer):  
    * \[ \] Apre Scanner QR.  
    * \[ \] Scansiona Location \-\> Update massivo di tutti gli item in tasca alla nuova Location.  
* \[ \] **Flash Move (Teletrasporto)**  
  * \[ \] Tasto "RIPOSIZIONA" in Home.  
  * \[ \] **Step 1 (Source)**: Ricerca Item (Text/Voice).  
    * \[ \] Lista risultati deve mostrare Thumbnail \+ **Vecchia Posizione**.  
    * \[ \] Tasto "Crea Nuovo" se non trovato (scatto foto rapido).  
  * \[ \] **Step 2 (Target)**: Apertura immediata Scanner QR.  
  * \[ \] **Step 3**: Update DB e Toast di conferma.  
* \[ \] **Bulk Move (Svuota Scatola)**  
  * \[ \] Nella vista Location, tasto "Sposta tutto il contenuto".  
  * \[ \] Scan nuova Location \-\> Update massivo location\_id.

## **📡 FASE 6: Radar & Graph (Advanced \- Solo dopo Fase 1\)**

* \[ \] **Scanner Continuo (Radar Mode)**  
  * \[ \] Implementare scanner QR in modalità stream continuo (non stop-on-detect).  
  * \[ \] UI Overlay: Reticolo di puntamento.  
* \[ \] **Logica Backend "Adjacency"**  
  * \[ \] Endpoint per ricevere batch di scansioni temporali.  
  * \[ \] Aggiornare pesi tabella adjacency.  
  * \[ \] Endpoint GET /proximity/{target\_id}: Restituisce lista ID "vicini" (Grado 1 e 2).  
* \[ \] **Feedback AR (Acqua/Fuoco)**  
  * \[ \] Integrare lista prossimità nel Radar.  
  * \[ \] Logica Client-side:  
    * \[ \] Se QR \== Target: Bordo Verde \+ Vibrazione Lunga.  
    * \[ \] Se QR \== Vicino (Grado 1\) O Stesso Parent: Bordo Arancio \+ Vibrazione Doppia ("Fuoco").  
    * \[ \] Se QR \== Vicino (Grado 2): Bordo Giallo ("Fuochino").  
    * \[ \] Altro: Bordo Grigio.  
* \[ \] **Passive Audit**  
  * \[ \] Quando il Radar vede un QR (anche se non target), inviare ping al server per aggiornare last\_audit della Location.

## **🧪 FASE 7: Testing & Polish**

* \[ \] **Test Mobile Reale**  
  * \[ \] Verificare funzionamento "Clean Share" su iOS (Safari e Chrome).  
  * \[ \] Verificare funzionamento Camera su Android (Chrome).  
  * \[ \] Testare UX in condizioni di luce scarsa (Garage).  
* \[ \] **Backup Script**  
  * \[ \] Script Shell/Python nel container per dump giornaliero di warehouse.db.