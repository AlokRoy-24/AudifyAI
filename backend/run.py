#!/usr/bin/env python3
"""
Startup script for AudifyAI Backend
"""

import os
import sys
import uvicorn
from pathlib import Path

def check_environment():
    """Check if environment is properly set up"""
    print("🔍 Checking environment...")
    
    # Check if .env file exists
    env_file = Path(".env")
    if not env_file.exists():
        print("⚠️  Warning: .env file not found")
        print("   Please copy env.example to .env and configure your settings")
        print("   cp env.example .env")
        return False
    
    # Check for required environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key or google_api_key == "your_google_api_key_here":
        print("⚠️  Warning: GOOGLE_API_KEY not configured")
        print("   Please set your Google Gemini API key in .env file")
        return False
    
    print("✅ Environment check passed")
    return True

def check_dependencies():
    """Check if all dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    required_packages = [
        "fastapi",
        "uvicorn",
        "google.generativeai",
        "multipart",
        "dotenv",
        "pydantic",
        "aiofiles",
        "magic"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing packages: {', '.join(missing_packages)}")
        print("   Please install dependencies: pip install -r requirements.txt")
        return False
    
    print("✅ Dependencies check passed")
    return True

def main():
    """Main startup function"""
    print("🚀 Starting AudifyAI Backend")
    print("=" * 40)
    
    # Check environment
    if not check_environment():
        print("\n❌ Environment check failed")
        sys.exit(1)
    
    # Check dependencies
    if not check_dependencies():
        print("\n❌ Dependencies check failed")
        sys.exit(1)
    
    print("\n✅ All checks passed!")
    print("🌐 Starting server on http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🔄 Press Ctrl+C to stop the server")
    print("=" * 40)
    
    # Start the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main() 