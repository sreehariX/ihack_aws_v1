import boto3
from botocore.exceptions import ClientError
import asyncio
import aiofile
from amazon_transcribe.client import TranscribeStreamingClient
from amazon_transcribe.handlers import TranscriptResultStreamHandler
from amazon_transcribe.model import TranscriptEvent
from dotenv import load_dotenv
import os
import time
import uuid
import requests
import json
import re
load_dotenv()

class TranscriptionHandler(TranscriptResultStreamHandler):
    def __init__(self):
        session = boto3.Session(
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION')
        )
        self.client = TranscribeStreamingClient(region=session.region_name)
        super().__init__(self.client)
        self.transcription = ""
        self.partial_results = []

    async def handle_transcript_event(self, transcript_event: TranscriptEvent):
        results = transcript_event.transcript.results
        for result in results:
            for alt in result.alternatives:
                if result.is_partial:
                    print(f"\n[LIVE Transcription]: {alt.transcript}")
                    self.partial_results.append(alt.transcript)
                else:
                    print(f"\n[FINAL Transcription]: {alt.transcript}")
                    self.transcription += alt.transcript + " "

    def check_for_otp(self, text):
        otp_patterns = [
            r'\b\d{4,6}\b',
            r'(?i)verification code',
            r'(?i)security code',
            r'(?i)one.?time.?password',
            r'(?i)otp'
        ]
        return any(re.search(pattern, text.lower()) for pattern in otp_patterns)

async def process_audio_file(file_path: str):
    handler = TranscriptionHandler()
    stream = await handler.client.start_stream_transcription(
        language_code="en-US",
        media_sample_rate_hz=16000,
        media_encoding="pcm",
        enable_partial_results_stabilization=True,
        partial_results_stability="high"
    )

    try:
        async def write_chunks():
            async with aiofile.AIOFile(file_path, 'rb') as afp:
                reader = aiofile.Reader(afp, chunk_size=1024 * 16)
                async for chunk in reader:
                    await stream.input_stream.send_audio_event(audio_chunk=chunk)
                    print(f"[Streaming] Sent chunk of size: {len(chunk)} bytes")
                await stream.input_stream.end_stream()

        print("\n[Started] Beginning transcription...")
        await asyncio.gather(write_chunks(), handler.handle_events())
        
        print("\n[Completed] Final transcription:", handler.transcription.strip())
        return {
            "transcription": handler.transcription.strip(),
            "partial_results": handler.partial_results
        }
    except Exception as e:
        print(f"Error in process_audio_file: {e}")
        raise
    finally:
        # Properly close input and output streams
        if hasattr(stream, 'input_stream'):
            await stream.input_stream.end_stream()
        if hasattr(stream, 'output_stream'):
            stream.output_stream.close()

async def process_audio_stream(audio_chunk: bytes):
    handler = TranscriptionHandler()
    stream = await handler.client.start_stream_transcription(
        language_code="en-US",
        media_sample_rate_hz=16000,
        media_encoding="pcm",
        enable_partial_results_stabilization=True,
        partial_results_stability="high"
    )

    temp_file = None
    try:
        # Generate unique temp file name
        temp_file = f"temp_{uuid.uuid4()}.raw"
        
        # Use async file operations for both writing and reading
        async with aiofile.async_open(temp_file, 'wb') as f:
            await f.write(audio_chunk)

        async def write_chunks():
            try:
                async with aiofile.async_open(temp_file, 'rb') as afp:
                    reader = aiofile.Reader(afp, chunk_size=1024 * 16)
                    async for chunk in reader:
                        await stream.input_stream.send_audio_event(audio_chunk=chunk)
                        print(f"[Streaming] Sent chunk of size: {len(chunk)} bytes")
                await stream.input_stream.end_stream()
            except Exception as e:
                print(f"Error in write_chunks: {e}")
                raise

        print("\n[Started] Beginning transcription...")
        await asyncio.gather(write_chunks(), handler.handle_events())
        
        return {
            "transcription": handler.transcription.strip(),
            "partial_results": handler.partial_results
        }
    except Exception as e:
        print(f"Error in process_audio_stream: {e}")
        raise
    finally:
        # Properly close input and output streams
        if hasattr(stream, 'input_stream'):
            await stream.input_stream.end_stream()
        if hasattr(stream, 'output_stream'):
            stream.output_stream.close()
            
        # Clean up temp file
        if temp_file and os.path.exists(temp_file):
            try:
                os.remove(temp_file)
                print(f"[Cleanup] Removed temporary file: {temp_file}")
            except Exception as e:
                print(f"[Warning] Failed to remove temp file: {e}")

class TranscribeService:
    def __init__(self):
        self.session = boto3.Session(
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION')
        )
        self.client = self.session.client('transcribe')

    def check_for_otp(self, text: str) -> bool:
        otp_patterns = [
            r'\b\d{4,6}\b',  # 4-6 digit numbers
            r'(?i)verification code',
            r'(?i)security code',
            r'(?i)one.?time.?password',
            r'(?i)otp'
        ]
        
        for pattern in otp_patterns:
            if re.search(pattern, text.lower()):
                return True
        return False

    async def transcribe_file(self, file_path: str) -> str:
        # Implementation for file transcription
        # Return the transcribed text
        pass

    async def upload_to_s3(self, audio_data: bytes, file_name: str) -> str:
        try:
            self.session.client('s3').put_object(
                Bucket='spam-detection-audio-files',
                Key=file_name,
                Body=audio_data
            )
            s3_uri = f"s3://spam-detection-audio-files/{file_name}"
            return s3_uri
        except Exception as e:
            print(f"S3 upload error: {e}")
            raise Exception(f"Failed to upload to S3: {str(e)}")

    async def get_transcription_text(self, transcript_uri: str) -> str:
        try:
            # Get the transcription JSON file
            response = requests.get(transcript_uri)
            if response.status_code == 200:
                # Parse the JSON and extract the transcription
                transcript_data = response.json()
                return transcript_data['results']['transcripts'][0]['transcript']
            else:
                raise Exception(f"Failed to fetch transcription: HTTP {response.status_code}")
        except Exception as e:
            print(f"Error fetching transcription: {e}")
            raise Exception(f"Failed to get transcription text: {str(e)}")

    async def transcribe_audio(self, audio_data: bytes) -> str:
        try:
            file_name = f"audio_{str(uuid.uuid4())}.mp3"
            s3_uri = await self.upload_to_s3(audio_data, file_name)
            job_name = f"transcription_{int(time.time())}"
            
            response = self.session.client('transcribe').start_transcription_job(
                TranscriptionJobName=job_name,
                Media={'MediaFileUri': s3_uri},
                MediaFormat='mp3',
                LanguageCode='en-US'
            )
            
            # Wait for completion
            while True:
                status = self.session.client('transcribe').get_transcription_job(TranscriptionJobName=job_name)
                if status['TranscriptionJob']['TranscriptionJobStatus'] in ['COMPLETED', 'FAILED']:
                    break
                await asyncio.sleep(1)
            
            if status['TranscriptionJob']['TranscriptionJobStatus'] == 'COMPLETED':
                transcript_uri = status['TranscriptionJob']['Transcript']['TranscriptFileUri']
                # Get the actual transcription text
                transcription_text = await self.get_transcription_text(transcript_uri)
                return transcription_text
            else:
                raise Exception("Transcription failed")
                
        except Exception as e:
            print(f"Transcription error: {e}")
            raise Exception(f"Failed to transcribe audio: {str(e)}")

transcribe_service = TranscribeService()
