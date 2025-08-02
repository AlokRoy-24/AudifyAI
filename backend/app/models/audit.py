from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class AuditParameter(str, Enum):
    GREETING = "greeting"
    INTRODUCTION = "introduction"
    ACTIVE_LISTENING = "active-listening"
    EMPATHY = "empathy"
    CLARITY = "clarity"
    SOLUTION_ORIENTED = "solution-oriented"
    PRODUCT_KNOWLEDGE = "product-knowledge"
    OBJECTION_HANDLING = "objection-handling"
    CLOSING = "closing"
    FOLLOW_UP = "follow-up"

class AuditResult(BaseModel):
    parameter: str
    verdict: str  # "Yes", "No", "Unknown"
    confidence: str  # "0-100%"
    reasoning: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)

class FileAuditResult(BaseModel):
    filename: str
    file_size: int
    duration: Optional[float] = None
    results: List[AuditResult]
    overall_score: Optional[float] = None
    summary: Optional[str] = None

class AuditRequest(BaseModel):
    parameters: List[str] = Field(..., description="List of audit parameters to check")
    custom_prompts: Optional[Dict[str, str]] = Field(default=None, description="Custom prompts for specific parameters")

class AuditResponse(BaseModel):
    audit_id: str
    total_files: int
    processed_files: int
    results: List[FileAuditResult]
    overall_summary: Optional[str] = None
    generated_at: datetime = Field(default_factory=datetime.now)
    processing_time: Optional[float] = None

class UploadResponse(BaseModel):
    message: str
    uploaded_files: List[str]
    total_size: int
    file_count: int

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime = Field(default_factory=datetime.now)
    version: str = "1.0.0" 