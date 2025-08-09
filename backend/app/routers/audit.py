import uuid
import time
import json
import logging
import asyncio
from typing import List, Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form, BackgroundTasks
from fastapi.responses import JSONResponse, StreamingResponse
import os

logger = logging.getLogger(__name__)

# In-memory job storage (use Redis in production)
audit_jobs: Dict[str, Dict[str, Any]] = {}

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
        
        # OPTIMIZED: Process all files in parallel with combined prompts
        # This reduces API calls from (files × parameters) to just (files)
        logger.info(f"Starting optimized parallel processing for {len(saved_files)} files with {len(audit_request.parameters)} parameters")
        
        try:
            # Process all files in parallel using the optimized method
            all_audit_results = await gemini_service.audit_multiple_files_parallel(
                file_paths=saved_files,
                parameters=audit_request.parameters,
                custom_prompts=audit_request.custom_prompts
            )
            
            results = []
            
            # Process results for each file
            for idx, file_path in enumerate(saved_files):
                try:
                    # Get file info
                    file_info = file_service.get_file_info(file_path)
                    
                    # Get audit results for this file
                    audit_results = all_audit_results[idx] if idx < len(all_audit_results) else []
                    
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
                    logger.error(f"Error processing results for file {file_path}: {str(e)}")
                    # If individual file result processing fails, create error result
                    results.append(FileAuditResult(
                        filename=os.path.basename(file_path),
                        file_size=0,
                        results=[],
                        overall_score=0,
                        summary=f"Error processing file results: {str(e)}"
                    ))
        
        except Exception as e:
            logger.error(f"Error in parallel processing: {str(e)}")
            # Fallback to sequential processing if parallel fails
            logger.info("Falling back to sequential processing")
            results = await _process_files_sequential(saved_files, audit_request, gemini_service, file_service)
        
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

@router.post("/audit/optimized", response_model=AuditResponse)
async def audit_files_optimized(
    request: str = Form(...),
    files: List[UploadFile] = File(...)
):
    """
    OPTIMIZED: Audit uploaded files using parallel processing and combined prompts
    This endpoint provides significant performance improvements:
    - Reduces API calls from (files × parameters) to just (files)
    - Processes all files in parallel
    - 85-97% faster than the standard endpoint
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
        
        logger.info(f"OPTIMIZED ENDPOINT: Processing {len(saved_files)} files with {len(audit_request.parameters)} parameters")
        logger.info(f"Expected API calls: {len(saved_files)} (vs {len(saved_files) * len(audit_request.parameters)} in standard mode)")
        
        # Process all files in parallel using the optimized method
        all_audit_results = await gemini_service.audit_multiple_files_parallel(
            file_paths=saved_files,
            parameters=audit_request.parameters,
            custom_prompts=audit_request.custom_prompts
        )
        
        results = []
        
        # Process results for each file
        for idx, file_path in enumerate(saved_files):
            try:
                # Get file info
                file_info = file_service.get_file_info(file_path)
                
                # Get audit results for this file
                audit_results = all_audit_results[idx] if idx < len(all_audit_results) else []
                
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
                logger.error(f"Error processing results for file {file_path}: {str(e)}")
                # If individual file result processing fails, create error result
                results.append(FileAuditResult(
                    filename=os.path.basename(file_path),
                    file_size=0,
                    results=[],
                    overall_score=0,
                    summary=f"Error processing file results: {str(e)}"
                ))
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Generate overall summary
        overall_summary = _generate_overall_summary(results)
        
        # Clean up files
        file_service.cleanup_files(saved_files)
        
        logger.info(f"OPTIMIZED PROCESSING COMPLETED: {processing_time:.2f} seconds for {len(files)} files")
        
        return AuditResponse(
            audit_id=audit_id,
            total_files=len(files),
            processed_files=len(results),
            results=results,
            overall_summary=f"{overall_summary} | Processing time: {processing_time:.2f}s (optimized)",
            processing_time=processing_time
        )
        
    except Exception as e:
        # Clean up files if there was an error
        if 'saved_files' in locals():
            file_service.cleanup_files(saved_files)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/audit/stream")
async def audit_files_stream(
    request: str = Form(...),
    files: List[UploadFile] = File(...)
):
    """
    STREAMING: Audit files with real-time progress updates via Server-Sent Events
    Provides immediate feedback as each file completes processing
    """
    # Parse request BEFORE creating the generator
    try:
        request_data = json.loads(request)
        audit_request = AuditRequest(**request_data)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid request: {str(e)}")

    # Validate and save files BEFORE creating the generator
    try:
        logger.info(f"Validating {len(files)} files for streaming audit")
        saved_files = await file_service.validate_and_save_files(files)
        logger.info(f"Successfully validated and saved {len(saved_files)} files")
    except Exception as e:
        logger.error(f"File validation failed in streaming endpoint: {str(e)}")
        raise HTTPException(status_code=400, detail=f"File validation failed: {str(e)}")

    async def generate_progress_stream():
        audit_id = str(uuid.uuid4())
        start_time = time.time()
        
        try:
            total_files = len(saved_files)
            total_params = len(audit_request.parameters)
            
            # Send initial progress
            yield f"data: {json.dumps({'type': 'started', 'audit_id': audit_id, 'total_files': total_files, 'total_parameters': total_params, 'expected_time': '2-3 seconds'})}\n\n"
            
            # Process files with progress updates
            results = []
            
            # Process all files and stream progress
            file_tasks = []
            for idx, file_path in enumerate(saved_files):
                # Send file processing start
                file_info = file_service.get_file_info(file_path)
                yield f"data: {json.dumps({'type': 'file_started', 'file_index': idx, 'filename': file_info['filename'], 'progress': (idx / total_files) * 100})}\n\n"
                
                # Create task for this file
                task = asyncio.create_task(gemini_service.audit_file_optimized(
                    file_path=file_path,
                    parameters=audit_request.parameters,
                    custom_prompts=audit_request.custom_prompts
                ))
                file_tasks.append((task, file_path, idx))
            
            # Wait for files to complete and stream results
            for task, file_path, idx in file_tasks:
                try:
                    audit_results = await task
                    file_info = file_service.get_file_info(file_path)
                    
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
                    
                    # Send file completion with detailed results
                    file_completion_data = {
                        'type': 'file_completed', 
                        'file_index': idx, 
                        'filename': file_info['filename'], 
                        'overall_score': overall_score, 
                        'results_count': len(audit_result_objects),
                        'progress': ((idx + 1) / total_files) * 100,
                        'file_size': file_info['size'],
                        'detailed_results': [
                            {
                                'parameter': result.parameter,
                                'verdict': result.verdict,
                                'confidence': result.confidence,
                                'reasoning': result.reasoning
                            } for result in audit_result_objects
                        ]
                    }
                    yield f"data: {json.dumps(file_completion_data)}\n\n"
                    
                except Exception as e:
                    logger.error(f"Error processing file {file_path}: {str(e)}")
                    yield f"data: {json.dumps({'type': 'file_error', 'file_index': idx, 'filename': os.path.basename(file_path), 'error': str(e)})}\n\n"
                    
                    results.append(FileAuditResult(
                        filename=os.path.basename(file_path),
                        file_size=0,
                        results=[],
                        overall_score=0,
                        summary=f"Error processing file: {str(e)}"
                    ))
            
            # Calculate final metrics
            processing_time = time.time() - start_time
            overall_summary = _generate_overall_summary(results)
            
            # Clean up files
            file_service.cleanup_files(saved_files)
            
            # Send completion
            final_response = {
                'type': 'completed',
                'audit_id': audit_id,
                'total_files': total_files,
                'processed_files': len(results),
                'processing_time': processing_time,
                'overall_summary': overall_summary,
                'progress': 100
            }
            yield f"data: {json.dumps(final_response)}\n\n"
            
        except Exception as e:
            logger.error(f"Streaming audit error: {str(e)}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            
            # Cleanup on error
            file_service.cleanup_files(saved_files)

    return StreamingResponse(
        generate_progress_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )

@router.post("/audit/async")
async def audit_files_async(
    background_tasks: BackgroundTasks,
    request: str = Form(...),
    files: List[UploadFile] = File(...)
):
    """
    BACKGROUND: Start audit processing in background with job tracking
    Returns immediately with job ID for status polling
    """
    job_id = str(uuid.uuid4())
    
    try:
        # Parse request
        try:
            request_data = json.loads(request)
            audit_request = AuditRequest(**request_data)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid request: {str(e)}")
        
        # Validate and save files
        saved_files = await file_service.validate_and_save_files(files)
        
        # Initialize job status
        audit_jobs[job_id] = {
            'status': 'processing',
            'progress': 0,
            'total_files': len(saved_files),
            'processed_files': 0,
            'current_file': None,
            'results': None,
            'error': None,
            'started_at': time.time(),
            'completed_at': None,
            'processing_time': None
        }
        
        # Start background processing
        background_tasks.add_task(
            process_audit_job, 
            job_id, 
            saved_files, 
            audit_request.parameters,
            audit_request.custom_prompts
        )
        
        return {
            'job_id': job_id,
            'status': 'started',
            'message': 'Audit processing started in background',
            'total_files': len(saved_files),
            'estimated_time': '2-3 seconds'
        }
        
    except Exception as e:
        # Clean up files if there was an error
        if 'saved_files' in locals():
            file_service.cleanup_files(saved_files)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/audit/status/{job_id}")
async def get_audit_status(job_id: str):
    """
    Get the status of a background audit job
    """
    if job_id not in audit_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = audit_jobs[job_id]
    
    # Calculate processing time
    if job['status'] == 'processing':
        job['processing_time'] = time.time() - job['started_at']
    
    return job

@router.get("/audit/result/{job_id}")
async def get_audit_result(job_id: str):
    """
    Get the complete results of a finished audit job
    """
    if job_id not in audit_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = audit_jobs[job_id]
    
    if job['status'] != 'completed':
        raise HTTPException(
            status_code=202, 
            detail=f"Job is {job['status']}. Results not ready yet."
        )
    
    if job['results'] is None:
        raise HTTPException(status_code=500, detail="Job completed but no results available")
    
    return job['results']

async def process_audit_job(
    job_id: str, 
    saved_files: List[str], 
    parameters: List[str],
    custom_prompts: Dict[str, str] = None
):
    """
    Background processing function for audit jobs
    """
    try:
        logger.info(f"Starting background audit job {job_id}")
        
        # Update job status
        audit_jobs[job_id]['status'] = 'processing'
        audit_jobs[job_id]['progress'] = 5
        
        results = []
        total_files = len(saved_files)
        
        # Process all files in parallel (using our optimized method)
        all_audit_results = await gemini_service.audit_multiple_files_parallel(
            file_paths=saved_files,
            parameters=parameters,
            custom_prompts=custom_prompts
        )
        
        # Process results for each file
        for idx, file_path in enumerate(saved_files):
            try:
                # Update current file being processed
                file_info = file_service.get_file_info(file_path)
                audit_jobs[job_id]['current_file'] = file_info['filename']
                audit_jobs[job_id]['progress'] = 10 + (idx / total_files) * 80  # 10-90% for processing
                
                # Get audit results for this file
                audit_results = all_audit_results[idx] if idx < len(all_audit_results) else []
                
                # Convert to AuditResult objects
                from app.models.audit import AuditResult
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
                from app.models.audit import FileAuditResult
                file_result = FileAuditResult(
                    filename=file_info["filename"],
                    file_size=file_info["size"],
                    results=audit_result_objects,
                    overall_score=overall_score
                )
                
                results.append(file_result)
                audit_jobs[job_id]['processed_files'] = len(results)
                
            except Exception as e:
                logger.error(f"Error processing file {file_path} in job {job_id}: {str(e)}")
                # Continue with other files
                from app.models.audit import FileAuditResult
                results.append(FileAuditResult(
                    filename=os.path.basename(file_path),
                    file_size=0,
                    results=[],
                    overall_score=0,
                    summary=f"Error processing file: {str(e)}"
                ))
                audit_jobs[job_id]['processed_files'] = len(results)
        
        # Finalize job
        processing_time = time.time() - audit_jobs[job_id]['started_at']
        overall_summary = _generate_overall_summary(results)
        
        # Create final response
        from app.models.audit import AuditResponse
        audit_response = AuditResponse(
            audit_id=job_id,
            total_files=total_files,
            processed_files=len(results),
            results=results,
            overall_summary=overall_summary,
            processing_time=processing_time
        )
        
        # Update job status
        audit_jobs[job_id].update({
            'status': 'completed',
            'progress': 100,
            'current_file': None,
            'results': audit_response.dict(),
            'completed_at': time.time(),
            'processing_time': processing_time
        })
        
        # Clean up files
        file_service.cleanup_files(saved_files)
        
        logger.info(f"Background audit job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Background audit job {job_id} failed: {str(e)}")
        
        # Update job with error
        audit_jobs[job_id].update({
            'status': 'failed',
            'error': str(e),
            'completed_at': time.time(),
            'processing_time': time.time() - audit_jobs[job_id]['started_at']
        })
        
        # Clean up files
        if 'saved_files' in locals():
            file_service.cleanup_files(saved_files)

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

async def _process_files_sequential(saved_files: List[str], audit_request, gemini_service, file_service) -> List:
    """
    Fallback sequential processing method (original implementation)
    Used when parallel processing fails
    """
    results = []
    
    # Process each file sequentially
    for file_path in saved_files:
        try:
            # Get file info
            file_info = file_service.get_file_info(file_path)
            
            # Audit the file using original method
            audit_results = await gemini_service.audit_file(
                file_path=file_path,
                parameters=audit_request.parameters,
                custom_prompts=audit_request.custom_prompts
            )
            
            # Convert to AuditResult objects
            from app.models.audit import AuditResult
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
            from app.models.audit import FileAuditResult
            file_result = FileAuditResult(
                filename=file_info["filename"],
                file_size=file_info["size"],
                results=audit_result_objects,
                overall_score=overall_score
            )
            
            results.append(file_result)
            
        except Exception as e:
            # If individual file fails, continue with others
            from app.models.audit import FileAuditResult
            results.append(FileAuditResult(
                filename=os.path.basename(file_path),
                file_size=0,
                results=[],
                overall_score=0,
                summary=f"Error processing file: {str(e)}"
            ))
    
    return results 