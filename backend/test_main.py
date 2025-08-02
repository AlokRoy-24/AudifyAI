#!/usr/bin/env python3
"""
Simple test script to verify the backend structure
"""

import os
import sys
import asyncio
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def test_imports():
    """Test that all modules can be imported"""
    try:
        from app.core.config import settings
        print("✓ Config imported successfully")
        
        from app.models.audit import AuditParameter, AuditResult
        print("✓ Models imported successfully")
        
        from app.services.file_service import FileService
        print("✓ FileService imported successfully")
        
        from app.services.gemini_service import GeminiService
        print("✓ GeminiService imported successfully")
        
        from app.routers.audit import router as audit_router
        print("✓ Audit router imported successfully")
        
        from app.routers.health import router as health_router
        print("✓ Health router imported successfully")
        
        from prompts.audit_prompts import get_prompt_for_parameter, get_all_parameters
        print("✓ Prompts imported successfully")
        
        return True
        
    except Exception as e:
        print(f"✗ Import error: {e}")
        return False

def test_config():
    """Test configuration loading"""
    try:
        from app.core.config import settings
        
        # Test that required settings exist
        assert hasattr(settings, 'GOOGLE_API_KEY')
        assert hasattr(settings, 'GEMINI_MODEL')
        assert hasattr(settings, 'MAX_FILE_SIZE')
        assert hasattr(settings, 'ALLOWED_AUDIO_FORMATS')
        
        print("✓ Configuration loaded successfully")
        return True
        
    except Exception as e:
        print(f"✗ Configuration error: {e}")
        return False

def test_prompts():
    """Test prompt loading"""
    try:
        from prompts.audit_prompts import get_prompt_for_parameter, get_all_parameters
        
        # Test getting a specific prompt
        greeting_prompt = get_prompt_for_parameter("greeting")
        assert "greeting" in greeting_prompt.lower()
        
        # Test getting all parameters
        all_params = get_all_parameters()
        assert "greeting" in all_params
        assert "empathy" in all_params
        
        print("✓ Prompts loaded successfully")
        return True
        
    except Exception as e:
        print(f"✗ Prompts error: {e}")
        return False

def test_models():
    """Test model validation"""
    try:
        from app.models.audit import AuditResult, AuditParameter
        from datetime import datetime
        
        # Test creating an audit result
        result = AuditResult(
            parameter="greeting",
            verdict="Yes",
            confidence="85%",
            reasoning="Agent offered a clear greeting"
        )
        
        assert result.parameter == "greeting"
        assert result.verdict == "Yes"
        
        print("✓ Models validation successful")
        return True
        
    except Exception as e:
        print(f"✗ Models error: {e}")
        return False

def main():
    """Run all tests"""
    print("Testing AudifyAI Backend Structure")
    print("=" * 40)
    
    tests = [
        ("Import Tests", test_imports),
        ("Configuration Tests", test_config),
        ("Prompts Tests", test_prompts),
        ("Models Tests", test_models),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\nRunning {test_name}...")
        if test_func():
            passed += 1
        else:
            print(f"✗ {test_name} failed")
    
    print(f"\n{'=' * 40}")
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! Backend structure is ready.")
        return True
    else:
        print("❌ Some tests failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 