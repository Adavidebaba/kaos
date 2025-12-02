# **💡 Project Vision: Magazzino "Caos Ordinato"**

**Il Gestionale Domestico per chi odia mettere in ordine.**

## **1\. Il Problema (The Pain Point)**

I software di inventario classici falliscono in ambiente domestico perché richiedono disciplina.  
Richiedono di categorizzare, ordinare e seguire procedure rigide.  
L'utente tipo di questa app è un "Inguaribile Creatore di Caos":

* Compra centinaia di piccoli oggetti (spesso gadget cinesi senza nome da AliExpress/Temu).  
* Non ha voglia di organizzare il garage per "tipologia".  
* Quando usa un oggetto, spesso dimentica di rimetterlo a posto o lo mette nel primo buco libero.  
* **Risultato attuale:** Compra cose che ha già perché non le trova, o perde ore a cercare un cavo.

## **2\. La Filosofia: "Random Stow" (Stile Amazon)**

L'app si basa su un principio logistico industriale adattato alla pigrizia umana:  
"Non importa DOVE metti le cose, purché il sistema sappia che sono LÌ."

* **Nessun Ordine Fisico:** Cavi, lampadine e colla possono stare nella stessa scatola.  
* **Ordine Digitale Assoluto:** L'app è l'unica fonte di verità.  
* **Speed-First:** Ogni azione che richiede più di **3 secondi** è un fallimento. Se l'app è lenta o macchinosa, l'utente smetterà di usarla e tornerà il caos.

## **3\. I Tre Pilastri dell'Esperienza (UX)**

### **A. Inserimento a "Cervello Spento" (The Ali-Hack)**

L'utente non sa come descrivere l'oggetto (es. "Cosino di plastica nero").

* **Soluzione:** L'app deve permettere di scattare una foto e, con un click, cercare quell'immagine su AliExpress/Google Lens per copiare la descrizione commerciale.  
* **Obiettivo:** Popolare il catalogo senza dover digitare nulla.

### **B. Tolleranza all'Errore (Context HUD)**

L'utente è distratto. Mentre inserisce oggetti, rischia di metterli nella scatola sbagliata.

* **Soluzione:** L'app deve "urlare" visivamente il contesto. Quando la fotocamera è aperta, il nome della scatola (es. "SCATOLA 100") deve essere stampato sopra l'immagine (HUD).

### **C. Gestione della Pigrizia (Flash Move & Pockets)**

L'utente prende un oggetto e lo sposta senza dirlo all'app. Giorni dopo, vuole rimetterlo a posto ma non si ricorda dov'era.

* **Soluzione:** Non costringere l'utente a procedure formali.  
  * **Flash Move:** Cerca l'oggetto \-\> Scansiona NUOVA scatola \-\> Fatto. (Teletrasporto).  
  * **Tasca Digitale:** "Ho questo in mano" \-\> "Lo butto in questa scatola a caso". Fatto.

## **4\. User Stories (I Casi d'Uso Reali)**

**Scenario 1: Il "Giorno Zero" (Setup Massivo)**

"Ho 50 scatole vuote. Voglio etichettarle tutte subito e riempirle con calma."  
L'app deve generare un CSV di etichette con QR Code (Deep Link) da stampare in blocco. L'utente attacca l'etichetta, scansiona il QR e l'app crea la "Location" nel database in quel momento.

**Scenario 2: Il Garage nel Weekend (Inserimento)**

"Ho uno scatolone di roba mista. Voglio svuotarlo dentro la Scatola 45 il più velocemente possibile."  
L'utente scansiona la Scatola 45\. L'app entra in "Loop Mode".  
Foto Oggetto 1 \-\> Share to Ali \-\> Incolla \-\> Salva.  
(L'app si resetta istantaneamente).  
Foto Oggetto 2 \-\> Salva (senza nome).  
(L'app si resetta istantaneamente).  
Il tutto avviene senza tempi di caricamento visibili (Fire & Forget).

**Scenario 3: Il "Pentito" (Mantenimento)**

"Ho trovato un cacciavite sul tavolo. Non so da dove viene. Voglio solo metterlo via nella scatola che ho davanti."  
L'utente apre l'app \-\> Cerca "Cacciavite" \-\> Preme sul risultato \-\> Si apre la fotocamera \-\> Scansiona la scatola davanti a sé.  
L'app aggiorna la posizione. L'utente non deve sapere dov'era prima il cacciavite.

## **5\. Nota Tecnica per lo Sviluppatore**

Non stiamo costruendo un gestionale aziendale rigido. Stiamo costruendo un **"Companion"** che deve essere più veloce del caos.

* **Priorità:** Fluidità interfaccia, gestione offline (garage senza wifi), riduzione dei click.  
* **Tecnologia:** L'uso di HTTPS e di un reverse proxy è mandatorio per far funzionare le API della fotocamera e della condivisione su mobile.