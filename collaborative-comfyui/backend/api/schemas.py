from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    workflow_json: Dict[str, Any]

class WorkflowCreate(WorkflowBase):
    pass

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    workflow_json: Optional[Dict[str, Any]] = None

class WorkflowResponse(WorkflowBase):
    id: int
    creator_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class OutputBase(BaseModel):
    filename: str
    file_path: str
    file_type: str
    metadata: Optional[Dict[str, Any]] = None
    workflow_id: int

class OutputCreate(OutputBase):
    pass

class OutputResponse(OutputBase):
    id: int
    creator_id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

class ComfyUIPrompt(BaseModel):
    prompt: Dict[str, Any]
    workflow_id: Optional[int] = None

class ComfyUIResponse(BaseModel):
    prompt_id: str
    status: str
    outputs: Optional[List[Dict[str, Any]]] = None
