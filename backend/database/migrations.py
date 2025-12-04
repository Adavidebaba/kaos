"""
Inizializzazione database e setup FTS5 per ricerca full-text.
"""
from sqlalchemy import text

from .connection import engine
from .models import Base


def init_database():
    """
    Crea tutte le tabelle e configura FTS5.
    Chiamare all'avvio dell'applicazione.
    """
    # Crea tabelle base
    Base.metadata.create_all(bind=engine)
    
    # Setup FTS5 per ricerca veloce
    _setup_fts5()


def _setup_fts5():
    """
    Configura la tabella virtuale FTS5 per ricerca full-text.
    Usa contentless FTS5 sincronizzato con la tabella items.
    """
    with engine.connect() as conn:
        # Verifica se la tabella FTS esiste già
        result = conn.execute(text(
            "SELECT name FROM sqlite_master "
            "WHERE type='table' AND name='items_fts'"
        ))
        
        if result.fetchone() is None:
            # Crea tabella FTS5
            conn.execute(text("""
                CREATE VIRTUAL TABLE items_fts USING fts5(
                    description,
                    content='items',
                    content_rowid='id'
                )
            """))
            
            # Trigger per INSERT
            conn.execute(text("""
                CREATE TRIGGER items_fts_insert AFTER INSERT ON items BEGIN
                    INSERT INTO items_fts(rowid, description) 
                    VALUES (new.id, new.description);
                END
            """))
            
            # Trigger per DELETE
            conn.execute(text("""
                CREATE TRIGGER items_fts_delete AFTER DELETE ON items BEGIN
                    INSERT INTO items_fts(items_fts, rowid, description) 
                    VALUES ('delete', old.id, old.description);
                END
            """))
            
            # Trigger per UPDATE
            conn.execute(text("""
                CREATE TRIGGER items_fts_update AFTER UPDATE ON items BEGIN
                    INSERT INTO items_fts(items_fts, rowid, description) 
                    VALUES ('delete', old.id, old.description);
                    INSERT INTO items_fts(rowid, description) 
                    VALUES (new.id, new.description);
                END
            """))
            
            conn.commit()


def rebuild_fts_index():
    """
    Ricostruisce l'indice FTS5 da zero.
    Utile dopo import massivi o corruzione.
    """
    with engine.connect() as conn:
        conn.execute(text("INSERT INTO items_fts(items_fts) VALUES('rebuild')"))
        conn.commit()
