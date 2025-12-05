# **AGGIORNAMENTO CORE: FLUSSO "FLASH MOVE" (V8.0)**

## **1\. Obiettivo**

Gestire la ricollocazione di oggetti spostati fisicamente senza tracking intermedio (Teletrasporto).  
Il flusso deve unire "Ricerca Item" e "Scan Location" in un'unica azione fluida.

## **2\. UI/UX Workflow**

### **Tasto "RIPOSIZIONA" (Home Page)**

Azione che apre un modal a due step:

**STEP 1: Identificazione (Source)**

* Input: Search Bar (Text/Voice) con autofocus attivo.  
* List: Risultati ricerca con Thumbnail \+ Nome \+ *Current Location Name* (es. "Box A").  
* Action: Tap su un risultato \-\> Passa a Step 2\.  
* **Fallback:** Se la ricerca è vuota o l'utente non trova l'item, tasto "CREA NUOVO AL VOLO":  
  * Apre Camera \-\> Scatta Foto Oggetto \-\> Passa a Step 2\.  
  * Usa la stringa di ricerca come description iniziale.

**STEP 2: Destinazione (Target)**

* Input: Camera Scanner QR.  
* Action: Scansione QR Location.  
* **Logic:**  
  * Esegue UPDATE items SET location\_id \= SCANNED\_ID, status \= AVAILABLE WHERE id \= SELECTED\_ID.  
  * Feedback Aptico (Success) \+ Toast: "Spostato in \[Nome Posizione\]".  
  * Reset immediato alla Home.

## **3\. Prevenzione Errori (Disambiguazione)**

Se la ricerca restituisce più oggetti simili (es. "Cavo USB"), la visualizzazione della "Vecchia Posizione" è mandatoria nella lista risultati.  
Questo aiuta l'utente a dedurre: "Ah, ho in mano quello che era nel cassetto, non quello del garage".