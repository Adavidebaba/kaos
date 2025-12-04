"""
Router API per gestione Locations (scatole, scaffali, stanze).
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db, Location


router = APIRouter(prefix="/locations", tags=["locations"])


# ============== Pydantic Schemas ==============

class LocationCreate(BaseModel):
    """Schema per creazione location."""
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None


class LocationUpdate(BaseModel):
    """Schema per aggiornamento location."""
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None


class LocationResponse(BaseModel):
    """Schema risposta location."""
    id: int
    name: str
    description: Optional[str]
    parent_id: Optional[int]
    item_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class LocationDetail(LocationResponse):
    """Schema risposta dettaglio con parent info."""
    parent_name: Optional[str] = None


# ============== API Endpoints ==============

@router.get("", response_model=List[LocationResponse])
def list_locations(
    parent_id: Optional[int] = None,
    include_deleted: bool = False,
    db: Session = Depends(get_db)
):
    """
    Lista tutte le locations.
    Filtra per parent_id se specificato.
    Include conteggio items per location.
    """
    query = db.query(Location)
    
    if not include_deleted:
        query = query.filter(Location.deleted_at.is_(None))
    
    if parent_id is not None:
        query = query.filter(Location.parent_id == parent_id)
    
    locations = query.order_by(Location.name).all()
    
    # Costruisci risposta con item_count
    return [
        LocationResponse(
            id=loc.id,
            name=loc.name,
            description=loc.description,
            parent_id=loc.parent_id,
            item_count=loc.item_count,
            created_at=loc.created_at
        )
        for loc in locations
    ]


@router.get("/{location_id}", response_model=LocationDetail)
def get_location(
    location_id: int,
    db: Session = Depends(get_db)
):
    """
    Ottiene una singola location per ID.
    Usato per Deep Linking da QR code.
    """
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.deleted_at.is_(None)
    ).first()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location {location_id} non trovata"
        )
    
    parent_name = None
    if location.parent:
        parent_name = location.parent.name
    
    return LocationDetail(
        id=location.id,
        name=location.name,
        description=location.description,
        parent_id=location.parent_id,
        parent_name=parent_name,
        item_count=location.item_count,
        created_at=location.created_at
    )


@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(
    data: LocationCreate,
    db: Session = Depends(get_db)
):
    """
    Crea una nuova location.
    Usato quando si scansiona un QR di una scatola non ancora registrata.
    """
    # Verifica parent se specificato
    if data.parent_id:
        parent = db.query(Location).filter(
            Location.id == data.parent_id,
            Location.deleted_at.is_(None)
        ).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent location non valido"
            )
    
    location = Location(
        name=data.name,
        description=data.description,
        parent_id=data.parent_id
    )
    
    db.add(location)
    db.commit()
    db.refresh(location)
    
    return LocationResponse(
        id=location.id,
        name=location.name,
        description=location.description,
        parent_id=location.parent_id,
        item_count=0,
        created_at=location.created_at
    )


@router.post("/claim/{location_id}", response_model=LocationResponse)
def claim_location(
    location_id: int,
    data: LocationCreate,
    db: Session = Depends(get_db)
):
    """
    Crea o ottiene una location con ID specifico.
    Usato per "claiming" di scatole via QR code.
    Se l'ID esiste già, ritorna la location esistente.
    """
    from sqlalchemy import text
    
    existing = db.query(Location).filter(Location.id == location_id).first()
    
    if existing:
        if existing.deleted_at:
            # Riattiva location soft-deleted
            existing.deleted_at = None
            existing.name = data.name
            existing.description = data.description
            db.commit()
            db.refresh(existing)
        
        return LocationResponse(
            id=existing.id,
            name=existing.name,
            description=existing.description,
            parent_id=existing.parent_id,
            item_count=existing.item_count,
            created_at=existing.created_at
        )
    
    # Crea nuova location con ID specifico usando SQL raw
    # SQLite permette INSERT con ID esplicito
    try:
        db.execute(
            text("""
                INSERT INTO locations (id, name, description, parent_id, created_at)
                VALUES (:id, :name, :description, :parent_id, :created_at)
            """),
            {
                "id": location_id,
                "name": data.name,
                "description": data.description,
                "parent_id": data.parent_id,
                "created_at": datetime.utcnow()
            }
        )
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore creazione location: {str(e)}"
        )
    
    # Recupera la location appena creata
    location = db.query(Location).filter(Location.id == location_id).first()
    
    return LocationResponse(
        id=location.id,
        name=location.name,
        description=location.description,
        parent_id=location.parent_id,
        item_count=0,
        created_at=location.created_at
    )


@router.patch("/{location_id}", response_model=LocationResponse)
def update_location(
    location_id: int,
    data: LocationUpdate,
    db: Session = Depends(get_db)
):
    """Aggiorna una location esistente."""
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.deleted_at.is_(None)
    ).first()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location non trovata"
        )
    
    if data.name is not None:
        location.name = data.name
    if data.description is not None:
        location.description = data.description
    if data.parent_id is not None:
        location.parent_id = data.parent_id
    
    db.commit()
    db.refresh(location)
    
    return LocationResponse(
        id=location.id,
        name=location.name,
        description=location.description,
        parent_id=location.parent_id,
        item_count=location.item_count,
        created_at=location.created_at
    )


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(
    location_id: int,
    db: Session = Depends(get_db)
):
    """
    Soft delete di una location.
    Gli items vengono automaticamente orfanizzati (location_id = NULL).
    """
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.deleted_at.is_(None)
    ).first()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location non trovata"
        )
    
    location.deleted_at = datetime.utcnow()
    db.commit()
