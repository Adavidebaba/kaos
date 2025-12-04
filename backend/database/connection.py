"""
Connessione Database SQLite con WAL mode per concorrenza multi-utente.
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from ..config import settings


# Configurazione engine SQLite
# check_same_thread=False necessario per FastAPI async
# StaticPool per mantenere connessione persistente
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False  # True per debug SQL
)


def _set_sqlite_pragma(dbapi_conn, connection_record):
    """
    Configura PRAGMA SQLite alla connessione.
    - WAL mode: permette letture/scritture concorrenti
    - foreign_keys: abilita vincoli di integrità referenziale
    """
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA foreign_keys=ON;")
    cursor.execute("PRAGMA busy_timeout=5000;")  # 5s timeout per lock
    cursor.close()


# Registra il listener per ogni nuova connessione
event.listen(engine, "connect", _set_sqlite_pragma)


# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def get_db():
    """
    Dependency per FastAPI: fornisce una sessione DB per request.
    Garantisce cleanup automatico della sessione.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
