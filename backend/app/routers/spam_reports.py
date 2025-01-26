from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import SpamReport, SpamReportCreate
import logging

router = APIRouter(
    prefix="/spam-reports",
    tags=["spam-reports"]
)

@router.post("/report")
async def create_spam_report(report: SpamReportCreate, db: Session = Depends(get_db)):
    try:
        logging.info(f"Received report: {report}")
        
        # Check if phone number already exists
        existing_report = db.query(SpamReport).filter(
            SpamReport.phone_number == report.phone_number
        ).first()

        if existing_report:
            # Increment reports count
            existing_report.reports_count += 1
            existing_report.description = report.description
            db.commit()
            return {
                "message": "Report count updated",
                "reports_count": existing_report.reports_count
            }
        else:
            # Create new report
            new_report = SpamReport(
                phone_number=report.phone_number,
                description=report.description,
                reports_count=1
            )
            db.add(new_report)
            db.commit()
            db.refresh(new_report)
            return {
                "message": "New report created",
                "reports_count": 1
            }

    except Exception as e:
        logging.error(f"Error creating report: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_spam_reports(db: Session = Depends(get_db)):
    reports = db.query(SpamReport).order_by(SpamReport.reports_count.desc()).all()
    return reports