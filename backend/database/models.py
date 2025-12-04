"""
Modelli SQLAlchemy per il database Magazzino.
"""
import enum
from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, 
    ForeignKey, Enum, JSON, Index
)
from sqlalchemy.orm import declarative_base, relationship


Base = declarative_base()


class ItemStatus(enum.Enum):
    """Stati possibili di un item."""
    AVAILABLE = "available"  # Nella sua location
    IN_HAND = "in_hand"      # In tasca digitale
    LOST = "lost"            # Perso/non trovato
    LOANED = "loaned"        # Prestato a qualcuno


class Location(Base):
    """
    Rappresenta una location (scatola, scaffale, stanza).
    Supporta gerarchia tramite parent_id.
    """
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    context_photos = Column(JSON, nullable=True)  # Array di path foto contesto
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete
    
    # Relationships
    parent = relationship(
        "Location", 
        remote_side=[id], 
        back_populates="children"
    )
    children = relationship(
        "Location", 
        back_populates="parent",
        cascade="all, delete-orphan"
    )
    items = relationship(
        "Item", 
        back_populates="location",
        cascade="all, delete-orphan"
    )
    
    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None
    
    @property
    def item_count(self) -> int:
        """Conta gli item attivi (non eliminati) in questa location."""
        return len([i for i in self.items if i.deleted_at is None])


class Item(Base):
    """
    Rappresenta un oggetto nel magazzino.
    La descrizione è indicizzata per Full-Text Search.
    """
    __tablename__ = "items"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(
        Integer, 
        ForeignKey("locations.id"), 
        nullable=True  # Null quando IN_HAND
    )
    photo_path = Column(String(255), nullable=False)
    thumbnail_path = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    embedding = Column(Text, nullable=True)  # JSON array per ricerca semantica
    status = Column(
        Enum(ItemStatus), 
        default=ItemStatus.AVAILABLE,
        nullable=False
    )
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete
    
    # Relationship
    location = relationship("Location", back_populates="items")
    
    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None


# Indice per ricerche comuni
Index("idx_items_location", Item.location_id)
Index("idx_items_status", Item.status)
Index("idx_locations_parent", Location.parent_id)
