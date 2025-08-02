import uuid
import time
import json
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from fastapi.responses import JSONResponse
import os

from app.models.audit import (
    AuditRequest, 
    AuditResponse, 
    UploadResponse, 
    FileAuditResult,
    AuditResult
)
from app.services.gemini_service import GeminiService
from app.services.file_service import FileService
from app.core.config import settings

router = APIRouter()

# Initialize services
gemini_service = GeminiService()
file_service = FileService()

@router.post("/upload", response_model=UploadResponse)
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Upload audio files for auditing
    """
    try:
        # Validate and save files
        saved_files = await file_service.validate_and_save_files(files)
        
        # Calculate total size
        total_size = file_service.get_total_size(saved_files)
        
        return UploadResponse(
            message=f"Successfully uploaded {len(saved_files)} files",
            uploaded_files=[os.path.basename(f) for f in saved_files],
            total_size=total_size,
            file_count=len(saved_files)
        )
        
    except Exception as e:
        # Clean up files if there was an error
        if 'saved_files' in locals():
            file_service.cleanup_files(saved_files)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/audit", response_model=AuditResponse)
async def audit_files(
    request: str = Form(...),
    files: List[UploadFile] = File(...)
):
    """
    Audit uploaded files for the specified parameters
    """
    start_time = time.time()
    audit_id = str(uuid.uuid4())
    
    try:
        # Parse the request JSON
        try:
            request_data = json.loads(request)
            audit_request = AuditRequest(**request_data)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON in request: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid request format: {str(e)}")
        
        # Validate and save files
        saved_files = await file_service.validate_and_save_files(files)
        
        results = []
        
        # Process each file
        for file_path in saved_files:
            try:
                # Get file info
                file_info = file_service.get_file_info(file_path)
                
                # Audit the file
                audit_results = await gemini_service.audit_file(
                    file_path=file_path,
                    parameters=audit_request.parameters,
                    custom_prompts=audit_request.custom_prompts
                )
                
                # Convert to AuditResult objects
                audit_result_objects = []
                for result in audit_results:
                    audit_result_objects.append(AuditResult(
                        parameter=result["parameter"],
                        verdict=result["verdict"],
                        confidence=result["confidence"],
                        reasoning=result.get("reasoning")
                    ))
                
                # Calculate overall score
                overall_score = _calculate_overall_score(audit_result_objects)
                
                # Create file result
                file_result = FileAuditResult(
                    filename=file_info["filename"],
                    file_size=file_info["size"],
                    results=audit_result_objects,
                    overall_score=overall_score
                )
                
                results.append(file_result)
                
            except Exception as e:
                # If individual file fails, continue with others
                results.append(FileAuditResult(
                    filename=os.path.basename(file_path),
                    file_size=0,
                    results=[],
                    overall_score=0,
                    summary=f"Error processing file: {str(e)}"
                ))
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Generate overall summary
        overall_summary = _generate_overall_summary(results)
        
        # Clean up files
        file_service.cleanup_files(saved_files)
        
        return AuditResponse(
            audit_id=audit_id,
            total_files=len(files),
            processed_files=len(results),
            results=results,
            overall_summary=overall_summary,
            processing_time=processing_time
        )
        
    except Exception as e:
        # Clean up files if there was an error
        if 'saved_files' in locals():
            file_service.cleanup_files(saved_files)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/parameters")
async def get_available_parameters():
    """
    Get list of available audit parameters
    """
    parameters = [
        {
            "id": "greeting",
            "name": "Professional Greeting",
            "description": "Agent properly greets the customer",
            "category": "Opening"
        },
        {
            "id": "introduction",
            "name": "Agent Introduction",
            "description": "Agent introduces themselves and company",
            "category": "Opening"
        },
        {
            "id": "active-listening",
            "name": "Active Listening",
            "description": "Agent demonstrates active listening skills",
            "category": "Communication"
        },
        {
            "id": "empathy",
            "name": "Empathy",
            "description": "Agent shows empathy towards customer concerns",
            "category": "Communication"
        },
        {
            "id": "clarity",
            "name": "Clear Communication",
            "description": "Agent speaks clearly and concisely",
            "category": "Communication"
        },
        {
            "id": "solution-oriented",
            "name": "Solution-Oriented",
            "description": "Agent focuses on solving customer problems",
            "category": "Problem Solving"
        },
        {
            "id": "product-knowledge",
            "name": "Product Knowledge",
            "description": "Agent demonstrates good product knowledge",
            "category": "Knowledge"
        },
        {
            "id": "objection-handling",
            "name": "Objection Handling",
            "description": "Agent effectively handles customer objections",
            "category": "Sales"
        },
        {
            "id": "closing",
            "name": "Proper Closing",
            "description": "Agent properly closes the call",
            "category": "Closing"
        },
        {
            "id": "follow-up",
            "name": "Follow-up Commitment",
            "description": "Agent commits to follow-up actions",
            "category": "Closing"
        }
    ]
    
    return {"parameters": parameters}

def _calculate_overall_score(audit_results: List[AuditResult]) -> float:
    """
    Calculate overall score based on audit results
    """
    if not audit_results:
        return 0.0
    
    total_score = 0
    valid_results = 0
    
    for result in audit_results:
        if result.verdict == "Yes":
            # Extract confidence percentage
            try:
                confidence = float(result.confidence.replace("%", ""))
                total_score += confidence
                valid_results += 1
            except (ValueError, AttributeError):
                # If confidence is not a valid percentage, assume 100% for Yes
                total_score += 100
                valid_results += 1
        elif result.verdict == "No":
            valid_results += 1
            # No points for No verdicts
    
    return total_score / valid_results if valid_results > 0 else 0.0

def _generate_overall_summary(results: List[FileAuditResult]) -> str:
    """
    Generate overall summary of audit results
    """
    if not results:
        return "No files were processed."
    
    total_files = len(results)
    successful_files = len([r for r in results if r.overall_score is not None])
    avg_score = sum([r.overall_score or 0 for r in results]) / total_files
    
    return f"Processed {total_files} files with {successful_files} successful audits. Average score: {avg_score:.1f}%" 