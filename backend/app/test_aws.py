import boto3
from dotenv import load_dotenv
import os

load_dotenv()

def test_aws_connection():
    try:
        session = boto3.Session(
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION')
        )
        
        # Test Transcribe
        transcribe = session.client('transcribe')
        transcribe.list_transcription_jobs(MaxResults=1)
        print("✅ AWS Transcribe connection successful")
        
    except Exception as e:
        print("❌ Error:", str(e))

if __name__ == "__main__":
    test_aws_connection()