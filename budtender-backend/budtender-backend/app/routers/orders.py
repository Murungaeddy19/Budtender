from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas import OrderOut, OrderStatusUpdate
from app.auth import get_current_user, require_admin
import app.models as models

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/checkout", response_model=OrderOut, status_code=201)
def checkout(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cart_items = (
        db.query(models.CartItem)
        .filter(models.CartItem.user_id == current_user.id)
        .all()
    )
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Validate stock for all items first
    for item in cart_items:
        if item.product.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {item.product.name}"
            )

    total = round(sum(i.product.price * i.quantity for i in cart_items), 2)

    order = models.Order(
        user_id=current_user.id,
        status="pending",
        total_amount=total,
    )
    db.add(order)
    db.flush()  # Get order ID before committing

    for item in cart_items:
        order_item = models.OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.product.price,
        )
        db.add(order_item)
        # Deduct stock
        item.product.stock -= item.quantity

    # Clear the cart
    db.query(models.CartItem).filter(
        models.CartItem.user_id == current_user.id
    ).delete()

    db.commit()
    db.refresh(order)
    return order


@router.get("/", response_model=List[OrderOut])
def list_my_orders(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Order)
        .filter(models.Order.user_id == current_user.id)
        .order_by(models.Order.created_at.desc())
        .all()
    )


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id and current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return order


# ─── ADMIN ONLY ───────────────────────────────────────────────────────────────

@router.get("/admin/all", response_model=List[OrderOut])
def list_all_orders(
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).all()


@router.put("/admin/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    valid_statuses = ["pending", "confirmed", "processing", "completed", "cancelled"]
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = update.status
    if update.notes:
        order.notes = update.notes
    db.commit()
    db.refresh(order)
    return order
