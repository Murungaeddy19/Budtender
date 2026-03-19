from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import UserRegister, UserLogin, Token, UserOut
from app.auth import hash_password, verify_password, create_access_token, get_current_user
import app.models as models

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if email already exists
    existing = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Validate user_type
    valid_types = ["recreational", "medical", "admin"]
    if user_data.user_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"user_type must be one of {valid_types}")

    user = models.User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password),
        user_type=user_data.user_type,
        medical_card_number=user_data.medical_card_number,
        medical_card_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, token_type="bearer", user=UserOut.from_orm(user))


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, token_type="bearer", user=UserOut.from_orm(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(
    full_name: str = None,
    medical_card_number: str = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if full_name:
        current_user.full_name = full_name
    if medical_card_number:
        current_user.medical_card_number = medical_card_number
        current_user.user_type = "medical"
    db.commit()
    db.refresh(current_user)
    return current_user
