from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import CartItemAdd, CartItemUpdate, CartItemOut, CartOut
from app.auth import get_current_user
import app.models as models

router = APIRouter(prefix="/cart", tags=["Cart"])


def _get_cart_total(items):
    return round(sum(item.product.price * item.quantity for item in items), 2)


@router.get("/", response_model=CartOut)
def get_cart(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = (
        db.query(models.CartItem)
        .filter(models.CartItem.user_id == current_user.id)
        .all()
    )
    return CartOut(
        items=items,
        total=_get_cart_total(items),
        item_count=sum(i.quantity for i in items),
    )


@router.post("/", response_model=CartItemOut, status_code=201)
def add_to_cart(
    item_data: CartItemAdd,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(models.Product).filter(
        models.Product.id == item_data.product_id,
        models.Product.is_available == True,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or unavailable")

    if product.stock < item_data.quantity:
        raise HTTPException(status_code=400, detail=f"Only {product.stock} units in stock")

    # If already in cart, increase quantity
    existing = db.query(models.CartItem).filter(
        models.CartItem.user_id == current_user.id,
        models.CartItem.product_id == item_data.product_id,
    ).first()

    if existing:
        existing.quantity += item_data.quantity
        db.commit()
        db.refresh(existing)
        return existing

    cart_item = models.CartItem(
        user_id=current_user.id,
        product_id=item_data.product_id,
        quantity=item_data.quantity,
    )
    db.add(cart_item)
    db.commit()
    db.refresh(cart_item)
    return cart_item


@router.put("/{item_id}", response_model=CartItemOut)
def update_cart_item(
    item_id: int,
    update_data: CartItemUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(models.CartItem).filter(
        models.CartItem.id == item_id,
        models.CartItem.user_id == current_user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    if update_data.quantity <= 0:
        db.delete(item)
        db.commit()
        raise HTTPException(status_code=200, detail="Item removed from cart")

    item.quantity = update_data.quantity
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def remove_from_cart(
    item_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(models.CartItem).filter(
        models.CartItem.id == item_id,
        models.CartItem.user_id == current_user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(item)
    db.commit()


@router.delete("/", status_code=204)
def clear_cart(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(models.CartItem).filter(
        models.CartItem.user_id == current_user.id
    ).delete()
    db.commit()
