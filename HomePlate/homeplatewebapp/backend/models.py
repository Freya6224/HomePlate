
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = 'users'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, index=True)  # 'customer' or 'seller'
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    # Relationships
    food_items = relationship('FoodItem', back_populates='seller', cascade='all, delete-orphan')
    customer_orders = relationship('Order', back_populates='customer', foreign_keys='Order.customer_id', cascade='all, delete-orphan')
    favorites = relationship('Favorite', back_populates='customer', cascade='all, delete-orphan')
    reviews = relationship('Review', back_populates='customer', cascade='all, delete-orphan')

class FoodItem(Base):
    __tablename__ = 'food_items'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    seller_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    is_available = Column(Boolean, default=True, index=True)
    image_url = Column(Text, nullable=True)
    avg_rating = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    # Relationships
    seller = relationship('User', back_populates='food_items')
    order_items = relationship('OrderItem', back_populates='food_item')
    favorites = relationship('Favorite', back_populates='food_item', cascade='all, delete-orphan')
    reviews = relationship('Review', back_populates='food_item', cascade='all, delete-orphan')

class Order(Base):
    __tablename__ = 'orders'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    customer_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    seller_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    total_amount = Column(Float, nullable=False)
    status = Column(String(20), default='pending', index=True)
    delivery_address = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    # Relationships
    customer = relationship('User', back_populates='customer_orders', foreign_keys=[customer_id])
    items = relationship('OrderItem', back_populates='order', cascade='all, delete-orphan')

class OrderItem(Base):
    __tablename__ = 'order_items'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey('orders.id', ondelete='CASCADE'), nullable=False, index=True)
    food_item_id = Column(String(36), ForeignKey('food_items.id', ondelete='SET NULL'), nullable=True)
    name = Column(String(255), nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    subtotal = Column(Float, nullable=False)
    
    # Relationships
    order = relationship('Order', back_populates='items')
    food_item = relationship('FoodItem', back_populates='order_items')

class Favorite(Base):
    __tablename__ = 'favorites'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    customer_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    food_item_id = Column(String(36), ForeignKey('food_items.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    # Relationships
    customer = relationship('User', back_populates='favorites')
    food_item = relationship('FoodItem', back_populates='favorites')
    
    __table_args__ = (
        Index('ix_favorites_customer_food', 'customer_id', 'food_item_id', unique=True),
    )

class Review(Base):
    __tablename__ = 'reviews'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    food_item_id = Column(String(36), ForeignKey('food_items.id', ondelete='CASCADE'), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    # Relationships
    food_item = relationship('FoodItem', back_populates='reviews')
    customer = relationship('User', back_populates='reviews')
    
    __table_args__ = (
        Index('ix_reviews_food_customer', 'food_item_id', 'customer_id', unique=True),
    )

class LoginAttempt(Base):
    __tablename__ = 'login_attempts'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    identifier = Column(String(255), nullable=False, index=True)
    count = Column(Integer, default=1)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
