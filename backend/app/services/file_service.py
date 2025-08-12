import os
import aiofiles
import filetype
from typing import List, Tuple
from fastapi import UploadFile, HTTPException
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class FileService:
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        self.max_file_size = settings.MAX_FILE_SIZE
        self.allowed_formats = settings.ALLOWED_AUDIO_FORMATS
        self.max_files = settings.MAX_FILES_PER_REQUEST
        
        # Create upload directory if it doesn't exist
        os.makedirs(self.upload_dir, exist_ok=True)
    
    async def validate_and_save_files(self, files: List[UploadFile]) -> List[str]:
        """
        Validate and save uploaded files
        """
        if len(files) > self.max_files:
            raise HTTPException(
                status_code=400,
                detail=f"Maximum {self.max_files} files allowed per request"
            )
        
        saved_files = []
        
        for file in files:
            # Validate and save file in one step to avoid reading the file twice
            file_path = await self._validate_and_save_file(file)
            saved_files.append(file_path)
        
        return saved_files
    
    async def _validate_and_save_file(self, file: UploadFile) -> str:
        """
        Validate and save a file in one step to avoid reading the file twice
        """
        # Check file size
        if file.size and file.size > self.max_file_size:
            raise HTTPException(
                status_code=400,
                detail=f"File {file.filename} is too large. Maximum size is {self.max_file_size // (1024*1024)}MB"
            )
        
        # Check filename exists
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="File must have a filename"
            )
        
        # Check file extension
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in self.allowed_formats:
            raise HTTPException(
                status_code=400,
                detail=f"File format {file_ext} not allowed. Allowed formats: {', '.join(self.allowed_formats)}"
            )
        
        # Read file content once for both validation and saving
        content = await file.read()
        
        # Validate MIME type using the content
        if len(content) > 0:
            kind = filetype.guess(content[:8192])
            mime_type = kind.mime if kind else 'application/octet-stream'
            if not mime_type.startswith('audio/'):
                raise HTTPException(
                    status_code=400,
                    detail=f"File {file.filename} is not an audio file. Detected MIME type: {mime_type}"
                )
        
        # Create a unique filename and save the file
        import uuid
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(self.upload_dir, unique_filename)
        
        # Save the file using the content we already read
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        logger.info(f"Validated and saved file: {file_path}")
        return file_path
    
    async def _validate_file(self, file: UploadFile) -> None:
        """
        Validate a single file
        """
        # Check file size
        if file.size and file.size > self.max_file_size:
            raise HTTPException(
                status_code=400,
                detail=f"File {file.filename} is too large. Maximum size is {self.max_file_size // (1024*1024)}MB"
            )
        
        # Check file extension
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="File must have a filename"
            )
        
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in self.allowed_formats:
            raise HTTPException(
                status_code=400,
                detail=f"File format {file_ext} not allowed. Allowed formats: {', '.join(self.allowed_formats)}"
            )
        
        # Check MIME type
        content = await file.read(1024)  # Read first 1KB for MIME detection
        await file.seek(0)  # Reset file pointer
        
        kind = filetype.guess(content)
        mime_type = kind.mime if kind else 'application/octet-stream'
        if not mime_type.startswith('audio/'):
            raise HTTPException(
                status_code=400,
                detail=f"File {file.filename} is not an audio file. Detected MIME type: {mime_type}"
            )
    
    async def _save_file(self, file: UploadFile) -> str:
        """
        Save a file to the upload directory
        """
        # Create a unique filename
        import uuid
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(self.upload_dir, unique_filename)
        
        # Save the file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        logger.info(f"Saved file: {file_path}")
        return file_path
    
    def get_file_info(self, file_path: str) -> dict:
        """
        Get information about a file
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        stat = os.stat(file_path)
        return {
            "path": file_path,
            "size": stat.st_size,
            "filename": os.path.basename(file_path),
            "extension": os.path.splitext(file_path)[1]
        }
    
    def cleanup_files(self, file_paths: List[str]) -> None:
        """
        Clean up uploaded files
        """
        for file_path in file_paths:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.info(f"Cleaned up file: {file_path}")
            except Exception as e:
                logger.error(f"Error cleaning up file {file_path}: {str(e)}")
    
    def get_total_size(self, file_paths: List[str]) -> int:
        """
        Calculate total size of files
        """
        total_size = 0
        for file_path in file_paths:
            if os.path.exists(file_path):
                total_size += os.path.getsize(file_path)
        return total_size 