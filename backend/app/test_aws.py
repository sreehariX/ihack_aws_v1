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
        
        # Test S3
        try:
            s3 = session.client('s3')
            # List buckets to verify connection and permissions
            response = s3.list_buckets()
            print("✅ AWS S3 connection successful")
            print(f"📦 Available buckets: {[bucket['Name'] for bucket in response['Buckets']]}")
            
            # Test specific bucket access if S3_BUCKET is set
            if os.getenv('S3_BUCKET'):
                s3.head_bucket(Bucket=os.getenv('S3_BUCKET'))
                print(f"✅ Successfully accessed bucket: {os.getenv('S3_BUCKET')}")
        except Exception as s3_error:
            print(f"❌ S3 Error: {str(s3_error)}")
        
        # Test Transcribe
        try:
            transcribe = session.client('transcribe')
            transcribe.list_transcription_jobs(MaxResults=1)
            print("✅ AWS Transcribe connection successful")
        except Exception as transcribe_error:
            print(f"❌ Transcribe Error: {str(transcribe_error)}")
        
    except Exception as e:
        print("❌ General AWS Error:", str(e))

if __name__ == "__main__":
    test_aws_connection()