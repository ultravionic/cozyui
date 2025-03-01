from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any
from pydantic import BaseModel

from models.user import User
from database.session import get_db
from auth.security import get_current_active_user

router = APIRouter()

class AppSettings(BaseModel):
    comfyui_api_url: str
    enable_real_time_collaboration: bool
    auto_save_interval: int
    max_upload_size_mb: int
    default_theme: str

# In-memory settings (in a real app, these would be stored in a database)
app_settings = AppSettings(
    comfyui_api_url="http://localhost:8188",
    enable_real_time_collaboration=True,
    auto_save_interval=60,
    max_upload_size_mb=10,
    default_theme="light"
)

@router.get("/settings", response_model=AppSettings)
async def get_settings(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get application settings.
    """
    return app_settings

@router.put("/settings", response_model=AppSettings)
async def update_settings(
    settings: AppSettings,
    current_user: User = Depends(get_current_active_user)
):
    """
    Update application settings. Only accessible by admins.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Update settings
    global app_settings
    app_settings = settings
    
    return app_settings

@router.get("/comfyui/system_info")
async def get_system_info(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get ComfyUI system information.
    """
    # In a real implementation, this would make a request to the ComfyUI API
    # For now, we'll return mock data
    return {
        "comfyui_version": "1.0.0",
        "python_version": "3.10.0",
        "cuda_version": "11.8",
        "gpu_info": "NVIDIA GeForce RTX 3090",
        "os": "Linux",
        "cpu": "Intel(R) Core(TM) i9-10900K",
        "memory": 32 * 1024 * 1024 * 1024,  # 32GB in bytes
        "disk_space": 500 * 1024 * 1024 * 1024,  # 500GB in bytes
        "installed_packages": [
            {"name": "torch", "version": "2.0.1"},
            {"name": "transformers", "version": "4.30.2"},
            {"name": "diffusers", "version": "0.18.2"},
            {"name": "numpy", "version": "1.24.3"},
            {"name": "pillow", "version": "9.5.0"},
            {"name": "fastapi", "version": "0.95.2"},
            {"name": "uvicorn", "version": "0.22.0"},
            {"name": "sqlalchemy", "version": "2.0.15"},
            {"name": "pydantic", "version": "1.10.8"},
            {"name": "python-jose", "version": "3.3.0"},
            {"name": "passlib", "version": "1.7.4"},
            {"name": "python-multipart", "version": "0.0.6"},
        ]
    }

@router.get("/comfyui/system_stats")
async def get_system_stats(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get ComfyUI system statistics.
    """
    # In a real implementation, this would make a request to the ComfyUI API
    # For now, we'll return mock data
    return {
        "comfyui_version": "1.0.0",
        "python_version": "3.10.0",
        "cuda": {
            "version": "11.8",
            "device": "NVIDIA GeForce RTX 3090",
            "total_memory": 24 * 1024 * 1024,  # 24GB in KB
            "used_memory": 8 * 1024 * 1024,  # 8GB in KB
        },
        "queue_length": 0,
        "executing_count": 0,
        "uptime": 3600,  # 1 hour in seconds
    }
