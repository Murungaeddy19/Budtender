from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app import models
from app.routers import auth, products, cart, orders, ai

# Create all tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="🌿 Budtender API",
    description="Cannabis dispensary backend — products, auth, cart & orders",
    version="1.0.0",
)

# CORS — allow your React frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(ai.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "🌿 Budtender API is running"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
