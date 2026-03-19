"""
Run this once to seed the database with products and an admin user.
Usage: python seed.py
"""

from app.database import SessionLocal, engine
from app import models
from app.auth import hash_password

models.Base.metadata.create_all(bind=engine)

PRODUCTS = [
    {"name": "Blue Dream", "product_type": "flower", "category": "recreational", "thc_content": "22%", "cbd_content": "1%", "price": 45.00, "weight": "3.5g", "effect": "Euphoric & Creative", "emoji": "🌿", "strain": "Sativa-dominant Hybrid", "description": "A classic West Coast strain with a sweet berry aroma. Perfect for daytime creativity.", "stock": 50},
    {"name": "CBD Relief Tincture", "product_type": "tincture", "category": "medical", "thc_content": "0.3%", "cbd_content": "25%", "price": 65.00, "weight": "30ml", "effect": "Calm & Pain Relief", "emoji": "💧", "strain": "Hemp CBD", "description": "High-potency CBD tincture for anxiety, inflammation, and chronic pain management.", "stock": 40},
    {"name": "OG Kush", "product_type": "flower", "category": "recreational", "thc_content": "26%", "cbd_content": "0.5%", "price": 55.00, "weight": "3.5g", "effect": "Relaxing & Sleepy", "emoji": "🌱", "strain": "Indica", "description": "A legendary indica with earthy pine notes. Great for evening wind-down.", "stock": 35},
    {"name": "1:1 Balance Capsules", "product_type": "capsule", "category": "medical", "thc_content": "10mg", "cbd_content": "10mg", "price": 40.00, "weight": "30 caps", "effect": "Balanced & Therapeutic", "emoji": "💊", "strain": "Balanced Hybrid", "description": "Precisely dosed capsules for consistent, long-lasting medical relief.", "stock": 60},
    {"name": "Mango Haze Vape", "product_type": "vape", "category": "recreational", "thc_content": "85%", "cbd_content": "2%", "price": 50.00, "weight": "0.5g", "effect": "Uplifting & Focused", "emoji": "🟡", "strain": "Sativa", "description": "Tropical mango flavor with an energizing, clear-headed high.", "stock": 45},
    {"name": "Sleep & Restore Gummies", "product_type": "edible", "category": "medical", "thc_content": "5mg", "cbd_content": "15mg", "price": 35.00, "weight": "20 pcs", "effect": "Sedating & Restful", "emoji": "🍃", "strain": "Indica Blend", "description": "Nighttime formula with melatonin and calming terpenes for deep sleep.", "stock": 70},
    {"name": "Strawberry Cough", "product_type": "flower", "category": "recreational", "thc_content": "20%", "cbd_content": "0.8%", "price": 48.00, "weight": "3.5g", "effect": "Social & Happy", "emoji": "🌸", "strain": "Sativa", "description": "Sweet strawberry flavor with an uplifting social buzz. Perfect for gatherings.", "stock": 30},
    {"name": "Pain Relief Balm", "product_type": "topical", "category": "medical", "thc_content": "100mg", "cbd_content": "200mg", "price": 55.00, "weight": "60ml", "effect": "Localized Relief", "emoji": "🧴", "strain": "Full Spectrum", "description": "Targeted topical for muscle soreness, joint pain, and inflammation.", "stock": 25},
    {"name": "Gelato #33", "product_type": "flower", "category": "recreational", "thc_content": "25%", "cbd_content": "0.6%", "price": 60.00, "weight": "3.5g", "effect": "Euphoric & Relaxed", "emoji": "✨", "strain": "Hybrid", "description": "Dessert-like sweetness with a powerful, balanced high for experienced users.", "stock": 20},
]

ADMIN_USER = {
    "email": "admin@budtender.com",
    "full_name": "Admin User",
    "password": "admin123",
    "user_type": "admin",
}


def seed():
    db = SessionLocal()
    try:
        # Seed admin
        if not db.query(models.User).filter(models.User.email == ADMIN_USER["email"]).first():
            admin = models.User(
                email=ADMIN_USER["email"],
                full_name=ADMIN_USER["full_name"],
                hashed_password=hash_password(ADMIN_USER["password"]),
                user_type=ADMIN_USER["user_type"],
            )
            db.add(admin)
            print(f"✅ Admin created: {ADMIN_USER['email']} / {ADMIN_USER['password']}")
        else:
            print("⚠️  Admin already exists, skipping.")

        # Seed products
        existing_count = db.query(models.Product).count()
        if existing_count == 0:
            for p in PRODUCTS:
                db.add(models.Product(**p))
            print(f"✅ {len(PRODUCTS)} products seeded.")
        else:
            print(f"⚠️  {existing_count} products already exist, skipping seed.")

        db.commit()
        print("\n🌿 Database seeded successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
