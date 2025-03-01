import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import socketio
import uvicorn
from typing import List, Optional

from api.routes import router as api_router
from auth.routes import router as auth_router
from api.user_routes import router as user_router
from api.settings_routes import router as settings_router
from api.output_routes import router as output_router
from database.db import engine, Base
from database.session import get_db
from models.user import User
from models.workflow import Workflow
from services.comfyui_service import ComfyUIService

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(title="Collaborative ComfyUI API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=["*"]  # In production, replace with specific origins
)
socket_app = socketio.ASGIApp(sio)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(api_router, prefix="/api", tags=["API"])
app.include_router(user_router, prefix="/api", tags=["Users"])
app.include_router(settings_router, prefix="/api", tags=["Settings"])
app.include_router(output_router, prefix="/api", tags=["Outputs"])

# Mount Socket.IO app
app.mount("/socket.io", socket_app)

# Mount static files directory for serving outputs
app.mount("/static", StaticFiles(directory="static"), name="static")

# Create ComfyUI service
comfyui_service = ComfyUIService(os.environ.get("COMFYUI_API_URL", "http://comfyui:8188/"))

# Socket.IO events
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.event
async def cursor_move(sid, data):
    # Broadcast cursor position to all clients except sender
    await sio.emit('cursor_update', data, skip_sid=sid)

@sio.event
async def node_select(sid, data):
    # Broadcast node selection to all clients except sender
    await sio.emit('node_update', data, skip_sid=sid)

@sio.event
async def workflow_update(sid, data):
    # Broadcast workflow changes to all clients except sender
    await sio.emit('workflow_change', data, skip_sid=sid)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to Collaborative ComfyUI API"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
