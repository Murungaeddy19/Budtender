from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas import ProductCreate, ProductUpdate, ProductOut
from app.auth import get_current_user, require_admin
import app.models as models

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/", response_model=List[ProductOut])
def list_products(
    category: Optional[str] = Query(None, description="recreational or medical"),
    product_type: Optional[str] = Query(None, description="flower, vape, edible, etc."),
    search: Optional[str] = Query(None),
    available_only: bool = True,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(models.Product)

    if available_only:
        query = query.filter(models.Product.is_available == True)
    if category:
        query = query.filter(models.Product.category == category)
    if product_type:
        query = query.filter(models.Product.product_type == product_type)
    if search:
        query = query.filter(
            models.Product.name.ilike(f"%{search}%") |
            models.Product.effect.ilike(f"%{search}%") |
            models.Product.strain.ilike(f"%{search}%")
        )

    return query.offset(skip).limit(limit).all()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=ProductOut, status_code=201)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    product = models.Product(**product_data.dict())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, value in product_data.dict(exclude_unset=True).items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
