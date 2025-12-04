# Changelog

Tutte le modifiche significative al progetto Magazzino "Caos Ordinato".

## [1.0.0] - 2025-12-04

### 🎉 Release Iniziale

#### Backend (FastAPI + SQLite)
- Struttura modulare: `database/`, `routers/`, `services/`
- Database SQLite con WAL mode per concorrenza multi-utente
- FTS5 (Full-Text Search) per ricerca veloce
- API CRUD complete per Locations e Items
- Upload immagini con resize automatico (1200px) e thumbnail (300px)
- Correzione rotazione EXIF per foto iPhone
- Endpoint `/api/locations/claim/{id}` per deep linking da QR
- Bulk move per Pocket Logic

#### Frontend (React + Vite + Tailwind)
- PWA con manifest e service worker
- Dark mode con design system personalizzato
- Camera HUD con nome scatola sovrapposto
- Scanner QR con html5-qrcode
- Ali-Hack: Clean Share per ricerca visiva (Google Lens/AliExpress)
- Auto-paste descrizione al ritorno dall'app
- Pocket Logic: tasca digitale per spostamenti multipli
- Flash Move: ricerca → scan → sposta
- Label Generator: export CSV per etichettatrici

#### Pagine
- Home: dashboard con stats e lista locations
- Location: vista scatola con griglia items
- Search: ricerca FTS con risultati in tempo reale
- Tools: generatore etichette CSV
- ItemDetail: dettaglio oggetto con azioni

#### Docker
- Build multi-stage (Node + Python)
- Configurato per deploy su Synology via GitHub PAT
- Volume persistente per database e uploads
