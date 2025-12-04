"""
Magazzino "Caos Ordinato" - Backend FastAPI
Entry point principale dell'applicazione.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database.migrations import init_database
from .routers import (
    locations_router,
    items_router,
    search_router,
    upload_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle manager: inizializza database all'avvio.
    """
    # Startup
    init_database()
    yield
    # Shutdown (cleanup se necessario)


# Crea applicazione FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Gestionale magazzino domestico con filosofia Random Stow",
    lifespan=lifespan
)

# CORS per sviluppo locale (React dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",
        "https://kaos.adavide.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files per uploads
app.mount(
    "/uploads",
    StaticFiles(directory=str(settings.UPLOADS_DIR)),
    name="uploads"
)

# Mount frontend build (per produzione)
# Il frontend buildato viene copiato in frontend/dist dal Dockerfile
try:
    app.mount(
        "/assets",
        StaticFiles(directory="frontend/dist/assets"),
        name="assets"
    )
except Exception:
    pass  # In dev mode, frontend non è ancora buildato


# Registra routers API
app.include_router(locations_router, prefix=settings.API_PREFIX)
app.include_router(items_router, prefix=settings.API_PREFIX)
app.include_router(search_router, prefix=settings.API_PREFIX)
app.include_router(upload_router, prefix=settings.API_PREFIX)


# ============== Route Speciali ==============

@app.get("/api/health")
def health_check():
    """Health check per monitoring."""
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


@app.get("/api/stats")
def get_stats():
    """Statistiche rapide del magazzino."""
    from .database import get_db, Location, Item, ItemStatus
    from sqlalchemy.orm import Session
    
    db = next(get_db())
    try:
        total_locations = db.query(Location).filter(
            Location.deleted_at.is_(None)
        ).count()
        
        total_items = db.query(Item).filter(
            Item.deleted_at.is_(None)
        ).count()
        
        items_in_hand = db.query(Item).filter(
            Item.status == ItemStatus.IN_HAND,
            Item.deleted_at.is_(None)
        ).count()
        
        return {
            "total_locations": total_locations,
            "total_items": total_items,
            "items_in_hand": items_in_hand
        }
    finally:
        db.close()


# ============== Serve Frontend (SPA Fallback) ==============

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """
    Catch-all per SPA routing.
    Serve index.html per tutte le rotte non-API.
    Necessario per React Router (client-side routing).
    """
    from fastapi.responses import FileResponse
    from pathlib import Path
    
    # Se è una richiesta API, lascia passare (già gestita)
    if full_path.startswith("api/") or full_path.startswith("uploads/"):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    
    # Prova a servire file statico
    static_file = Path("frontend/dist") / full_path
    if static_file.is_file():
        return FileResponse(static_file)
    
    # Fallback a index.html per SPA routing
    index_file = Path("frontend/dist/index.html")
    if index_file.exists():
        return FileResponse(index_file)
    
    # Dev mode: frontend non buildato
    return {
        "message": "Frontend not built. Run 'npm run build' in frontend/",
        "dev_hint": "Usa http://localhost:5173 per il dev server React"
    }
