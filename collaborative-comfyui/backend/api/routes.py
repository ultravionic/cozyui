from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import os
from datetime import datetime

from database.session import get_db
from models.user import User
from models.workflow import Workflow, Output
from auth.security import get_current_active_user
from api.schemas import (
    WorkflowCreate,
    WorkflowUpdate,
    WorkflowResponse,
    OutputCreate,
    OutputResponse,
    ComfyUIPrompt,
    ComfyUIResponse,
)
from services.comfyui_service import ComfyUIService

router = APIRouter()
comfyui_service = ComfyUIService(os.environ.get("COMFYUI_API_URL", "http://comfyui:8188/"))

# Workflow endpoints
@router.post("/workflows", response_model=WorkflowResponse)
async def create_workflow(
    workflow: WorkflowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new workflow.
    """
    db_workflow = Workflow(
        name=workflow.name,
        description=workflow.description,
        workflow_json=workflow.workflow_json,
        creator_id=current_user.id
    )
    
    db.add(db_workflow)
    db.commit()
    db.refresh(db_workflow)
    
    return db_workflow

@router.get("/workflows", response_model=List[WorkflowResponse])
async def read_workflows(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all workflows.
    """
    workflows = db.query(Workflow).offset(skip).limit(limit).all()
    return workflows

@router.get("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def read_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific workflow.
    """
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    
    if workflow is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    return workflow

@router.put("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: int,
    workflow_update: WorkflowUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a workflow.
    """
    db_workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    
    if db_workflow is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    if workflow_update.name is not None:
        db_workflow.name = workflow_update.name
    
    if workflow_update.description is not None:
        db_workflow.description = workflow_update.description
    
    if workflow_update.workflow_json is not None:
        db_workflow.workflow_json = workflow_update.workflow_json
    
    db.commit()
    db.refresh(db_workflow)
    
    return db_workflow

@router.delete("/workflows/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a workflow.
    """
    db_workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    
    if db_workflow is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    # Check if user is admin or creator
    if not current_user.is_admin and db_workflow.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this workflow"
        )
    
    db.delete(db_workflow)
    db.commit()
    
    return None

# Output endpoints
@router.post("/outputs", response_model=OutputResponse)
async def create_output(
    output: OutputCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new output record.
    """
    # Check if workflow exists
    workflow = db.query(Workflow).filter(Workflow.id == output.workflow_id).first()
    if workflow is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    db_output = Output(
        filename=output.filename,
        file_path=output.file_path,
        file_type=output.file_type,
        metadata=output.metadata,
        workflow_id=output.workflow_id,
        creator_id=current_user.id
    )
    
    db.add(db_output)
    db.commit()
    db.refresh(db_output)
    
    return db_output

@router.get("/outputs", response_model=List[OutputResponse])
async def read_outputs(
    workflow_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all outputs, optionally filtered by workflow.
    """
    query = db.query(Output)
    
    if workflow_id is not None:
        query = query.filter(Output.workflow_id == workflow_id)
    
    outputs = query.offset(skip).limit(limit).all()
    return outputs

@router.get("/outputs/{output_id}", response_model=OutputResponse)
async def read_output(
    output_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific output.
    """
    output = db.query(Output).filter(Output.id == output_id).first()
    
    if output is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output not found"
        )
    
    return output

# ComfyUI integration endpoints
@router.post("/comfyui/prompt", response_model=ComfyUIResponse)
async def queue_prompt(
    prompt_data: ComfyUIPrompt,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Queue a prompt in ComfyUI.
    """
    try:
        # Send prompt to ComfyUI
        response = await comfyui_service.queue_prompt(prompt_data.prompt)
        prompt_id = response.get("prompt_id")
        
        # If workflow_id is provided, save the output when it's ready
        if prompt_data.workflow_id is not None:
            # This would be handled by a background task in a real implementation
            pass
        
        return {
            "prompt_id": prompt_id,
            "status": "queued",
            "outputs": None
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error queuing prompt: {str(e)}"
        )

@router.get("/comfyui/prompt/{prompt_id}", response_model=ComfyUIResponse)
async def get_prompt_status(
    prompt_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get the status of a queued prompt.
    """
    try:
        # Get prompt status from ComfyUI
        response = await comfyui_service.get_prompt_status(prompt_id)
        
        return {
            "prompt_id": prompt_id,
            "status": response.get("status", "unknown"),
            "outputs": response.get("outputs")
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting prompt status: {str(e)}"
        )

@router.get("/comfyui/history")
async def get_history(current_user: User = Depends(get_current_active_user)):
    """
    Get ComfyUI history.
    """
    try:
        # Get history from ComfyUI
        history = await comfyui_service.get_history()
        return history
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting history: {str(e)}"
        )
