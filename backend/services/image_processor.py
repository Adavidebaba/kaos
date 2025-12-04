"""
Servizio per elaborazione immagini.
Gestisce resize, thumbnail e correzione rotazione EXIF.
"""
import uuid
from pathlib import Path
from typing import Tuple

from PIL import Image, ImageOps
import aiofiles

from ..config import settings


class ImageProcessor:
    """
    Elaboratore immagini per il magazzino.
    Gestisce upload, resize e generazione thumbnail.
    """
    
    @staticmethod
    def generate_filename(extension: str = "jpg") -> str:
        """Genera un nome file univoco."""
        return f"{uuid.uuid4().hex}.{extension}"
    
    @staticmethod
    def _fix_exif_rotation(image: Image.Image) -> Image.Image:
        """
        Corregge la rotazione basandosi sui dati EXIF.
        Fondamentale per foto scattate con iPhone in verticale.
        """
        try:
            return ImageOps.exif_transpose(image)
        except Exception:
            # Se fallisce, ritorna l'immagine originale
            return image
    
    @staticmethod
    def _resize_image(
        image: Image.Image, 
        max_size: int
    ) -> Image.Image:
        """
        Ridimensiona mantenendo l'aspect ratio.
        Il lato più lungo sarà max_size pixel.
        """
        width, height = image.size
        
        if width <= max_size and height <= max_size:
            return image
        
        if width > height:
            new_width = max_size
            new_height = int(height * (max_size / width))
        else:
            new_height = max_size
            new_width = int(width * (max_size / height))
        
        return image.resize(
            (new_width, new_height), 
            Image.Resampling.LANCZOS
        )
    
    @classmethod
    async def process_upload(
        cls,
        file_content: bytes,
        filename: str
    ) -> Tuple[str, str]:
        """
        Processa un'immagine caricata:
        1. Corregge rotazione EXIF
        2. Ridimensiona a max 1200px
        3. Genera thumbnail 300px
        4. Salva entrambe le versioni
        
        Returns:
            Tuple[str, str]: (path_full, path_thumbnail)
        """
        import io
        
        # Apri immagine da bytes
        image = Image.open(io.BytesIO(file_content))
        
        # Converti a RGB se necessario (per JPEG)
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        
        # Fix rotazione EXIF
        image = cls._fix_exif_rotation(image)
        
        # Genera nome univoco
        new_filename = cls.generate_filename("jpg")
        
        # Resize full
        full_image = cls._resize_image(image, settings.MAX_IMAGE_SIZE)
        full_path = settings.UPLOADS_FULL_DIR / new_filename
        full_image.save(
            full_path, 
            "JPEG", 
            quality=settings.JPEG_QUALITY,
            optimize=True
        )
        
        # Genera thumbnail
        thumb_image = cls._resize_image(image, settings.THUMBNAIL_SIZE)
        thumb_path = settings.UPLOADS_THUMBS_DIR / new_filename
        thumb_image.save(
            thumb_path, 
            "JPEG", 
            quality=settings.JPEG_QUALITY,
            optimize=True
        )
        
        # Ritorna path relativi per storage in DB
        return (
            f"uploads/full/{new_filename}",
            f"uploads/thumbs/{new_filename}"
        )
    
    @classmethod
    def delete_images(cls, photo_path: str, thumbnail_path: str) -> bool:
        """
        Elimina le immagini dal filesystem.
        Usato per cleanup dopo soft delete permanente.
        """
        try:
            full_file = settings.DATA_DIR / photo_path
            thumb_file = settings.DATA_DIR / thumbnail_path
            
            if full_file.exists():
                full_file.unlink()
            if thumb_file.exists():
                thumb_file.unlink()
            
            return True
        except Exception:
            return False
