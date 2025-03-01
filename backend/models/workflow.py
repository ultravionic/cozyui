from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, BigInteger, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime

from database.db import Base

class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    workflow_json = Column(JSON, nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"))
    is_public = Column(Boolean, default=False)
    is_template = Column(Boolean, default=False)
    tags = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", backref="workflows")
    outputs = relationship("Output", back_populates="workflow")

class Output(Base):
    __tablename__ = "outputs"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=True)
    file_type = Column(String, nullable=False)  # image, video, etc.
    file_size = Column(BigInteger, nullable=False)
    description = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    workflow = relationship("Workflow", back_populates="outputs")
    user = relationship("User", backref="outputs")

# Pydantic models for API
class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    
class WorkflowCreate(WorkflowBase):
    workflow_json: Dict[str, Any]
    is_public: bool = False
    is_template: bool = False
    tags: Optional[List[str]] = None
    
class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    workflow_json: Optional[Dict[str, Any]] = None
    is_public: Optional[bool] = None
    is_template: Optional[bool] = None
    tags: Optional[List[str]] = None
    
class WorkflowResponse(WorkflowBase):
    id: int
    workflow_json: Dict[str, Any]
    creator_id: int
    is_public: bool
    is_template: bool
    tags: Optional[List[str]]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        orm_mode = True
        
class OutputCreate(BaseModel):
    workflow_id: int
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
class OutputResponse(BaseModel):
    id: int
    workflow_id: int
    user_id: int
    filename: str
    original_filename: Optional[str]
    file_type: str
    file_size: int
    description: Optional[str]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        orm_mode = True
