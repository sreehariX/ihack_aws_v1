from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .routers import audio, spam_reports
from .database import engine
from . import models
from .services.transcribe_service import TranscriptionHandler
from app.routers import video

import uuid

# Create all tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Spam Call API")

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

app.include_router(audio.router, prefix="/audio", tags=["audio"])
app.include_router(video.router)
app.include_router(spam_reports.router)



@app.get("/health")
async def health_check():
    return JSONResponse(
        content={"status": "healthy"},
        status_code=200
    )
