from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ─── AUTH / USER ──────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    user_type: str = "recreational"
    medical_card_number: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    user_type: str
    medical_card_verified: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ─── PRODUCT ──────────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    product_type: str
    category: str
    strain: Optional[str] = None
    thc_content: Optional[str] = None
    cbd_content: Optional[str] = None
    weight: Optional[str] = None
    effect: Optional[str] = None
    price: float
    stock: int = 100
    emoji: str = "🌿"


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    is_available: Optional[bool] = None
    thc_content: Optional[str] = None
    cbd_content: Optional[str] = None
    effect: Optional[str] = None


class ProductOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    product_type: str
    category: str
    strain: Optional[str]
    thc_content: Optional[str]
    cbd_content: Optional[str]
    weight: Optional[str]
    effect: Optional[str]
    price: float
    stock: int
    emoji: str
    is_available: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── CART ─────────────────────────────────────────────────────────────────────

class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    added_at: datetime
    product: ProductOut

    class Config:
        from_attributes = True


class CartOut(BaseModel):
    items: List[CartItemOut]
    total: float
    item_count: int


# ─── ORDER ────────────────────────────────────────────────────────────────────

class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    product: ProductOut

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    user_id: int
    status: str
    total_amount: float
    notes: Optional[str]
    created_at: datetime
    items: List[OrderItemOut]

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
