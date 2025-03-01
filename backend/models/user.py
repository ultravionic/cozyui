from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime

from database.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    display_name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    color = Column(String, nullable=False, default="#3498db")  # User's cursor color
    role = Column(String, nullable=False, default="user")  # user, moderator, admin
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# Pydantic models for API
class UserBase(BaseModel):
    username: str
    email: EmailStr
    
class UserCreate(UserBase):
    password: str
    role: str = "user"
    
    @validator('role')
    def validate_role(cls, v):
        if v not in ["user", "moderator", "admin"]:
            raise ValueError('Role must be one of: user, moderator, admin')
        return v
    
class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    email: Optional[EmailStr] = None
    color: Optional[str] = None
    role: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None
    
    @validator('role')
    def validate_role(cls, v):
        if v is not None and v not in ["user", "moderator", "admin"]:
            raise ValueError('Role must be one of: user, moderator, admin')
        return v
    
    @validator('color')
    def validate_color(cls, v):
        if v is not None and not v.startswith('#'):
            raise ValueError('Color must be a valid hex color code starting with #')
        return v
    
class UserResponse(BaseModel):
    id: int
    username: str
    display_name: Optional[str]
    email: Optional[str]
    color: str
    role: str
    is_active: bool
    last_login: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        orm_mode = True
