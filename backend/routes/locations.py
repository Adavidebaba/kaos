from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database

router = APIRouter(
    prefix="/locations",
    tags=["locations"],
)

@router.post("/", response_model=schemas.Location)
def create_location(location: schemas.LocationCreate, db: Session = Depends(database.get_db)):
    # Check if ID exists if provided
    if location.id:
        existing = db.query(models.Location).filter(models.Location.id == location.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Location ID already exists")

    db_location = models.Location(**location.dict())
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location

@router.get("/", response_model=List[schemas.Location])
def read_locations(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    locations = db.query(models.Location).filter(models.Location.deleted_at == None).offset(skip).limit(limit).all()
    return locations

@router.get("/{location_id}", response_model=schemas.Location)
def read_location(location_id: int, db: Session = Depends(database.get_db)):
    location = db.query(models.Location).filter(models.Location.id == location_id).first()
    if location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return location
