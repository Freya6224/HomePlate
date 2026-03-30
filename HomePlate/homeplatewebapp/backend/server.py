from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy import select, func, update, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
import os
import logging
import bcrypt
import jwt
import random
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from enum import Enum

from database import get_db, AsyncSessionLocal
from models import User, FoodItem, Order, OrderItem, Favorite, Review, LoginAttempt

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# JWT Config
JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ.get("JWT_SECRET", "default-secret-change-in-production-123456789")

# Password utilities
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# Token utilities
def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

# Create the main app
app = FastAPI(title="Home Plate API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    customer = "customer"
    seller = "seller"

class OrderStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    preparing = "preparing"
    ready = "ready"
    delivered = "delivered"
    cancelled = "cancelled"

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str

class FoodItemCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    is_available: bool = True
    image_url: Optional[str] = None

class FoodItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    is_available: Optional[bool] = None
    image_url: Optional[str] = None

class OrderItemCreate(BaseModel):
    food_item_id: str
    quantity: int

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    delivery_address: str
    notes: Optional[str] = None

class ReviewCreate(BaseModel):
    food_item_id: str
    rating: int = Field(ge=1, le=5)
    comment: str

# Auth dependency
async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        result = await db.execute(select(User).where(User.id == payload["sub"]))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "created_at": user.created_at.isoformat()
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Brute force protection
async def check_brute_force(db: AsyncSession, identifier: str):
    result = await db.execute(select(LoginAttempt).where(LoginAttempt.identifier == identifier))
    attempt = result.scalar_one_or_none()
    if attempt and attempt.locked_until:
        if datetime.now(timezone.utc) < attempt.locked_until:
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")

async def record_failed_attempt(db: AsyncSession, identifier: str):
    result = await db.execute(select(LoginAttempt).where(LoginAttempt.identifier == identifier))
    attempt = result.scalar_one_or_none()
    if attempt:
        new_count = attempt.count + 1
        attempt.count = new_count
        attempt.updated_at = datetime.now(timezone.utc)
        if new_count >= 5:
            attempt.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
    else:
        attempt = LoginAttempt(identifier=identifier, count=1)
        db.add(attempt)
    await db.commit()

async def clear_failed_attempts(db: AsyncSession, identifier: str):
    await db.execute(delete(LoginAttempt).where(LoginAttempt.identifier == identifier))
    await db.commit()

# Placeholder food images
FOOD_IMAGES = [
    "https://images.pexels.com/photos/7111387/pexels-photo-7111387.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/29075346/pexels-photo-29075346.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.unsplash.com/photo-1625938144755-652e08e359b7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwzfHxydXN0aWMlMjBmb29kJTIwc3ByZWFkfGVufDB8fHx8MTc3NDgzODY1OXww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1686431984279-861a8d22c5f2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwxfHxiYWtpbmclMjBmcmVzaCUyMGJyZWFkfGVufDB8fHx8MTc3NDgzODY2Mnww&ixlib=rb-4.1.0&q=85"
]

# ============ AUTH ROUTES ============

@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response, db: AsyncSession = Depends(get_db)):
    email = user_data.email.lower()
    result = await db.execute(select(User).where(User.email == email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=email,
        password_hash=hash_password(user_data.password),
        name=user_data.name,
        role=user_data.role.value
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    access_token = create_access_token(user.id, email, user.role)
    refresh_token = create_refresh_token(user.id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "created_at": user.created_at.isoformat()
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    email = credentials.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    
    await check_brute_force(db, identifier)
    
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(credentials.password, user.password_hash):
        await record_failed_attempt(db, identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    await clear_failed_attempts(db, identifier)
    
    access_token = create_access_token(user.id, email, user.role)
    refresh_token = create_refresh_token(user.id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "created_at": user.created_at.isoformat()
    }

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    refresh = request.cookies.get("refresh_token")
    if not refresh:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(refresh, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        result = await db.execute(select(User).where(User.id == payload["sub"]))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access_token = create_access_token(user.id, user.email, user.role)
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ============ FOOD ITEMS ROUTES ============

@api_router.post("/food-items")
async def create_food_item(item: FoodItemCreate, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user["role"] != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can create food items")
    
    image_url = item.image_url or random.choice(FOOD_IMAGES)
    
    food_item = FoodItem(
        seller_id=user["id"],
        name=item.name,
        description=item.description,
        price=item.price,
        category=item.category,
        is_available=item.is_available,
        image_url=image_url
    )
    db.add(food_item)
    await db.commit()
    await db.refresh(food_item)
    
    # Get seller name
    result = await db.execute(select(User).where(User.id == user["id"]))
    seller = result.scalar_one_or_none()
    
    return {
        "id": food_item.id,
        "seller_id": food_item.seller_id,
        "seller_name": seller.name if seller else "Unknown",
        "name": food_item.name,
        "description": food_item.description,
        "price": food_item.price,
        "category": food_item.category,
        "is_available": food_item.is_available,
        "image_url": food_item.image_url,
        "avg_rating": food_item.avg_rating,
        "review_count": food_item.review_count,
        "created_at": food_item.created_at.isoformat()
    }

@api_router.get("/food-items")
async def get_food_items(
    search: Optional[str] = None,
    category: Optional[str] = None,
    seller_id: Optional[str] = None,
    available_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    query = select(FoodItem).options(selectinload(FoodItem.seller))
    
    if search:
        query = query.where(
            (FoodItem.name.ilike(f"%{search}%")) | 
            (FoodItem.description.ilike(f"%{search}%"))
        )
    if category:
        query = query.where(FoodItem.category == category)
    if seller_id:
        query = query.where(FoodItem.seller_id == seller_id)
    if available_only:
        query = query.where(FoodItem.is_available == True)
    
    result = await db.execute(query.order_by(FoodItem.created_at.desc()))
    items = result.scalars().all()
    
    return [
        {
            "id": item.id,
            "seller_id": item.seller_id,
            "seller_name": item.seller.name if item.seller else "Unknown",
            "name": item.name,
            "description": item.description,
            "price": item.price,
            "category": item.category,
            "is_available": item.is_available,
            "image_url": item.image_url,
            "avg_rating": item.avg_rating,
            "review_count": item.review_count,
            "created_at": item.created_at.isoformat()
        }
        for item in items
    ]

@api_router.get("/food-items/{item_id}")
async def get_food_item(item_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(FoodItem).options(selectinload(FoodItem.seller)).where(FoodItem.id == item_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    
    return {
        "id": item.id,
        "seller_id": item.seller_id,
        "seller_name": item.seller.name if item.seller else "Unknown",
        "name": item.name,
        "description": item.description,
        "price": item.price,
        "category": item.category,
        "is_available": item.is_available,
        "image_url": item.image_url,
        "avg_rating": item.avg_rating,
        "review_count": item.review_count,
        "created_at": item.created_at.isoformat()
    }

@api_router.put("/food-items/{item_id}")
async def update_food_item(item_id: str, item_update: FoodItemUpdate, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user["role"] != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can update food items")
    
    result = await db.execute(select(FoodItem).where(FoodItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    if item.seller_id != user["id"]:
        raise HTTPException(status_code=403, detail="You can only update your own items")
    
    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
    
    await db.commit()
    await db.refresh(item)
    
    result = await db.execute(select(User).where(User.id == item.seller_id))
    seller = result.scalar_one_or_none()
    
    return {
        "id": item.id,
        "seller_id": item.seller_id,
        "seller_name": seller.name if seller else "Unknown",
        "name": item.name,
        "description": item.description,
        "price": item.price,
        "category": item.category,
        "is_available": item.is_available,
        "image_url": item.image_url,
        "avg_rating": item.avg_rating,
        "review_count": item.review_count,
        "created_at": item.created_at.isoformat()
    }

@api_router.delete("/food-items/{item_id}")
async def delete_food_item(item_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user["role"] != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can delete food items")
    
    result = await db.execute(select(FoodItem).where(FoodItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    if item.seller_id != user["id"]:
        raise HTTPException(status_code=403, detail="You can only delete your own items")
    
    await db.delete(item)
    await db.commit()
    return {"message": "Food item deleted"}

@api_router.get("/my-food-items")
async def get_my_food_items(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user["role"] != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can access this")
    
    result = await db.execute(
        select(FoodItem).where(FoodItem.seller_id == user["id"]).order_by(FoodItem.created_at.desc())
    )
    items = result.scalars().all()
    
    return [
        {
            "id": item.id,
            "seller_id": item.seller_id,
            "seller_name": user["name"],
            "name": item.name,
            "description": item.description,
            "price": item.price,
            "category": item.category,
            "is_available": item.is_available,
            "image_url": item.image_url,
            "avg_rating": item.avg_rating,
            "review_count": item.review_count,
            "created_at": item.created_at.isoformat()
        }
        for item in items
    ]

@api_router.get("/categories")
async def get_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FoodItem.category).distinct())
    categories = [row[0] for row in result.all() if row[0]]
    return categories

# ============ ORDERS ROUTES ============

@api_router.post("/orders")
async def create_order(order: OrderCreate, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can place orders")
    
    order_items = []
    total_amount = 0.0
    seller_id = None
    seller_name = None
    
    for item in order.items:
        result = await db.execute(
            select(FoodItem).options(selectinload(FoodItem.seller)).where(FoodItem.id == item.food_item_id)
        )
        food = result.scalar_one_or_none()
        if not food:
            raise HTTPException(status_code=404, detail=f"Food item {item.food_item_id} not found")
        if not food.is_available:
            raise HTTPException(status_code=400, detail=f"{food.name} is not available")
        
        if seller_id is None:
            seller_id = food.seller_id
            seller_name = food.seller.name if food.seller else "Unknown"
        elif seller_id != food.seller_id:
            raise HTTPException(status_code=400, detail="All items must be from the same seller")
        
        item_total = food.price * item.quantity
        total_amount += item_total
        order_items.append({
            "food_item_id": item.food_item_id,
            "name": food.name,
            "price": food.price,
            "quantity": item.quantity,
            "subtotal": item_total
        })
    
    # Create order
    new_order = Order(
        customer_id=user["id"],
        seller_id=seller_id,
        total_amount=total_amount,
        status="pending",
        delivery_address=order.delivery_address,
        notes=order.notes
    )
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)
    
    # Create order items
    for item_data in order_items:
        order_item = OrderItem(
            order_id=new_order.id,
            food_item_id=item_data["food_item_id"],
            name=item_data["name"],
            price=item_data["price"],
            quantity=item_data["quantity"],
            subtotal=item_data["subtotal"]
        )
        db.add(order_item)
    await db.commit()
    
    return {
        "id": new_order.id,
        "customer_id": new_order.customer_id,
        "customer_name": user["name"],
        "seller_id": seller_id,
        "seller_name": seller_name,
        "items": order_items,
        "total_amount": total_amount,
        "status": new_order.status,
        "delivery_address": new_order.delivery_address,
        "notes": new_order.notes,
        "created_at": new_order.created_at.isoformat()
    }

@api_router.get("/orders")
async def get_orders(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user["role"] == "customer":
        query = select(Order).where(Order.customer_id == user["id"])
    else:
        query = select(Order).where(Order.seller_id == user["id"])
    
    result = await db.execute(
        query.options(selectinload(Order.items), selectinload(Order.customer))
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    
    order_list = []
    for order in orders:
        # Get seller name
        seller_result = await db.execute(select(User).where(User.id == order.seller_id))
        seller = seller_result.scalar_one_or_none()
        
        order_list.append({
            "id": order.id,
            "customer_id": order.customer_id,
            "customer_name": order.customer.name if order.customer else "Unknown",
            "seller_id": order.seller_id,
            "seller_name": seller.name if seller else "Unknown",
            "items": [
                {
                    "food_item_id": item.food_item_id,
                    "name": item.name,
                    "price": item.price,
                    "quantity": item.quantity,
                    "subtotal": item.subtotal
                }
                for item in order.items
            ],
            "total_amount": order.total_amount,
            "status": order.status,
            "delivery_address": order.delivery_address,
            "notes": order.notes,
            "created_at": order.created_at.isoformat()
        })
    
    return order_list

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order).options(selectinload(Order.items), selectinload(Order.customer))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.customer_id != user["id"] and order.seller_id != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    seller_result = await db.execute(select(User).where(User.id == order.seller_id))
    seller = seller_result.scalar_one_or_none()
    
    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "customer_name": order.customer.name if order.customer else "Unknown",
        "seller_id": order.seller_id,
        "seller_name": seller.name if seller else "Unknown",
        "items": [
            {
                "food_item_id": item.food_item_id,
                "name": item.name,
                "price": item.price,
                "quantity": item.quantity,
                "subtotal": item.subtotal
            }
            for item in order.items
        ],
        "total_amount": order.total_amount,
        "status": order.status,
        "delivery_address": order.delivery_address,
        "notes": order.notes,
        "created_at": order.created_at.isoformat()
    }

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: OrderStatus, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if status == OrderStatus.cancelled:
        if order.customer_id != user["id"] and order.seller_id != user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        if order.seller_id != user["id"]:
            raise HTTPException(status_code=403, detail="Only seller can update order status")
    
    order.status = status.value
    await db.commit()
    await db.refresh(order)
    
    return {"id": order.id, "status": order.status, "message": "Order status updated"}

# ============ FAVORITES ROUTES ============

@api_router.post("/favorites/{food_item_id}")
async def add_favorite(food_item_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can add favorites")
    
    result = await db.execute(select(FoodItem).where(FoodItem.id == food_item_id))
    food = result.scalar_one_or_none()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")
    
    existing = await db.execute(
        select(Favorite).where(
            Favorite.customer_id == user["id"],
            Favorite.food_item_id == food_item_id
        )
    )
    if existing.scalar_one_or_none():
        return {"message": "Already in favorites"}
    
    favorite = Favorite(customer_id=user["id"], food_item_id=food_item_id)
    db.add(favorite)
    await db.commit()
    return {"message": "Added to favorites"}

@api_router.delete("/favorites/{food_item_id}")
async def remove_favorite(food_item_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can remove favorites")
    
    result = await db.execute(
        select(Favorite).where(
            Favorite.customer_id == user["id"],
            Favorite.food_item_id == food_item_id
        )
    )
    favorite = result.scalar_one_or_none()
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    await db.delete(favorite)
    await db.commit()
    return {"message": "Removed from favorites"}

@api_router.get("/favorites")
async def get_favorites(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can view favorites")
    
    result = await db.execute(
        select(Favorite).options(selectinload(Favorite.food_item).selectinload(FoodItem.seller))
        .where(Favorite.customer_id == user["id"])
    )
    favorites = result.scalars().all()
    
    return [
        {
            "id": fav.food_item.id,
            "seller_id": fav.food_item.seller_id,
            "seller_name": fav.food_item.seller.name if fav.food_item.seller else "Unknown",
            "name": fav.food_item.name,
            "description": fav.food_item.description,
            "price": fav.food_item.price,
            "category": fav.food_item.category,
            "is_available": fav.food_item.is_available,
            "image_url": fav.food_item.image_url,
            "avg_rating": fav.food_item.avg_rating,
            "review_count": fav.food_item.review_count,
            "is_favorite": True,
            "created_at": fav.food_item.created_at.isoformat()
        }
        for fav in favorites if fav.food_item
    ]

# ============ REVIEWS ROUTES ============

@api_router.post("/reviews")
async def create_review(review: ReviewCreate, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can create reviews")
    
    result = await db.execute(select(FoodItem).where(FoodItem.id == review.food_item_id))
    food = result.scalar_one_or_none()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")
    
    existing = await db.execute(
        select(Review).where(
            Review.food_item_id == review.food_item_id,
            Review.customer_id == user["id"]
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You already reviewed this item")
    
    new_review = Review(
        food_item_id=review.food_item_id,
        customer_id=user["id"],
        rating=review.rating,
        comment=review.comment
    )
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)
    
    # Update food item rating
    result = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id))
        .where(Review.food_item_id == review.food_item_id)
    )
    row = result.one()
    avg_rating = float(row[0]) if row[0] else 0.0
    review_count = row[1]
    
    food.avg_rating = round(avg_rating, 1)
    food.review_count = review_count
    await db.commit()
    
    return {
        "id": new_review.id,
        "food_item_id": new_review.food_item_id,
        "customer_id": new_review.customer_id,
        "customer_name": user["name"],
        "rating": new_review.rating,
        "comment": new_review.comment,
        "created_at": new_review.created_at.isoformat()
    }

@api_router.get("/reviews/{food_item_id}")
async def get_reviews(food_item_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Review).options(selectinload(Review.customer))
        .where(Review.food_item_id == food_item_id)
        .order_by(Review.created_at.desc())
    )
    reviews = result.scalars().all()
    
    return [
        {
            "id": review.id,
            "food_item_id": review.food_item_id,
            "customer_id": review.customer_id,
            "customer_name": review.customer.name if review.customer else "Unknown",
            "rating": review.rating,
            "comment": review.comment,
            "created_at": review.created_at.isoformat()
        }
        for review in reviews
    ]

# ============ SELLERS LIST ============

@api_router.get("/sellers")
async def get_sellers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(
            FoodItem.seller_id,
            User.name,
            func.count(FoodItem.id).label('item_count')
        )
        .join(User, User.id == FoodItem.seller_id)
        .group_by(FoodItem.seller_id, User.name)
    )
    sellers = [
        {"id": row[0], "name": row[1], "item_count": row[2]}
        for row in result.all()
    ]
    return sellers

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Welcome to Home Plate API - Powered by Supabase"}

# Include the router in the main app
app.include_router(api_router)

# CORS Configuration
frontend_url = os.environ.get('FRONTEND_URL', os.environ.get('CORS_ORIGINS', '*'))
origins = frontend_url.split(',') if ',' in frontend_url else [frontend_url]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=origins if origins != ['*'] else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup():
    # Write test credentials
    Path("/app/memory").mkdir(exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write("# Test Credentials\n\n")
        f.write("## Test Customer\n")
        f.write("- Email: customer@test.com\n")
        f.write("- Password: Test123!\n")
        f.write("- Role: customer\n\n")
        f.write("## Test Seller\n")
        f.write("- Email: seller@test.com\n")
        f.write("- Password: Test123!\n")
        f.write("- Role: seller\n\n")
        f.write("## Database\n")
        f.write("- Using: Supabase PostgreSQL\n\n")
        f.write("## Endpoints\n")
        f.write("- POST /api/auth/register\n")
        f.write("- POST /api/auth/login\n")
        f.write("- POST /api/auth/logout\n")
        f.write("- GET /api/auth/me\n")
    
    logger.info("Home Plate API started with Supabase database")
