from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

# --- Item Schemas ---
class ItemBase(BaseModel):
    description: Optional[str] = None
    status: str = "AVAILABLE"

class ItemCreate(ItemBase):
    location_id: Optional[int] = None

class ItemUpdate(ItemBase):
    location_id: Optional[int] = None
    photo_path: Optional[str] = None
    thumbnail_path: Optional[str] = None

class ItemBulkUpdate(BaseModel):
    item_ids: List[int]
    location_id: int

class Item(ItemBase):
    id: int
    location_id: Optional[int]
    photo_path: Optional[str]
    thumbnail_path: Optional[str]
    created_at: datetime
    deleted_at: Optional[datetime]

    class Config:
        orm_mode = True

# --- Location Schemas ---
class LocationBase(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None

class LocationCreate(LocationBase):
    id: Optional[int] = None

class Location(LocationBase):
    id: int
    context_photos: List[str] = []
    deleted_at: Optional[datetime]
    items: List[Item] = []

    class Config:
        orm_mode = True
