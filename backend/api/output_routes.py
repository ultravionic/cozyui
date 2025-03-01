from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import os
import json
import shutil
from datetime import datetime
import uuid

from models.user import User
from models.workflow import Output, OutputCreate, OutputResponse
from database.session import get_db
from auth.security import get_current_active_user

router = APIRouter()

# Ensure the outputs directory exists
OUTPUTS_DIR = os.path.join("static", "outputs")
os.makedirs(OUTPUTS_DIR, exist_ok=True)

@router.get("/outputs", response_model=List[OutputResponse])
async def get_outputs(
    skip: int = 0,
    limit: int = 100,
    workflow_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all outputs, optionally filtered by workflow ID.
    """
    query = db.query(Output)
    
    # Filter by workflow ID if provided
    if workflow_id is not None:
        query = query.filter(Output.workflow_id == workflow_id)
    
    # Get outputs
    outputs = query.order_by(Output.created_at.desc()).offset(skip).limit(limit).all()
    
    return outputs

@router.get("/outputs/{output_id}", response_model=OutputResponse)
async def get_output(
    output_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific output by ID.
    """
    output = db.query(Output).filter(Output.id == output_id).first()
    if not output:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output not found"
        )
    
    return output

@router.post("/outputs", response_model=OutputResponse)
async def create_output(
    workflow_id: int = Form(...),
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    metadata: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new output by uploading a file.
    """
    # Parse metadata if provided
    metadata_dict = {}
    if metadata:
        try:
            metadata_dict = json.loads(metadata)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid metadata JSON"
            )
    
    # Determine file type based on content type
    file_type = "unknown"
    if file.content_type.startswith("image/"):
        file_type = "image"
    elif file.content_type.startswith("video/"):
        file_type = "video"
    
    # Generate a unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Save the file
    file_path = os.path.join(OUTPUTS_DIR, unique_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create output record in database
    db_output = Output(
        workflow_id=workflow_id,
        user_id=current_user.id,
        filename=unique_filename,
        original_filename=file.filename,
        file_type=file_type,
        file_size=os.path.getsize(file_path),
        description=description,
        metadata=metadata_dict
    )
    
    db.add(db_output)
    db.commit()
    db.refresh(db_output)
    
    return db_output

@router.delete("/outputs/{output_id}", response_model=OutputResponse)
async def delete_output(
    output_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a specific output by ID.
    """
    output = db.query(Output).filter(Output.id == output_id).first()
    if not output:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output not found"
        )
    
    # Check if user has permission to delete
    if output.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Delete the file
    file_path = os.path.join(OUTPUTS_DIR, output.filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # Delete from database
    db.delete(output)
    db.commit()
    
    return output

@router.get("/outputs/{output_id}/download")
async def download_output(
    output_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Download a specific output file by ID.
    """
    output = db.query(Output).filter(Output.id == output_id).first()
    if not output:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output not found"
        )
    
    file_path = os.path.join(OUTPUTS_DIR, output.filename)
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Output file not found"
        )
    
    return FileResponse(
        path=file_path,
        filename=output.original_filename,
        media_type=f"{'image' if output.file_type == 'image' else 'video'}/{os.path.splitext(output.filename)[1][1:]}"
    )
