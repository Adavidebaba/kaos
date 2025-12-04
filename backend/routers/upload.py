"""
Router API per upload immagini.
"""
from fastapi import APIRouter, File, UploadFile, HTTPException, status
from pydantic import BaseModel

from ..services import ImageProcessor


router = APIRouter(prefix="/upload", tags=["upload"])


# ============== Pydantic Schemas ==============

class UploadResponse(BaseModel):
    """Schema risposta upload."""
    photo_path: str
    thumbnail_path: str
    message: str


# ============== API Endpoints ==============

@router.post("", response_model=UploadResponse)
async def upload_image(
    file: UploadFile = File(..., description="Immagine da caricare")
):
    """
    Carica un'immagine, la ridimensiona e genera thumbnail.
    
    Returns:
        I path relativi per photo_path e thumbnail_path 
        da usare nella creazione dell'item.
    """
    # Verifica tipo file
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/heic"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo file non supportato: {file.content_type}"
        )
    
    # Leggi contenuto
    content = await file.read()
    
    # Limite dimensione (10MB)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File troppo grande (max 10MB)"
        )
    
    try:
        photo_path, thumbnail_path = await ImageProcessor.process_upload(
            content, 
            file.filename or "upload.jpg"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore elaborazione immagine: {str(e)}"
        )
    
    return UploadResponse(
        photo_path=photo_path,
        thumbnail_path=thumbnail_path,
        message="Upload completato"
    )
