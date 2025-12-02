# Changelog

## [0.1.0] - 2025-12-02
### Added
- **Infrastructure**:
    - Created `backend` (FastAPI) and `frontend` (React/Vite) directories.
    - Configured `docker-compose.yml` for local development.
    - Configured `Dockerfile` for multi-stage build.
- **Backend**:
    - Implemented SQLite database with WAL mode.
    - Created `Location` and `Item` models.
    - Implemented `locations` and `items` API routes.
    - Added image processing (Resize + Thumbnail + EXIF Rotation).
- **Frontend**:
    - Initialized React app with Tailwind CSS.
    - Created `Camera` component with:
        - Environment camera support.
        - HUD Overlay.
        - "Ali-Hack" (Native Share) implementation.
    - Created `App` layout with "Speed-First" design.
    - Implemented "Optimistic Save" logic for items.

### [0.2.0] - 2025-12-02
### Added
- **Routing & Deep Linking**:
    - Implemented `react-router-dom` with routes: `/`, `/tools`, `/loc/:id`.
    - **Context Logic**: `/loc/:id` checks if box exists.
        - If YES: Opens Camera immediately.
        - If NO: Shows "Initialize Box" UI.
- **Tools**:
    - Created **Label Generator** (`/tools`): Generates CSV with QR codes for bulk printing.
- **Backend**:
    - Updated `LocationCreate` schema to accept manual IDs.
    - Added duplicate ID check in `create_location`.

### [0.3.0] - 2025-12-02
### Added
- **Workflow Optimization ("The Loop")**:
    - **Upload Queue**: Implemented `UploadContext` to handle uploads in background.
    - **Optimistic UI**: Camera resets instantly after capture, while upload happens in background.
    - **Offline Resilience**: Queue persists to LocalStorage (metadata) and retries on failure.
- **UI Polish**:
    - **HUD Upgrade**: "Current Box" overlay is now larger, high-contrast (Yellow on Black), and shows box name clearly.

### [0.4.0] - 2025-12-02
### Added
- **Chaos Management**:
    - **Pocket Logic**:
        - Implemented `PocketContext` to manage items "in hand".
        - Added "Add to Pocket" button in Search.
        - Added "Empty Pocket" button in Location View (Bulk Move).
    - **Flash Move**:
        - Created Search Page (`/search`).
        - Implemented "Flash Move" flow: Search -> Select -> Scan New Box.
    - **Backend**:
        - Added `POST /items/bulk-update` endpoint for mass item relocation.



