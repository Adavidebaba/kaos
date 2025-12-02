from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base

class ItemStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    IN_HAND = "IN_HAND"
    LOST = "LOST"
    LOANED = "LOANED"

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    parent_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    context_photos = Column(JSON, default=[])
    deleted_at = Column(DateTime, nullable=True)

    # Relationships
    items = relationship("Item", back_populates="location")
    children = relationship("Location", backref="parent", remote_side=[id])

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    photo_path = Column(String, nullable=True)
    thumbnail_path = Column(String, nullable=True)
    description = Column(String, index=True) # FTS target
    status = Column(String, default=ItemStatus.AVAILABLE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime, nullable=True)

    # Relationships
    location = relationship("Location", back_populates="items")
