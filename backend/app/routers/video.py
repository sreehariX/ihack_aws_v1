from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
import boto3
import uuid
import os
import logging
from enum import Enum
import time
from sqlalchemy.orm import Session
from ..database import get_db
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/video",
    tags=["video"],
    responses={404: {"description": "Not found"}},
)

# Initialize AWS clients
try:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        region_name=os.getenv('AWS_REGION', 'us-east-1')
    )
    logger.debug("✅ S3 client initialized successfully")
    
    rekognition_client = boto3.client(
        'rekognition',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        region_name=os.getenv('AWS_REGION', 'us-east-1')
    )
    logger.debug("✅ Rekognition client initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize AWS clients: {str(e)}")
    raise

class SessionStatus(str, Enum):
    CREATED = "CREATED"
    IN_PROGRESS = "IN_PROGRESS"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    EXPIRED = "EXPIRED"

class LivenessSessionCreate(BaseModel):
    client_request_token: str = "default_session"
    audit_images_limit: int = 1

@router.post("/create-liveness-session")
async def create_liveness_session(
    video: UploadFile = File(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    try:
        logger.debug(f"📥 Received video file: {video.filename}")
        
        # Generate unique filename
        video_key = f"liveness-videos/{uuid.uuid4()}{os.path.splitext(video.filename)[1]}"
        logger.debug(f"🔑 Generated S3 key: {video_key}")
        
        # Upload to S3
        try:
            logger.debug(f"📤 Uploading to S3 bucket: {os.getenv('S3_BUCKET')}")
            s3_client.upload_fileobj(
                video.file,
                os.getenv('S3_BUCKET'),
                video_key,
                ExtraArgs={'ContentType': video.content_type}
            )
            logger.debug("✅ Upload successful")
        except Exception as e:
            logger.error(f"❌ S3 upload failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to upload to S3: {str(e)}")
        
        # Create Face Liveness session
        try:
            logger.debug("🔍 Creating Face Liveness session")
            session_response = rekognition_client.create_face_liveness_session(
                Source={
                    'S3Object': {
                        'Bucket': os.getenv('S3_BUCKET'),
                        'Name': video_key
                    }
                },
                OutputConfig={
                    'S3Bucket': os.getenv('S3_BUCKET'),
                    'S3KeyPrefix': f'liveness-output/{uuid.uuid4()}'
                },
                AuditImagesLimit=5
            )
            
            session_id = session_response['SessionId']
            logger.debug(f"✅ Face Liveness session created: {session_id}")
            
            return {
                "status": "success",
                "session_id": session_id,
                "message": "Liveness session created successfully"
            }
            
        except rekognition_client.exceptions.AccessDeniedException:
            logger.error("❌ Access denied to Rekognition")
            raise HTTPException(status_code=403, detail="Access denied to AWS Rekognition")
        except rekognition_client.exceptions.InvalidS3ObjectException:
            logger.error("❌ Invalid S3 object")
            raise HTTPException(status_code=400, detail="Invalid video file in S3")
        except rekognition_client.exceptions.ThrottlingException:
            logger.error("❌ AWS throttling")
            raise HTTPException(status_code=429, detail="AWS request limit exceeded")
        except Exception as e:
            logger.error(f"❌ Face Liveness session creation failed: {str(e)}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to create Face Liveness session: {str(e)}"
            )
            
    except HTTPException as he:
        # Clean up S3 file if session creation failed
        try:
            s3_client.delete_object(
                Bucket=os.getenv('S3_BUCKET'),
                Key=video_key
            )
            logger.debug(f"🗑️ Cleaned up S3 file after error: {video_key}")
        except Exception as cleanup_error:
            logger.error(f"⚠️ Failed to clean up S3 file: {str(cleanup_error)}")
        raise he
    except Exception as e:
        logger.error(f"❌ Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.get("/get-liveness-results/{session_id}")
async def get_liveness_results(session_id: str) -> Dict[str, Any]:
    try:
        logger.debug(f"🔍 Getting results for session: {session_id}")
        response = rekognition_client.get_face_liveness_session_results(
            SessionId=session_id
        )
        
        # Format the response
        result = {
            "session_id": session_id,
            "status": response.get("Status"),
            "confidence": response.get("Confidence"),
            "reference_image": None,
            "audit_images": []
        }
        
        # Handle reference image
        if "ReferenceImage" in response:
            ref_img = response["ReferenceImage"]
            result["reference_image"] = {
                "bounding_box": ref_img.get("BoundingBox"),
                "s3_location": {
                    "bucket": ref_img.get("S3Object", {}).get("Bucket"),
                    "name": ref_img.get("S3Object", {}).get("Name"),
                    "version": ref_img.get("S3Object", {}).get("Version")
                }
            }
        
        # Handle audit images
        if "AuditImages" in response:
            for img in response["AuditImages"]:
                audit_img = {
                    "bounding_box": img.get("BoundingBox"),
                    "s3_location": {
                        "bucket": img.get("S3Object", {}).get("Bucket"),
                        "name": img.get("S3Object", {}).get("Name"),
                        "version": img.get("S3Object", {}).get("Version")
                    }
                }
                result["audit_images"].append(audit_img)
        
        logger.debug(f"✅ Successfully retrieved results for session: {session_id}")
        return JSONResponse(content=result)
        
    except rekognition_client.exceptions.SessionNotFoundException:
        logger.error(f"❌ Session not found: {session_id}")
        raise HTTPException(status_code=404, detail="Session not found")
    except Exception as e:
        logger.error(f"❌ Error getting session results: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/cleanup-session/{session_id}")
async def cleanup_session(session_id: str) -> Dict[str, str]:
    try:
        logger.debug(f"🗑️ Starting cleanup for session: {session_id}")
        
        # Delete video
        try:
            s3_client.delete_object(
                Bucket=os.getenv('S3_BUCKET'),
                Key=f"videos/{session_id}.mp4"
            )
            logger.debug("✅ Deleted video file")
        except Exception as e:
            logger.error(f"⚠️ Failed to delete video: {str(e)}")
        
        # Delete output folder
        try:
            objects = s3_client.list_objects_v2(
                Bucket=os.getenv('S3_BUCKET'),
                Prefix=f"output/{session_id}"
            )
            
            if 'Contents' in objects:
                for obj in objects['Contents']:
                    s3_client.delete_object(
                        Bucket=os.getenv('S3_BUCKET'),
                        Key=obj['Key']
                    )
            logger.debug("✅ Deleted output files")
        except Exception as e:
            logger.error(f"⚠️ Failed to delete output files: {str(e)}")
        
        return {"message": "Session cleaned up successfully"}
        
    except Exception as e:
        logger.error(f"❌ Cleanup failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/detect-deepfake")
async def detect_deepfake(video: UploadFile = File(...)) -> Dict[str, Any]:
    try:
        logger.debug(f"📥 Received video file: {video.filename}")
        
        # Generate unique filename
        video_key = f"videos/{uuid.uuid4()}{os.path.splitext(video.filename)[1]}"
        logger.debug(f"🔑 Generated S3 key: {video_key}")
        
        # Upload to S3
        try:
            logger.debug(f"📤 Uploading to S3 bucket: {os.getenv('S3_BUCKET')}")
            s3_client.upload_fileobj(
                video.file,
                os.getenv('S3_BUCKET'),
                video_key,
                ExtraArgs={'ContentType': video.content_type}
            )
            logger.debug("✅ Upload successful")
        except Exception as e:
            logger.error(f"❌ S3 upload failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to upload to S3: {str(e)}")
        
        # Start Face Liveness detection
        try:
            logger.debug("🔍 Creating Face Liveness session")
            
            # Create Face Liveness session with correct parameters
            session_response = rekognition_client.create_face_liveness_session(
                Source={  # Changed from Settings to Source
                    'S3Object': {
                        'Bucket': os.getenv('S3_BUCKET'),
                        'Name': video_key
                    }
                },
                OutputConfig={
                    'S3Bucket': os.getenv('S3_BUCKET'),
                    'S3KeyPrefix': f'output/{uuid.uuid4()}'
                },
                AuditImagesLimit=5  # Optional parameter for number of audit images
            )
            
            session_id = session_response['SessionId']
            logger.debug(f"✅ Face Liveness session created: {session_id}")
            
            # Poll for results
            max_attempts = 60
            attempt = 0
            while attempt < max_attempts:
                try:
                    logger.debug(f"⏳ Checking session status (attempt {attempt + 1}/{max_attempts})")
                    result = rekognition_client.get_face_liveness_session_results(
                        SessionId=session_id
                    )
                    
                    status = result.get('Status')
                    logger.debug(f"📊 Session status: {status}")
                    
                    if status == 'SUCCEEDED':
                        confidence = result.get('Confidence', 0)
                        logger.debug(f"✅ Analysis completed. Confidence: {confidence}")
                        
                        # Clean up - delete video from S3
                        try:
                            logger.debug(f"🗑️ Cleaning up S3 file: {video_key}")
                            s3_client.delete_object(
                                Bucket=os.getenv('S3_BUCKET'),
                                Key=video_key
                            )
                            logger.debug("✅ Cleanup successful")
                        except Exception as e:
                            logger.error(f"⚠️ Cleanup failed: {str(e)}")
                        
                        return {
                            "status": "success",
                            "is_deepfake": confidence < 90,
                            "confidence_score": confidence,
                            "session_id": session_id,
                            "reference_image": result.get('ReferenceImage'),
                            "audit_images": result.get('AuditImages')
                        }
                    elif status == 'FAILED':
                        raise HTTPException(
                            status_code=500, 
                            detail=f"Face Liveness analysis failed"
                        )
                    elif status == 'EXPIRED':
                        raise HTTPException(
                            status_code=500, 
                            detail="Face Liveness session expired"
                        )
                    
                    attempt += 1
                    time.sleep(2)  # Wait before next check
                    
                except Exception as e:
                    logger.error(f"❌ Error checking session status: {str(e)}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"Error checking Face Liveness status: {str(e)}"
                    )
            
            raise HTTPException(
                status_code=500,
                detail="Timeout waiting for Face Liveness analysis"
            )
            
        except Exception as e:
            logger.error(f"❌ Face Liveness analysis failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Face Liveness detection failed: {str(e)}")
            
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"❌ Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Process failed: {str(e)}")

@router.post("/create-session")
async def create_session(
    request: LivenessSessionCreate,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    try:
        logger.debug("Creating Face Liveness session")
        
        # Generate unique S3 prefix
        s3_prefix = f"liveness-sessions/{uuid.uuid4()}"
        
        response = rekognition_client.create_face_liveness_session(
            ClientRequestToken=request.client_request_token,
            Settings={
                'OutputConfig': {
                    'S3Bucket': os.getenv('S3_BUCKET'),
                    'S3KeyPrefix': s3_prefix
                },
                'AuditImagesLimit': request.audit_images_limit
            }
        )
        
        logger.debug(f"✅ Session created successfully: {response['SessionId']}")
        return {
            "session_id": response['SessionId'],
            "status": "created"
        }
        
    except rekognition_client.exceptions.AccessDeniedException:
        logger.error("❌ Access denied to Rekognition")
        raise HTTPException(status_code=403, detail="Access denied to AWS Rekognition")
    except rekognition_client.exceptions.ThrottlingException:
        logger.error("❌ AWS throttling")
        raise HTTPException(status_code=429, detail="AWS request limit exceeded")
    except Exception as e:
        logger.error(f"❌ Failed to create session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session-results/{session_id}")
async def get_session_results(
    session_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    try:
        logger.debug(f"Getting results for session: {session_id}")
        
        response = rekognition_client.get_face_liveness_session_results(
            SessionId=session_id
        )
        
        # Extract relevant information
        result = {
            "session_id": response['SessionId'],
            "confidence": response['Confidence'],
            "status": response['Status']
        }
        
        # Add reference image if available
        if 'ReferenceImage' in response:
            result['reference_image'] = {
                's3_bucket': response['ReferenceImage']['S3Object']['Bucket'],
                's3_key': response['ReferenceImage']['S3Object']['Name'],
                'bounding_box': response['ReferenceImage']['BoundingBox']
            }
        
        # Add audit images if available
        if 'AuditImages' in response:
            result['audit_images'] = [{
                's3_bucket': img['S3Object']['Bucket'],
                's3_key': img['S3Object']['Name'],
                'bounding_box': img['BoundingBox']
            } for img in response['AuditImages']]
        
        logger.debug("✅ Successfully retrieved session results")
        return result
        
    except rekognition_client.exceptions.AccessDeniedException:
        logger.error("❌ Access denied to Rekognition")
        raise HTTPException(status_code=403, detail="Access denied to AWS Rekognition")
    except rekognition_client.exceptions.ResourceNotFoundException:
        logger.error("❌ Session not found")
        raise HTTPException(status_code=404, detail="Session not found")
    except rekognition_client.exceptions.ThrottlingException:
        logger.error("❌ AWS throttling")
        raise HTTPException(status_code=429, detail="AWS request limit exceeded")
    except Exception as e:
        logger.error(f"❌ Failed to get session results: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))