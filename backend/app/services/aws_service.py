from amazon_transcribe.client import TranscribeStreamingClient
from amazon_transcribe.handlers import TranscriptResultStreamHandler
from amazon_transcribe.model import TranscriptEvent
from boto3 import Session
import time
from datetime import datetime
from dotenv import load_dotenv
import os
import logging

load_dotenv()

logger = logging.getLogger(__name__)

class TranscribeStreamHandler(TranscriptResultStreamHandler):
    def __init__(self):
        session = Session(
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION')
        )
        self.fraud_detector = session.client('frauddetector')
        self.transcribe_client = TranscribeStreamingClient(session)
        super().__init__(self.transcribe_client)
        self.transcription = ""
        self._is_cancelled = False

    def cancel(self):
        self._is_cancelled = True
        if hasattr(self, 'transcribe_client'):
            self.transcribe_client.close()

    async def handle_transcript_event(self, transcript_event: TranscriptEvent):
        if self._is_cancelled:
            return None
            
        try:
            results = transcript_event.transcript.results
            for result in results:
                if not result.is_partial:
                    transcript = result.alternatives[0].transcript
                    fraud_score = await self.check_fraud(transcript)
                    if fraud_score > 0.7:  # Configurable threshold
                        return {
                            "transcription": transcript,
                            "fraud_score": fraud_score
                        }
        except Exception as e:
            logger.error(f"Error handling transcript: {e}")
            return None
        return None

    async def check_fraud(self, text: str):
        if self._is_cancelled:
            return 0.0
            
        try:
            response = self.fraud_detector.get_event_prediction(
                detectorId='spam_call_detector',
                eventId=f'call_{int(time.time())}',
                eventTypeName='spam_call_detection',
                entities=[{
                    'entityType': 'CALLER',
                    'entityId': 'unknown'
                }],
                eventTimestamp=datetime.now().isoformat(),
                eventVariables={
                    'transcribed_text': text,
                }
            )
            return float(response['modelScores'][0]['score'])
        except Exception as e:
            logger.error(f"Fraud detection error: {e}")
            return 0.0

aws_handler = TranscribeStreamHandler()