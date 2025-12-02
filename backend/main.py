from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

from . import models, database
from .routes import locations, items

# Create tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Kaos Backend")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure data directories exist
os.makedirs("data/uploads/full", exist_ok=True)
os.makedirs("data/uploads/thumbs", exist_ok=True)

app.include_router(locations.router)
app.include_router(items.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Kaos Backend is running"}

# Serve static files for images
app.mount("/uploads", StaticFiles(directory="data/uploads"), name="uploads")
