from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from ..models import AudioFile, AudioCreate, AudioResponse, DemoAudio, DemoCreate, DemoResponse, Transcription
from ..database import get_db
import io
from sqlalchemy import func
from datetime import datetime, timedelta
from ..services.transcribe_service import process_audio_stream, process_audio_file
from typing import Callable, Dict
import logging
import os
import uuid
import asyncio
import aiofile
from amazon_transcribe.client import TranscribeStreamingClient
from amazon_transcribe.handlers import TranscriptResultStreamHandler
from amazon_transcribe.model import TranscriptEvent
from pydub import AudioSegment
import shutil
import subprocess
import re
import json
from sse_starlette.sse import EventSourceResponse
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict
from ..services.gemini_service import gemini_service

from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/upload")
async def upload_audio(
    file: UploadFile = File(...),
    category: str = "spam",
    description: str = "",
    duration: int = 0,
    db: Session = Depends(get_db)
):
    try:
        contents = await file.read()
        
        audio_file = AudioFile(
            filename=file.filename,
            content_type=file.content_type,
            category=category,
            description=description,
            duration=duration,
            audio_data=contents
        )
        
        db.add(audio_file)
        db.commit()
        db.refresh(audio_file)
        
        return {"id": audio_file.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-demo", response_model=DemoResponse)
async def upload_demo(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    duration: int = Form(...),
    db: Session = Depends(get_db)
):
    try:
        contents = await file.read()
        
        demo_audio = DemoAudio(
            title=title,
            filename=file.filename,
            content_type=file.content_type,
            category=category,
            description=description,
            duration=duration,
            audio_data=contents
        )
        
        db.add(demo_audio)
        db.commit()
        db.refresh(demo_audio)
        
        return DemoResponse(
            id=demo_audio.id,
            title=demo_audio.title,
            filename=demo_audio.filename,
            category=demo_audio.category,
            description=demo_audio.description,
            duration=demo_audio.duration,
            created_at=demo_audio.created_at,
            audio_url=f"/audio/{demo_audio.id}/stream-demo"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/demos", response_model=list[DemoResponse])
def get_demo_files(db: Session = Depends(get_db)):
    demos = db.query(DemoAudio).all()
    return [
        DemoResponse(
            id=demo.id,
            title=demo.title,
            filename=demo.filename,
            category=demo.category,
            description=demo.description,
            duration=demo.duration,
            created_at=demo.created_at,
            audio_url=f"/audio/{demo.id}/stream-demo"
        ) for demo in demos
    ]

@router.get("/{audio_id}/stream")
def stream_audio(audio_id: int, db: Session = Depends(get_db)):
    audio_file = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    if not audio_file:
        raise HTTPException(status_code=404, detail="Audio not found")
        
    def iterfile():
        yield audio_file.audio_data
        
    return StreamingResponse(
        iterfile(),
        media_type=audio_file.content_type
    )

@router.get("/demo/{demo_id}/stream-demo")
async def stream_demo(demo_id: int, db: Session = Depends(get_db)):
    try:
        demo = db.query(DemoAudio).filter(DemoAudio.id == demo_id).first()
        if not demo:
            raise HTTPException(status_code=404, detail="Demo not found")
            
        return StreamingResponse(
            io.BytesIO(demo.audio_data),
            media_type="audio/mpeg",
            headers={
                "Accept-Ranges": "bytes",
                "Content-Disposition": f'attachment; filename="{demo.filename}"'
            }
        )
    except Exception as e:
        logger.error(f"Error streaming demo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
def get_audio_stats(db: Session = Depends(get_db)):
    # Basic counts
    total_recordings = db.query(AudioFile).count()
    demo_count = db.query(DemoAudio).count()
    user_recordings = db.query(AudioFile).count()

    # Category breakdown
    categories = db.query(
        AudioFile.category, 
        func.count(AudioFile.id).label('count'),
        func.avg(AudioFile.duration).label('avg_duration')
    ).group_by(AudioFile.category).all()

    # Recent activity
    last_24h = datetime.now() - timedelta(days=1)
    recent_recordings = db.query(AudioFile)\
        .filter(AudioFile.created_at >= last_24h)\
        .count()

    # Duration stats
    duration_stats = db.query(
        func.avg(AudioFile.duration).label('avg'),
        func.min(AudioFile.duration).label('min'),
        func.max(AudioFile.duration).label('max')
    ).first()

    return {
        "overview": {
            "total_recordings": total_recordings,
            "demo_count": demo_count,
            "user_recordings": user_recordings,
            "recent_recordings": recent_recordings
        },
        "categories": [
            {
                "name": cat.category,
                "count": cat.count,
                "average_duration": round(cat.avg_duration or 0, 2)
            } for cat in categories
        ],
        "duration_stats": {
            "average": round(duration_stats.avg or 0, 2),
            "shortest": duration_stats.min or 0,
            "longest": duration_stats.max or 0
        }
    }

@router.post("/test")
async def test_transcribe(file: UploadFile = File(...)):
    temp_file_path = None
    wav_file_path = None
    
    try:
        logger.info(f"Test endpoint: Received audio file: {file.filename}")
        
        # First, check if ffmpeg is installed
        if not shutil.which('ffmpeg'):
            raise HTTPException(
                status_code=500,
                detail="ffmpeg is not installed. Please install ffmpeg to process audio files."
            )
        
        # Generate unique temp file names
        temp_file_path = f"temp_{uuid.uuid4()}_{file.filename}"
        wav_file_path = f"temp_{uuid.uuid4()}.wav"
        
        # Save uploaded file
        contents = await file.read()
        with open(temp_file_path, "wb") as f:
            f.write(contents)
        
        try:
            # Convert to WAV using ffmpeg directly
            subprocess.run([
                'ffmpeg', '-i', temp_file_path,
                '-acodec', 'pcm_s16le',
                '-ac', '1',
                '-ar', '16000',
                wav_file_path
            ], check=True, capture_output=True)
            
            logger.info(f"Successfully converted audio to WAV format")
            
            class MyEventHandler(TranscriptResultStreamHandler):
                def __init__(self, stream):
                    self.full_transcript = ""
                    super().__init__(stream)

                async def handle_transcript_event(self, transcript_event: TranscriptEvent):
                    results = transcript_event.transcript.results
                    for result in results:
                        for alt in result.alternatives:
                            transcript = alt.transcript
                            if result.is_partial:
                                print(f"[LIVE] {transcript}")
                            else:
                                print(f"[FINAL] {transcript}")
                                self.full_transcript += transcript + " "

            async def transcribe_audio(file_path: str):
                client = TranscribeStreamingClient(region=os.getenv('AWS_REGION'))
                stream = await client.start_stream_transcription(
                    language_code="en-US",
                    media_sample_rate_hz=16000,
                    media_encoding="pcm",
                )

                async def write_chunks():
                    async with aiofile.AIOFile(file_path, 'rb') as afp:
                        reader = aiofile.Reader(afp, chunk_size=1024 * 16)
                        async for chunk in reader:
                            await stream.input_stream.send_audio_event(audio_chunk=chunk)
                    await stream.input_stream.end_stream()

                handler = MyEventHandler(stream.output_stream)
                await asyncio.gather(write_chunks(), handler.handle_events())
                return {"transcript": handler.full_transcript}

            print("\n=== Starting Transcription ===")
            print("(Partial results will update in place, final results on new lines)\n")
            
            result = await transcribe_audio(wav_file_path)
            
            return JSONResponse(content={
                "message": "Test transcription completed",
                "transcription": result["transcript"]
            })

        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg error: {e.stderr.decode()}")
            raise HTTPException(status_code=500, detail=f"Error converting audio: {e.stderr.decode()}")
            
    except Exception as e:
        logger.error(f"Test transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # Cleanup temp files
        for file_path in [temp_file_path, wav_file_path]:
            if file_path and os.path.exists(file_path):
                try:
                    await asyncio.sleep(0.1)  # Small delay to ensure file handle is released
                    os.remove(file_path)
                    logger.info(f"Cleaned up temp file: {file_path}")
                except Exception as e:
                    logger.warning(f"Failed to cleanup temp file: {e}")

@router.get("/realtimetranscribe/{demo_id}")
async def realtime_demo_transcription(demo_id: int, db: Session = Depends(get_db)):
    async def event_generator():
        temp_file_path = None
        wav_file_path = None
        try:
            # Get demo audio from database
            demo = db.query(DemoAudio).filter(DemoAudio.id == demo_id).first()
            if not demo:
                yield {
                    "event": "error",
                    "data": "Demo not found"
                }
                return

            # Create temporary files with unique names
            temp_file_path = f"temp_{uuid.uuid4()}_{demo.filename}"
            wav_file_path = f"temp_{uuid.uuid4()}.wav"
            
            # Save the audio data to a temporary file
            with open(temp_file_path, "wb") as f:
                f.write(demo.audio_data)
            
            try:
                # Convert to WAV using ffmpeg
                subprocess.run([
                    'ffmpeg', '-i', temp_file_path,
                    '-acodec', 'pcm_s16le',
                    '-ac', '1',
                    '-ar', '16000',
                    wav_file_path
                ], check=True, capture_output=True)
                
                logger.info(f"Successfully converted demo audio to WAV format")
                
                client = TranscribeStreamingClient(region=os.getenv('AWS_REGION'))
                stream = await client.start_stream_transcription(
                    language_code="en-US",
                    media_sample_rate_hz=16000,
                    media_encoding="pcm"
                )

                async def write_chunks():
                    async with aiofile.AIOFile(wav_file_path, 'rb') as afp:
                        reader = aiofile.Reader(afp, chunk_size=1024 * 16)
                        async for chunk in reader:
                            await stream.input_stream.send_audio_event(audio_chunk=chunk)
                    await stream.input_stream.end_stream()

                # Start writing chunks in the background
                asyncio.create_task(write_chunks())

                # Handle the transcription results
                async for event in stream.output_stream:
                    results = event.transcript.results
                    for result in results:
                        for alt in result.alternatives:
                            transcript = alt.transcript
                            yield {
                                "event": "message",
                                "data": json.dumps({
                                    "live": result.is_partial,
                                    "transcription": transcript
                                })
                            }

            except Exception as e:
                logger.error(f"Transcription error: {str(e)}")
                yield {
                    "event": "error",
                    "data": str(e)
                }

        except Exception as e:
            logger.error(f"Demo transcription error: {str(e)}")
            yield {
                "event": "error",
                "data": str(e)
            }
        
        finally:
            # Cleanup temp files
            for file_path in [temp_file_path, wav_file_path]:
                if file_path and os.path.exists(file_path):
                    try:
                        await asyncio.sleep(0.1)  # Small delay to ensure file handle is released
                        os.remove(file_path)
                        logger.info(f"Cleaned up temp file: {file_path}")
                    except Exception as e:
                        logger.warning(f"Failed to cleanup temp file: {e}")

    return EventSourceResponse(event_generator())

class TextAnalysisRequest(BaseModel):
    text: str

@router.post("/analyze_fraud")
async def analyze_fraud(request: TextAnalysisRequest) -> Dict:
    try:
        return await gemini_service.analyze_fraud(request.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



