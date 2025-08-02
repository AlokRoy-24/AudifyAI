import os
import google.generativeai as genai
from typing import List, Dict, Tuple, Optional
import asyncio
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY
        self.model_name = settings.GEMINI_MODEL
        
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY is required")
        
        # Configure Gemini
        # genai.configure(api_key=self.api_key)
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(self.model_name)
        
    async def audit_file(self, file_path: str, parameters: List[str], custom_prompts: Optional[Dict[str, str]] = None) -> List[Dict]:
        """
        Audit a single audio file for the specified parameters
        """
        try:
            # Read the file content
            with open(file_path, 'rb') as f:
                file_content = f.read()
            
            # Create file data for Gemini
            file_data = {
                "mime_type": "audio/wav",
                "data": file_content
            }
            
            logger.info(f"Processing file: {file_path}")
            
            results = []
            
            # Process each parameter
            for parameter in parameters:
                result = await self._audit_parameter(file_data, parameter, custom_prompts)
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"Error auditing file {file_path}: {str(e)}")
            raise
    
    async def _audit_parameter(self, file_data, parameter: str, custom_prompts: Optional[Dict[str, str]] = None) -> Dict:
        """
        Audit a single parameter for the given file
        """
        # Get the prompt for this parameter
        prompt = self._get_prompt_for_parameter(parameter, custom_prompts)
        
        try:
            # Create content parts
            content_parts = [
                {"text": prompt},
                {"inline_data": file_data}
            ]
            
            # Generate content
            response = self.model.generate_content(content_parts)
            text = response.text.strip()
            
            # Parse the response
            verdict, confidence, reasoning = self._parse_response(text)
            
            return {
                "parameter": parameter,
                "verdict": verdict,
                "confidence": confidence,
                "reasoning": reasoning
            }
            
        except Exception as e:
            logger.error(f"Error auditing parameter {parameter}: {str(e)}")
            return {
                "parameter": parameter,
                "verdict": "Unknown",
                "confidence": "N/A",
                "reasoning": f"Error: {str(e)}"
            }
    
    def _get_prompt_for_parameter(self, parameter: str, custom_prompts: Optional[Dict[str, str]] = None) -> str:
        """
        Get the appropriate prompt for a given parameter
        """
        # Check for custom prompt first
        if custom_prompts and parameter in custom_prompts:
            return custom_prompts[parameter]
        
        # Import prompts from the prompts module
        from prompts.audit_prompts import get_prompt_for_parameter as get_prompt
        
        return get_prompt(parameter)
    
    def _parse_response(self, text: str) -> Tuple[str, str, str]:
        """
        Parse the AI response to extract verdict, confidence, and reasoning
        """
        verdict = "Unknown"
        confidence = "N/A"
        reasoning = ""
        
        lower_text = text.lower()
        
        # Extract verdict
        if "yes" in lower_text:
            verdict = "Yes"
        elif "no" in lower_text:
            verdict = "No"
        
        # Extract confidence score
        import re
        confidence_match = re.search(r'(\d+)%', text)
        if confidence_match:
            confidence = f"{confidence_match.group(1)}%"
        
        # Extract reasoning (everything after the verdict and confidence)
        lines = text.split('\n')
        reasoning_lines = []
        found_verdict = False
        
        for line in lines:
            line_lower = line.lower()
            if any(word in line_lower for word in ['yes', 'no', 'confidence', '%']):
                found_verdict = True
                continue
            if found_verdict and line.strip():
                reasoning_lines.append(line.strip())
        
        reasoning = ' '.join(reasoning_lines) if reasoning_lines else text
        
        return verdict, confidence, reasoning 