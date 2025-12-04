"""
Servizio per generazione e confronto embeddings usando OpenAI.
Permette ricerca semantica intelligente.
"""
import json
from typing import List, Optional
import numpy as np

from ..config import settings


# Cache embeddings in memoria per ridurre chiamate API
_embedding_cache: dict = {}


def get_openai_client():
    """Ritorna client OpenAI se configurato."""
    if not settings.OPENAI_API_KEY:
        return None
    
    try:
        from openai import OpenAI
        return OpenAI(api_key=settings.OPENAI_API_KEY)
    except Exception:
        return None


def generate_embedding(text: str) -> Optional[List[float]]:
    """
    Genera embedding vector per un testo usando OpenAI.
    Ritorna None se OpenAI non disponibile.
    """
    if not text or not text.strip():
        return None
    
    # Check cache
    cache_key = text.strip().lower()
    if cache_key in _embedding_cache:
        return _embedding_cache[cache_key]
    
    client = get_openai_client()
    if not client:
        return None
    
    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",  # Modello economico e veloce
            input=text.strip()
        )
        embedding = response.data[0].embedding
        
        # Cache result
        _embedding_cache[cache_key] = embedding
        
        return embedding
    except Exception as e:
        print(f"Errore generazione embedding: {e}")
        return None


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calcola similarità coseno tra due vettori."""
    a = np.array(vec1)
    b = np.array(vec2)
    
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
    
    return float(dot_product / (norm_a * norm_b))


def embedding_to_json(embedding: List[float]) -> str:
    """Converte embedding in JSON string per storage."""
    return json.dumps(embedding)


def json_to_embedding(json_str: str) -> Optional[List[float]]:
    """Converte JSON string in embedding list."""
    try:
        return json.loads(json_str)
    except Exception:
        return None


def search_by_similarity(
    query_embedding: List[float],
    items_with_embeddings: List[tuple],  # [(id, embedding_json), ...]
    threshold: float = 0.3,
    limit: int = 20
) -> List[tuple]:
    """
    Cerca items più simili per embedding.
    Ritorna lista di (id, similarity_score) ordinata per rilevanza.
    """
    results = []
    
    for item_id, embedding_json in items_with_embeddings:
        if not embedding_json:
            continue
        
        item_embedding = json_to_embedding(embedding_json)
        if not item_embedding:
            continue
        
        similarity = cosine_similarity(query_embedding, item_embedding)
        
        if similarity >= threshold:
            results.append((item_id, similarity))
    
    # Ordina per similarità decrescente
    results.sort(key=lambda x: x[1], reverse=True)
    
    return results[:limit]


def is_semantic_search_available() -> bool:
    """Verifica se la ricerca semantica è disponibile."""
    return bool(settings.OPENAI_API_KEY) and get_openai_client() is not None
