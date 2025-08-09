import os
import json
import asyncio
import google.generativeai as genai
from typing import List, Dict, Tuple, Optional
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
    
    async def audit_file_optimized(self, file_path: str, parameters: List[str], custom_prompts: Optional[Dict[str, str]] = None) -> List[Dict]:
        """
        Optimized audit method using combined prompts (single API call per file)
        This reduces API calls from N parameters to 1 call per file
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
            
            logger.info(f"Processing file with optimized method: {file_path}")
            
            # Use combined prompt for all parameters
            if custom_prompts:
                # If custom prompts provided, fall back to individual processing
                return await self.audit_file(file_path, parameters, custom_prompts)
            
            # Import the combined prompt function
            from prompts.audit_prompts import get_combined_prompt
            combined_prompt = get_combined_prompt(parameters)
            
            # Create content parts
            content_parts = [
                {"text": combined_prompt},
                {"inline_data": file_data}
            ]
            
            # Single API call for all parameters
            response = self.model.generate_content(content_parts)
            text = response.text.strip()
            
            # Parse JSON response (clean markdown formatting if present)
            try:
                # Remove markdown code block formatting if present
                clean_text = text.strip()
                if clean_text.startswith('```json'):
                    clean_text = clean_text[7:]  # Remove ```json
                if clean_text.startswith('```'):
                    clean_text = clean_text[3:]   # Remove ```
                if clean_text.endswith('```'):
                    clean_text = clean_text[:-3]  # Remove trailing ```
                clean_text = clean_text.strip()
                
                parsed_response = json.loads(clean_text)
                results = parsed_response.get("results", [])
                
                # Validate and format results
                formatted_results = []
                for result in results:
                    if isinstance(result, dict) and all(key in result for key in ["parameter", "verdict", "confidence", "reasoning"]):
                        formatted_results.append({
                            "parameter": result["parameter"],
                            "verdict": result["verdict"],
                            "confidence": result["confidence"],
                            "reasoning": result.get("reasoning", "")
                        })
                
                # If we didn't get results for all parameters, fill in missing ones
                processed_params = {r["parameter"] for r in formatted_results}
                for param in parameters:
                    if param not in processed_params:
                        formatted_results.append({
                            "parameter": param,
                            "verdict": "Unknown",
                            "confidence": "N/A",
                            "reasoning": "Parameter not processed in combined response"
                        })
                
                return formatted_results
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response for {file_path}: {str(e)}")
                logger.error(f"Raw response: {text}")
                
                # Fallback to individual parameter processing
                logger.info("Falling back to individual parameter processing")
                return await self.audit_file(file_path, parameters, custom_prompts)
            
        except Exception as e:
            logger.error(f"Error in optimized audit for file {file_path}: {str(e)}")
            # Fallback to original method
            return await self.audit_file(file_path, parameters, custom_prompts)
    
    async def audit_multiple_files_parallel(self, file_paths: List[str], parameters: List[str], custom_prompts: Optional[Dict[str, str]] = None) -> List[Dict]:
        """
        Process multiple files in parallel using optimized method
        This provides maximum performance improvement
        """
        logger.info(f"Processing {len(file_paths)} files in parallel with {len(parameters)} parameters")
        
        # Create tasks for all files
        tasks = [
            self.audit_file_optimized(file_path, parameters, custom_prompts)
            for file_path in file_paths
        ]
        
        # Execute all files concurrently
        all_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results and handle any exceptions
        processed_results = []
        for idx, result in enumerate(all_results):
            if isinstance(result, Exception):
                logger.error(f"Error processing file {file_paths[idx]}: {str(result)}")
                # Create error result for failed file
                error_results = []
                for param in parameters:
                    error_results.append({
                        "parameter": param,
                        "verdict": "Unknown",
                        "confidence": "N/A",
                        "reasoning": f"Error processing file: {str(result)}"
                    })
                processed_results.append(error_results)
            else:
                processed_results.append(result)
        
        return processed_results 