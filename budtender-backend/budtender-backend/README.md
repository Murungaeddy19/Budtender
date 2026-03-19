# 🌿 Budtender — Backend API

FastAPI + SQLite backend for the Budtender cannabis dispensary app.

---

## 📁 Project Structure

```
budtender-backend/
├── main.py                  # App entry point
├── seed.py                  # DB seeder (products + admin user)
├── requirements.txt
├── budtender.db             # SQLite DB (auto-created on first run)
└── app/
    ├── database.py          # DB engine & session
    ├── models.py            # SQLAlchemy ORM models
    ├── schemas.py           # Pydantic request/response schemas
    ├── auth.py              # JWT + password hashing utilities
    └── routers/
        ├── auth.py          # POST /auth/register, /auth/login, GET /auth/me
        ├── products.py      # GET/POST/PUT/DELETE /products
        ├── cart.py          # GET/POST/PUT/DELETE /cart
        └── orders.py        # POST /orders/checkout, GET /orders
```

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Seed the database
```bash
python seed.py
```
This creates:
- **Admin account:** `admin@budtender.com` / `admin123`
- **9 cannabis products** (recreational + medical)

### 3. Start the server
```bash
uvicorn main:app --reload
```

API runs at: **http://localhost:8000**  
Interactive docs: **http://localhost:8000/docs**

---

## 📡 API Endpoints

### 🔐 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create new account |
| POST | `/auth/login` | Login, get JWT token |
| GET | `/auth/me` | Get current user profile |
| PUT | `/auth/me` | Update profile |

### 🌿 Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/products/` | Public | List all products (filter by category, type, search) |
| GET | `/products/{id}` | Public | Get single product |
| POST | `/products/` | Admin | Create product |
| PUT | `/products/{id}` | Admin | Update product |
| DELETE | `/products/{id}` | Admin | Delete product |

**Query params for GET /products/:**
- `?category=recreational` or `?category=medical`
- `?product_type=flower`
- `?search=blue dream`

### 🛒 Cart
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/cart/` | User | View cart with total |
| POST | `/cart/` | User | Add item `{product_id, quantity}` |
| PUT | `/cart/{item_id}` | User | Update quantity |
| DELETE | `/cart/{item_id}` | User | Remove item |
| DELETE | `/cart/` | User | Clear entire cart |

### 📦 Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/orders/checkout` | User | Checkout cart → creates order |
| GET | `/orders/` | User | List my orders |
| GET | `/orders/{id}` | User | Get order detail |
| GET | `/orders/admin/all` | Admin | All orders |
| PUT | `/orders/admin/{id}/status` | Admin | Update order status |

---

## 🗄️ Database Schema

```
users           → id, email, full_name, hashed_password, user_type, medical_card_number, ...
products        → id, name, product_type, category, thc_content, cbd_content, price, stock, ...
cart_items      → id, user_id, product_id, quantity
orders          → id, user_id, status, total_amount, notes
order_items     → id, order_id, product_id, quantity, unit_price
```

---

## 🔑 Using JWT Auth

After login, include the token in all protected requests:
```
Authorization: Bearer <your_token>
```

---

## 🔗 Connecting to Frontend

Update your React app to call `http://localhost:8000` instead of using hardcoded product data. Set the JWT token in localStorage after login and attach it to every API request.
