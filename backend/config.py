"""
Configurazioni applicazione Magazzino Caos Ordinato
"""
import os
from pathlib import Path


class Settings:
    """Configurazioni centralizzate dell'applicazione."""
    
    # Paths
    BASE_DIR: Path = Path(__file__).parent.parent
    DATA_DIR: Path = Path(os.getenv("DATA_DIR", BASE_DIR / "data"))
    UPLOADS_DIR: Path = DATA_DIR / "uploads"
    UPLOADS_FULL_DIR: Path = UPLOADS_DIR / "full"
    UPLOADS_THUMBS_DIR: Path = UPLOADS_DIR / "thumbs"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{DATA_DIR / 'magazzino.db'}"
    )
    
    # Image Processing
    MAX_IMAGE_SIZE: int = 1200  # px lato lungo
    THUMBNAIL_SIZE: int = 300   # px lato lungo
    JPEG_QUALITY: int = 85
    
    # API
    API_PREFIX: str = "/api"
    
    # App Info
    APP_NAME: str = "Magazzino Caos Ordinato"
    APP_VERSION: str = "1.0.0"
    
    def __init__(self):
        """Crea le directory necessarie all'avvio."""
        self.UPLOADS_FULL_DIR.mkdir(parents=True, exist_ok=True)
        self.UPLOADS_THUMBS_DIR.mkdir(parents=True, exist_ok=True)


settings = Settings()
