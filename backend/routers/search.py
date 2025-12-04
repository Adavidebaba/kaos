"""
Router API per ricerca con supporto Semantic Search (OpenAI embeddings).
Fallback a FTS5 se OpenAI non disponibile.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..database import get_db, Item, ItemStatus, Location
from ..services import embeddings


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
    rank: float  # Relevance score
    
    class Config:
        from_attributes = True


class SearchResponse(BaseModel):
    """Schema risposta ricerca."""
    query: str
    results: List[SearchResult]
    total: int
    method: str  # "semantic", "fts", "like"


# ============== API Endpoints ==============

@router.get("", response_model=SearchResponse)
def search_items(
    q: str = Query(..., min_length=1, description="Query di ricerca"),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Ricerca items per descrizione.
    Usa ricerca semantica (OpenAI) se disponibile, altrimenti FTS5.
    """
    if not q.strip():
        return SearchResponse(query=q, results=[], total=0, method="none")
    
    # Prova ricerca semantica se disponibile
    if embeddings.is_semantic_search_available():
        result = _search_semantic(q, limit, db)
        if result.total > 0:
            return result
    
    # Fallback a FTS5
    try:
        return _search_fts5(q, limit, db)
    except Exception:
        # Ultimo fallback a LIKE
        return _search_like(q, limit, db)


def _search_semantic(
    q: str, 
    limit: int, 
    db: Session
) -> SearchResponse:
    """Ricerca semantica usando embeddings OpenAI."""
    
    # Genera embedding della query
    query_embedding = embeddings.generate_embedding(q)
    if not query_embedding:
        return SearchResponse(query=q, results=[], total=0, method="semantic")
    
    # Prendi tutti gli items con embedding
    items_with_embeddings = db.query(Item.id, Item.embedding).filter(
        Item.deleted_at.is_(None),
        Item.embedding.isnot(None)
    ).all()
    
    if not items_with_embeddings:
        return SearchResponse(query=q, results=[], total=0, method="semantic")
    
    # Cerca per similarità
    similar_items = embeddings.search_by_similarity(
        query_embedding,
        [(item.id, item.embedding) for item in items_with_embeddings],
        threshold=0.3,
        limit=limit
    )
    
    if not similar_items:
        return SearchResponse(query=q, results=[], total=0, method="semantic")
    
    # Costruisci risultati
    results = []
    for item_id, similarity in similar_items:
        item = db.query(Item).filter(Item.id == item_id).first()
        if not item:
            continue
        
        loc_name = None
        if item.location:
            loc_name = item.location.name
        
        results.append(SearchResult(
            id=item.id,
            location_id=item.location_id,
            location_name=loc_name,
            thumbnail_path=item.thumbnail_path,
            description=item.description,
            status=item.status,
            rank=similarity
        ))
    
    return SearchResponse(
        query=q,
        results=results,
        total=len(results),
        method="semantic"
    )


def _search_fts5(
    q: str, 
    limit: int, 
    db: Session
) -> SearchResponse:
    """Ricerca full-text usando FTS5."""
    
    # Prepara query per FTS5 con prefix matching
    search_terms = " ".join(f"{term}*" for term in q.split())
    
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
    
    result = db.execute(sql, {"query": search_terms, "limit": limit})
    rows = result.fetchall()
    
    results = []
    for row in rows:
        loc_name = None
        if row.location_id:
            loc = db.query(Location).filter(Location.id == row.location_id).first()
            if loc:
                loc_name = loc.name
        
        # Handle both uppercase and lowercase status values
        status_value = row.status
        if isinstance(status_value, str):
            status_value = status_value.lower()
        else:
            status_value = status_value.value
        
        results.append(SearchResult(
            id=row.id,
            location_id=row.location_id,
            location_name=loc_name,
            thumbnail_path=row.thumbnail_path,
            description=row.description,
            status=ItemStatus(status_value),
            rank=abs(row.rank)
        ))
    
    return SearchResponse(
        query=q,
        results=results,
        total=len(results),
        method="fts"
    )


def _search_like(
    q: str, 
    limit: int, 
    db: Session
) -> SearchResponse:
    """Ricerca fallback con LIKE."""
    
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
            rank=1.0
        ))
    
    return SearchResponse(
        query=q,
        results=results,
        total=len(results),
        method="like"
    )


# ============== Endpoint per rebuild embeddings ==============

@router.post("/rebuild-embeddings")
def rebuild_embeddings(db: Session = Depends(get_db)):
    """
    Rigenera gli embeddings per tutti gli items.
    Da usare dopo aggiornamento iniziale o per correzioni.
    """
    if not embeddings.is_semantic_search_available():
        return {"error": "OpenAI non configurato", "updated": 0}
    
    items = db.query(Item).filter(
        Item.deleted_at.is_(None),
        Item.description.isnot(None)
    ).all()
    
    updated = 0
    for item in items:
        if item.description:
            embedding = embeddings.generate_embedding(item.description)
            if embedding:
                item.embedding = embeddings.embedding_to_json(embedding)
                updated += 1
    
    db.commit()
    
    return {
        "message": f"Aggiornati {updated} embeddings su {len(items)} items",
        "updated": updated,
        "total": len(items)
    }
