from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, SessionLocal
from app import models
from app.routers import auth, products, cart, orders, ai
from app.auth import hash_password

# Create all tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="🌿 Budtender API",
    description="Cannabis dispensary backend — products, auth, cart & orders",
    version="1.0.0",
)

# CORS — allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(ai.router)


@app.on_event("startup")
def auto_seed():
    db = SessionLocal()
    try:
        # Seed admin if not exists
        if not db.query(models.User).filter(models.User.email == "admin@budtender.com").first():
            admin = models.User(
                email="admin@budtender.com",
                full_name="Admin",
                hashed_password=hash_password("admin123"),
                user_type="admin",
            )
            db.add(admin)

        # Seed products if none exist
        if db.query(models.Product).count() == 0:
            products_data = [
                {"name": "Blue Dream", "product_type": "flower", "category": "recreational", "thc_content": "22%", "cbd_content": "1%", "price": 45.00, "weight": "3.5g", "effect": "Euphoric & Creative", "emoji": "🌿", "strain": "Sativa-dominant Hybrid", "description": "A classic West Coast strain with a sweet berry aroma.", "stock": 50},
                {"name": "CBD Relief Tincture", "product_type": "tincture", "category": "medical", "thc_content": "0.3%", "cbd_content": "25%", "price": 65.00, "weight": "30ml", "effect": "Calm & Pain Relief", "emoji": "💧", "strain": "Hemp CBD", "description": "High-potency CBD tincture for anxiety and chronic pain.", "stock": 40},
                {"name": "OG Kush", "product_type": "flower", "category": "recreational", "thc_content": "26%", "cbd_content": "0.5%", "price": 55.00, "weight": "3.5g", "effect": "Relaxing & Sleepy", "emoji": "🌱", "strain": "Indica", "description": "A legendary indica with earthy pine notes.", "stock": 35},
                {"name": "1:1 Balance Capsules", "product_type": "capsule", "category": "medical", "thc_content": "10mg", "cbd_content": "10mg", "price": 40.00, "weight": "30 caps", "effect": "Balanced & Therapeutic", "emoji": "💊", "strain": "Balanced Hybrid", "description": "Precisely dosed capsules for consistent relief.", "stock": 60},
                {"name": "Mango Haze Vape", "product_type": "vape", "category": "recreational", "thc_content": "85%", "cbd_content": "2%", "price": 50.00, "weight": "0.5g", "effect": "Uplifting & Focused", "emoji": "🟡", "strain": "Sativa", "description": "Tropical mango flavor with an energizing high.", "stock": 45},
                {"name": "Sleep & Restore Gummies", "product_type": "edible", "category": "medical", "thc_content": "5mg", "cbd_content": "15mg", "price": 35.00, "weight": "20 pcs", "effect": "Sedating & Restful", "emoji": "🍃", "strain": "Indica Blend", "description": "Nighttime formula for deep sleep.", "stock": 70},
                {"name": "Strawberry Cough", "product_type": "flower", "category": "recreational", "thc_content": "20%", "cbd_content": "0.8%", "price": 48.00, "weight": "3.5g", "effect": "Social & Happy", "emoji": "🌸", "strain": "Sativa", "description": "Sweet strawberry flavor with an uplifting buzz.", "stock": 30},
                {"name": "Pain Relief Balm", "product_type": "topical", "category": "medical", "thc_content": "100mg", "cbd_content": "200mg", "price": 55.00, "weight": "60ml", "effect": "Localized Relief", "emoji": "🧴", "strain": "Full Spectrum", "description": "Targeted topical for muscle soreness.", "stock": 25},
                {"name": "Gelato #33", "product_type": "flower", "category": "recreational", "thc_content": "25%", "cbd_content": "0.6%", "price": 60.00, "weight": "3.5g", "effect": "Euphoric & Relaxed", "emoji": "✨", "strain": "Hybrid", "description": "Dessert-like sweetness with a powerful high.", "stock": 20},
            ]
            for p in products_data:
                db.add(models.Product(**p))

        db.commit()
    finally:
        db.close()


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "🌿 Budtender API is running"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
