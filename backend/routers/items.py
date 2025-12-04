"""
Router API per gestione Items (oggetti nel magazzino).
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db, Item, Location, ItemStatus


router = APIRouter(prefix="/items", tags=["items"])


# ============== Pydantic Schemas ==============

class ItemCreate(BaseModel):
    """Schema per creazione item."""
    location_id: int
    photo_path: str
    thumbnail_path: str
    description: Optional[str] = None


class ItemUpdate(BaseModel):
    """Schema per aggiornamento item."""
    location_id: Optional[int] = None
    description: Optional[str] = None
    status: Optional[ItemStatus] = None


class ItemResponse(BaseModel):
    """Schema risposta item."""
    id: int
    location_id: Optional[int]
    location_name: Optional[str] = None
    photo_path: str
    thumbnail_path: str
    description: Optional[str]
    status: ItemStatus
    created_at: datetime
    
    class Config:
        from_attributes = True


class BulkMoveRequest(BaseModel):
    """Schema per spostamento massivo (Pocket Logic)."""
    item_ids: List[int]
    target_location_id: int


class ItemsList(BaseModel):
    """Schema risposta lista paginata."""
    items: List[ItemResponse]
    total: int
    page: int
    per_page: int


# ============== API Endpoints ==============

@router.get("", response_model=ItemsList)
def list_items(
    location_id: Optional[int] = None,
    status: Optional[ItemStatus] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Lista items con paginazione e filtri.
    Restituisce sempre thumbnail per performance.
    """
    query = db.query(Item).filter(Item.deleted_at.is_(None))
    
    if location_id is not None:
        query = query.filter(Item.location_id == location_id)
    
    if status is not None:
        query = query.filter(Item.status == status)
    
    # Conta totale per paginazione
    total = query.count()
    
    # Applica paginazione
    offset = (page - 1) * per_page
    items = query.order_by(Item.created_at.desc())\
                 .offset(offset)\
                 .limit(per_page)\
                 .all()
    
    # Costruisci risposta con location_name
    items_response = []
    for item in items:
        loc_name = item.location.name if item.location else None
        items_response.append(ItemResponse(
            id=item.id,
            location_id=item.location_id,
            location_name=loc_name,
            photo_path=item.photo_path,
            thumbnail_path=item.thumbnail_path,
            description=item.description,
            status=item.status,
            created_at=item.created_at
        ))
    
    return ItemsList(
        items=items_response,
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/in-hand", response_model=List[ItemResponse])
def list_items_in_hand(db: Session = Depends(get_db)):
    """
    Lista items nella "tasca digitale" (status IN_HAND).
    Usato per il footer Pocket Logic.
    """
    items = db.query(Item).filter(
        Item.status == ItemStatus.IN_HAND,
        Item.deleted_at.is_(None)
    ).order_by(Item.created_at.desc()).all()
    
    return [
        ItemResponse(
            id=item.id,
            location_id=item.location_id,
            location_name=item.location.name if item.location else None,
            photo_path=item.photo_path,
            thumbnail_path=item.thumbnail_path,
            description=item.description,
            status=item.status,
            created_at=item.created_at
        )
        for item in items
    ]


@router.get("/{item_id}", response_model=ItemResponse)
def get_item(
    item_id: int,
    db: Session = Depends(get_db)
):
    """Ottiene un singolo item per ID."""
    item = db.query(Item).filter(
        Item.id == item_id,
        Item.deleted_at.is_(None)
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item non trovato"
        )
    
    # Se item è in mano, usa previous_location per mostrare la scatola originale
    if item.status == ItemStatus.IN_HAND and item.previous_location_id:
        prev_loc = db.query(Location).filter(Location.id == item.previous_location_id).first()
        return ItemResponse(
            id=item.id,
            location_id=item.previous_location_id,
            location_name=prev_loc.name if prev_loc else None,
            photo_path=item.photo_path,
            thumbnail_path=item.thumbnail_path,
            description=item.description,
            status=item.status,
            created_at=item.created_at
        )
    
    return ItemResponse(
        id=item.id,
        location_id=item.location_id,
        location_name=item.location.name if item.location else None,
        photo_path=item.photo_path,
        thumbnail_path=item.thumbnail_path,
        description=item.description,
        status=item.status,
        created_at=item.created_at
    )


@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(
    data: ItemCreate,
    db: Session = Depends(get_db)
):
    """
    Crea un nuovo item.
    Chiamato dopo upload immagine.
    Genera automaticamente embedding per ricerca semantica.
    """
    from ..services import embeddings
    
    # Verifica location
    location = db.query(Location).filter(
        Location.id == data.location_id,
        Location.deleted_at.is_(None)
    ).first()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location non valida"
        )
    
    # Genera embedding se descrizione presente
    embedding_json = None
    if data.description and embeddings.is_semantic_search_available():
        embedding = embeddings.generate_embedding(data.description)
        if embedding:
            embedding_json = embeddings.embedding_to_json(embedding)
    
    item = Item(
        location_id=data.location_id,
        photo_path=data.photo_path,
        thumbnail_path=data.thumbnail_path,
        description=data.description,
        embedding=embedding_json,
        status=ItemStatus.AVAILABLE
    )
    
    db.add(item)
    db.commit()
    db.refresh(item)
    
    return ItemResponse(
        id=item.id,
        location_id=item.location_id,
        location_name=location.name,
        photo_path=item.photo_path,
        thumbnail_path=item.thumbnail_path,
        description=item.description,
        status=item.status,
        created_at=item.created_at
    )


@router.patch("/{item_id}", response_model=ItemResponse)
def update_item(
    item_id: int,
    data: ItemUpdate,
    db: Session = Depends(get_db)
):
    """
    Aggiorna un item.
    Usato per spostamenti (Flash Move) e cambio status.
    """
    item = db.query(Item).filter(
        Item.id == item_id,
        Item.deleted_at.is_(None)
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item non trovato"
        )
    
    if data.location_id is not None:
        # Verifica nuova location
        location = db.query(Location).filter(
            Location.id == data.location_id,
            Location.deleted_at.is_(None)
        ).first()
        if not location:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Location non valida"
            )
        item.location_id = data.location_id
        # Se spostiamo in una location, status torna AVAILABLE
        item.status = ItemStatus.AVAILABLE
    
    if data.description is not None:
        item.description = data.description
    
    if data.status is not None:
        item.status = data.status
        # Se status IN_HAND, svuota location_id
        if data.status == ItemStatus.IN_HAND:
            item.location_id = None
    
    db.commit()
    db.refresh(item)
    
    return ItemResponse(
        id=item.id,
        location_id=item.location_id,
        location_name=item.location.name if item.location else None,
        photo_path=item.photo_path,
        thumbnail_path=item.thumbnail_path,
        description=item.description,
        status=item.status,
        created_at=item.created_at
    )


@router.post("/{item_id}/pick", response_model=ItemResponse)
def pick_item(
    item_id: int,
    db: Session = Depends(get_db)
):
    """
    Prende un item in mano (Pocket Logic: PRENDO ✋).
    Salva previous_location_id per ricordare la scatola originale.
    """
    item = db.query(Item).filter(
        Item.id == item_id,
        Item.deleted_at.is_(None)
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item non trovato"
        )
    
    # Salva la location originale prima di metterla a None
    if item.location_id:
        item.previous_location_id = item.location_id
    
    item.status = ItemStatus.IN_HAND
    item.location_id = None
    
    db.commit()
    db.refresh(item)
    
    # Recupera nome previous location
    prev_loc_name = None
    if item.previous_location_id:
        prev_loc = db.query(Location).filter(Location.id == item.previous_location_id).first()
        if prev_loc:
            prev_loc_name = prev_loc.name
    
    return ItemResponse(
        id=item.id,
        location_id=item.previous_location_id,  # Ritorna la scatola originale!
        location_name=prev_loc_name,
        photo_path=item.photo_path,
        thumbnail_path=item.thumbnail_path,
        description=item.description,
        status=item.status,
        created_at=item.created_at
    )


@router.post("/bulk/move", response_model=List[ItemResponse])
def bulk_move_items(
    data: BulkMoveRequest,
    db: Session = Depends(get_db)
):
    """
    Spostamento massivo (Pocket Logic: POSA 👇).
    Sposta tutti gli item specificati nella nuova location.
    """
    # Verifica target location
    location = db.query(Location).filter(
        Location.id == data.target_location_id,
        Location.deleted_at.is_(None)
    ).first()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location target non valida"
        )
    
    # Aggiorna tutti gli items
    items = db.query(Item).filter(
        Item.id.in_(data.item_ids),
        Item.deleted_at.is_(None)
    ).all()
    
    for item in items:
        item.location_id = data.target_location_id
        item.status = ItemStatus.AVAILABLE
    
    db.commit()
    
    return [
        ItemResponse(
            id=item.id,
            location_id=item.location_id,
            location_name=location.name,
            photo_path=item.photo_path,
            thumbnail_path=item.thumbnail_path,
            description=item.description,
            status=item.status,
            created_at=item.created_at
        )
        for item in items
    ]


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db)
):
    """Soft delete di un item."""
    item = db.query(Item).filter(
        Item.id == item_id,
        Item.deleted_at.is_(None)
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item non trovato"
        )
    
    item.deleted_at = datetime.utcnow()
    db.commit()
