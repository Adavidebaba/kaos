"""
Router API per ricerca Full-Text Search (FTS5).
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..database import get_db, Item, ItemStatus


router = APIRouter(prefix="/search", tags=["search"])


# ============== Pydantic Schemas ==============

class SearchResult(BaseModel):
    """Schema risultato ricerca."""
    id: int
    location_id: Optional[int]
    location_name: Optional[str]
    thumbnail_path: str
    description: Optional[str]
    status: ItemStatus
    rank: float  # Relevance score FTS5
    
    class Config:
        from_attributes = True


class SearchResponse(BaseModel):
    """Schema risposta ricerca."""
    query: str
    results: List[SearchResult]
    total: int


# ============== API Endpoints ==============

@router.get("", response_model=SearchResponse)
def search_items(
    q: str = Query(..., min_length=1, description="Query di ricerca"),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Ricerca items per descrizione usando FTS5.
    Restituisce risultati ordinati per rilevanza.
    """
    if not q.strip():
        return SearchResponse(query=q, results=[], total=0)
    
    # Prepara query per FTS5
    # Aggiungi * per match parziale (prefix matching)
    search_terms = " ".join(f"{term}*" for term in q.split())
    
    # Query FTS5 con rank
    sql = text("""
        SELECT 
            items.id,
            items.location_id,
            items.thumbnail_path,
            items.description,
            items.status,
            items_fts.rank
        FROM items_fts
        JOIN items ON items_fts.rowid = items.id
        WHERE items_fts MATCH :query
          AND items.deleted_at IS NULL
        ORDER BY items_fts.rank
        LIMIT :limit
    """)
    
    try:
        result = db.execute(sql, {"query": search_terms, "limit": limit})
        rows = result.fetchall()
    except Exception:
        # Fallback a LIKE se FTS fallisce
        return _search_fallback(q, limit, db)
    
    # Costruisci risultati con location_name
    results = []
    for row in rows:
        # Fetch location name
        loc_name = None
        if row.location_id:
            from ..database import Location
            loc = db.query(Location).filter(Location.id == row.location_id).first()
            if loc:
                loc_name = loc.name
        
        results.append(SearchResult(
            id=row.id,
            location_id=row.location_id,
            location_name=loc_name,
            thumbnail_path=row.thumbnail_path,
            description=row.description,
            status=ItemStatus(row.status),
            rank=abs(row.rank)  # FTS5 rank è negativo
        ))
    
    return SearchResponse(
        query=q,
        results=results,
        total=len(results)
    )


def _search_fallback(
    q: str, 
    limit: int, 
    db: Session
) -> SearchResponse:
    """
    Ricerca fallback con LIKE se FTS5 non disponibile.
    Meno performante ma sempre funzionante.
    """
    search_pattern = f"%{q}%"
    
    items = db.query(Item).filter(
        Item.description.ilike(search_pattern),
        Item.deleted_at.is_(None)
    ).limit(limit).all()
    
    results = []
    for item in items:
        loc_name = item.location.name if item.location else None
        results.append(SearchResult(
            id=item.id,
            location_id=item.location_id,
            location_name=loc_name,
            thumbnail_path=item.thumbnail_path,
            description=item.description,
            status=item.status,
            rank=1.0  # Relevance fissa per fallback
        ))
    
    return SearchResponse(
        query=q,
        results=results,
        total=len(results)
    )
