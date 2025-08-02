from fastapi import APIRouter
from app.models.audit import HealthResponse
from app.core.config import settings

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint
    """
    return HealthResponse(
        status="healthy",
        version="1.0.0"
    )

@router.get("/config")
async def get_config():
    """
    Get application configuration (for debugging)
    """
    return {
        "max_file_size": settings.MAX_FILE_SIZE,
        "allowed_formats": settings.ALLOWED_AUDIO_FORMATS,
        "max_files_per_request": settings.MAX_FILES_PER_REQUEST,
        "gemini_model": settings.GEMINI_MODEL,
        "api_key_configured": bool(settings.GOOGLE_API_KEY)
    } 