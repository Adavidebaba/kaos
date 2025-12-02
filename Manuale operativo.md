# **📘 Manuale Operativo Unificato: Magazzino "Caos Ordinato"**

Per lo Sviluppatore:  
Questo documento unifica tutte le specifiche tecniche, i concept e i workflow discussi in una guida sequenziale. Se ti senti perso, segui questo filo logico.

## **🎯 IL CONCETTO (Perché stiamo facendo questo?)**

Stiamo costruendo una PWA (Progressive Web App) per gestire un magazzino domestico caotico.  
Il cliente non vuole "mettere in ordine". Vuole trovare le cose e spostarle velocemente.  
La Regola d'Oro (Speed-First):  
Qualsiasi operazione (inserimento, ricerca, spostamento) che richiede più di 3 secondi o 3 tap è considerata un bug di design. L'interfaccia deve essere "scattante" (Optimistic UI) e tollerare errori e offline.

## **🛠️ STRATEGIA DI IMPLEMENTAZIONE (Come procedere)**

Non costruire tutto insieme. Segui questi 4 Layer progressivi.

### **LAYER 1: Le Fondamenta (Infrastructure)**

*Senza questo, nulla funziona.*

1. **Docker & HTTPS (CRITICO):**  
   * L'app usa API del browser sensibili (getUserMedia, navigator.share).  
   * Queste API **NON funzionano su HTTP** (tranne localhost).  
   * **Task:** Devi configurare un container Nginx/Traefik davanti all'app o generare certificati self-signed per farla girare in HTTPS sulla LAN.  
2. **Database Resiliente:**  
   * Usa SQLite.  
   * **Obbligatorio:** Abilita PRAGMA journal\_mode=WAL; all'avvio della connessione. Altrimenti, se marito e moglie salvano insieme, il DB si blocca (Database Locked Error).  
3. **Storage Immagini:**  
   * Prevedi due cartelle: /uploads/full e /uploads/thumbs.  
   * Il backend deve generare le miniature (max 300px) *immediatamente* all'upload. La UI non deve MAI caricare le immagini full-res nelle liste.

### **LAYER 2: L'Inserimento (Il Core Loop)**

*Questa è la funzione più usata. Deve essere perfetta.*

1. **L'Esperienza "HUD":**  
   * L'utente deve sapere sempre in che scatola sta mettendo gli oggetti.  
   * **Implementazione:** Nella vista fotocamera, sovraimprimi un \<div\> semitrasparente con il nome della Location (es. "SCATOLA A1").  
2. **Il Modulo "Ali-Hack" (Ricerca Visiva):**  
   * Il cliente non vuole scrivere descrizioni. Vuole usare la ricerca per immagini di Google/AliExpress.  
   * **Il problema:** Non possiamo integrare le loro API.  
   * **La soluzione (Clean Share):** Usiamo la condivisione nativa del telefono.  
   * **Codice:** Guarda il file ali\_search\_hack.html. Devi implementare ESATTAMENTE quella logica:  
     * Resize immagine client-side (max 800px).  
     * navigator.share({ files: \[blob\] }) (SOLO file, niente testo\!).  
   * *Nota:* Se aggiungi title o text, su iOS spariscono le opzioni di AliExpress/Google. Non farlo.

### **LAYER 3: La Gestione del Caos (Workflow Avanzati)**

*Queste feature distinguono l'app da un semplice Excel.*

1. **Flash Move (Teletrasporto):**  
   * Scenario: L'utente sposta un oggetto senza dire nulla, poi vuole aggiornare la posizione.  
   * **Flow:** Cerca Oggetto \-\> Click \-\> Si apre subito la Camera \-\> Scansiona nuova Scatola \-\> Update DB.  
   * È un'azione atomica. Non fargli aprire la scheda dettaglio.  
2. **Pocket Logic (Tasca Digitale):**  
   * Scenario: Prendo 5 cose, vado in garage, le butto in una scatola.  
   * **Implementazione:**  
     * Stato globale pocketItems (array di ID).  
     * Tasto "Prendo" su un item \-\> Aggiunge ID all'array.  
     * Tasto "Svuota Tasche" \-\> Apre Camera \-\> Scan QR \-\> Update massivo di tutti gli ID nell'array alla nuova Location.

### **LAYER 4: Tools & Setup (Etichettatura)**

*Serve per iniziare a usare il sistema.*

1. **Label Generator:**  
   * Non generare PDF complessi. Genera un semplice **CSV**.  
   * Colonne: ID, Nome, URL.  
   * **Deep Link:** L'URL nel QR Code deve essere https://\[IP-NAS\]/loc/\[ID\].  
2. **Routing Intelligente:**  
   * Se l'utente apre quel link (/loc/100), l'app deve aprirsi, settare il contesto su "Scatola 100" e accendere la fotocamera.  
   * Se la Scatola 100 non esiste nel DB \-\> Mostra form "Nuova Scatola" \-\> Crea \-\> Accendi Camera.

## **🚫 COSA NON FARE (Per ora)**

Per la **Versione 1.0 (MVP)**, ignora le seguenti richieste "Fase 2" per non complicarti la vita:

1. **IGNORA il "Radar AR" e "Acqua/Fuoco":** È complesso da fare bene via web. Implementa prima lo scanner QR semplice (zbar/html5-qrcode).  
2. **IGNORA il "Grafo di Prossimità":** Non calcolare vicinanze o gradi di separazione.  
3. **IGNORA il "Passive Audit":** Non tracciare cosa passa davanti alla telecamera per sbaglio.

Concentrati solo su: **Foto \-\> Ali-Hack \-\> Salva** e **Cerca \-\> Sposta**.

## **📝 CHECKLIST RIASSUNTIVA PER LO SVILUPPATORE**

1. \[ \] Il container backend gira e salva su /data?  
2. \[ \] Il container frontend risponde in **HTTPS**?  
3. \[ \] Quando carico una foto, viene creata la thumbnail?  
4. \[ \] La rotazione delle foto verticali (iPhone) è corretta?  
5. \[ \] Il tasto "Magic Search" apre il menu condivisione di iOS mostrando "Cerca con Google/AliExpress"?  
6. \[ \] La scansione di un QR /loc/123 porta direttamente alla fotocamera di inserimento?  
7. \[ \] Posso spostare un oggetto ("Flash Move") in meno di 5 secondi?

Se la risposta è SÌ a tutto, hai consegnato il progetto perfetto.