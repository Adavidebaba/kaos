from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, database
import shutil
import os
import uuid
from PIL import Image, ImageOps
from datetime import datetime

router = APIRouter(
    prefix="/items",
    tags=["items"],
)

UPLOAD_DIR_FULL = "data/uploads/full"
UPLOAD_DIR_THUMBS = "data/uploads/thumbs"

def process_image(file: UploadFile):
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    
    full_path = os.path.join(UPLOAD_DIR_FULL, unique_filename)
    thumb_path = os.path.join(UPLOAD_DIR_THUMBS, unique_filename)
    
    # Open image
    image = Image.open(file.file)
    
    # Fix rotation based on EXIF
    image = ImageOps.exif_transpose(image)
    
    # Save Full Res (Resize to max 1200px)
    image_full = image.copy()
    image_full.thumbnail((1200, 1200))
    image_full.save(full_path, quality=85)
    
    # Save Thumbnail (Resize to max 300px)
    image_thumb = image.copy()
    image_thumb.thumbnail((300, 300))
    image_thumb.save(thumb_path, quality=80)
    
    return unique_filename

@router.post("/", response_model=schemas.Item)
def create_item(
    location_id: int = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    filename = process_image(file)
    
    db_item = models.Item(
        location_id=location_id,
        description=description,
        photo_path=filename,
        thumbnail_path=filename,
        status="AVAILABLE"
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/", response_model=List[schemas.Item])
def read_items(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    items = db.query(models.Item).filter(models.Item.deleted_at == None).offset(skip).limit(limit).all()
    return items

@router.patch("/{item_id}", response_model=schemas.Item)
def update_item(item_id: int, item_update: schemas.ItemUpdate, db: Session = Depends(database.get_db)):
    db_item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item

@router.post("/bulk-update", response_model=List[schemas.Item])
def bulk_update_items(bulk_data: schemas.ItemBulkUpdate, db: Session = Depends(database.get_db)):
    items = db.query(models.Item).filter(models.Item.id.in_(bulk_data.item_ids)).all()
    
    for item in items:
        item.location_id = bulk_data.location_id
        # If item was IN_HAND, set back to AVAILABLE
        if item.status == "IN_HAND":
            item.status = "AVAILABLE"
            
    db.commit()
    # Refresh all items to return updated state
    for item in items:
        db.refresh(item)
        
    return items
