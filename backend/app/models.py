from sqlalchemy import Column, Integer, String, DateTime, Boolean, LargeBinary, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# SQLAlchemy Models
class DemoAudio(Base):
    __tablename__ = "demo_audios"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    duration = Column(Integer, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    audio_data = Column(LargeBinary)

class AudioFile(Base):
    __tablename__ = "audio_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    duration = Column(Integer, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_demo = Column(Boolean, default=False)
    audio_data = Column(LargeBinary)
    transcriptions = relationship("Transcription", back_populates="audio_file")

class Transcription(Base):
    __tablename__ = "transcriptions"

    id = Column(Integer, primary_key=True, index=True)
    audio_file_id = Column(Integer, ForeignKey("audio_files.id"))
    text = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    audio_file = relationship("AudioFile", back_populates="transcriptions")

# Pydantic Models for API
class AudioCreate(BaseModel):
    filename: str
    content_type: str
    duration: int
    category: str
    description: str
    is_demo: bool = False

class AudioResponse(BaseModel):
    id: int
    filename: str
    category: str
    description: str
    duration: int
    created_at: datetime
    audio_url: str

    class Config:
        from_attributes = True

class DemoCreate(BaseModel):
    title: str
    category: str
    description: str
    duration: int

class DemoResponse(BaseModel):
    id: int
    title: str
    filename: str
    category: str
    description: str
    duration: int
    created_at: datetime
    audio_url: str

    class Config:
        from_attributes = True
