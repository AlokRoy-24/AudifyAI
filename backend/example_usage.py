#!/usr/bin/env python3
"""
Example usage of AudifyAI Backend API
This script demonstrates how to interact with the backend endpoints
"""

import requests
import json
import os
from pathlib import Path

# API base URL
BASE_URL = "http://localhost:8000/api/v1"

def test_health_check():
    """Test the health check endpoint"""
    print("🏥 Testing health check...")
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data['status']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Is it running?")
        return False

def test_get_parameters():
    """Test getting available audit parameters"""
    print("\n📋 Testing parameters endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/parameters")
        if response.status_code == 200:
            data = response.json()
            parameters = data.get("parameters", [])
            print(f"✅ Found {len(parameters)} audit parameters:")
            
            # Group by category
            categories = {}
            for param in parameters:
                category = param.get("category", "Other")
                if category not in categories:
                    categories[category] = []
                categories[category].append(param["name"])
            
            for category, params in categories.items():
                print(f"   {category}:")
                for param in params:
                    print(f"     - {param}")
            
            return True
        else:
            print(f"❌ Parameters request failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error getting parameters: {e}")
        return False

def test_upload_files():
    """Test file upload (requires actual audio files)"""
    print("\n📁 Testing file upload...")
    
    # Check if we have test files
    test_files = []
    for ext in [".wav", ".mp3", ".m4a"]:
        test_file = Path(f"test_audio{ext}")
        if test_file.exists():
            test_files.append(str(test_file))
    
    if not test_files:
        print("⚠️  No test audio files found")
        print("   Create test files named 'test_audio.wav', 'test_audio.mp3', etc.")
        return False
    
    try:
        files = [("files", open(file_path, "rb")) for file_path in test_files]
        response = requests.post(f"{BASE_URL}/upload", files=files)
        
        # Close files
        for _, file in files:
            file.close()
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Upload successful:")
            print(f"   Files uploaded: {data['file_count']}")
            print(f"   Total size: {data['total_size']} bytes")
            return True
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error uploading files: {e}")
        return False

def test_audit_files():
    """Test audit functionality (requires actual audio files)"""
    print("\n🔍 Testing audit functionality...")
    
    # Check if we have test files
    test_file = Path("test_audio.wav")
    if not test_file.exists():
        print("⚠️  No test audio file found")
        print("   Create a file named 'test_audio.wav' to test audit")
        return False
    
    try:
        # Prepare the request
        files = [("files", open(test_file, "rb"))]
        data = {
            "request": json.dumps({
                "parameters": ["greeting", "empathy", "clarity"],
                "custom_prompts": {}
            })
        }
        
        response = requests.post(f"{BASE_URL}/audit", files=files, data=data)
        
        # Close files
        for _, file in files:
            file.close()
        
        if response.status_code == 200:
            audit_data = response.json()
            print(f"✅ Audit successful:")
            print(f"   Audit ID: {audit_data['audit_id']}")
            print(f"   Files processed: {audit_data['processed_files']}")
            print(f"   Processing time: {audit_data.get('processing_time', 'N/A')}s")
            
            # Show results for first file
            if audit_data['results']:
                first_result = audit_data['results'][0]
                print(f"   First file: {first_result['filename']}")
                print(f"   Overall score: {first_result.get('overall_score', 'N/A')}%")
                
                for result in first_result['results']:
                    print(f"     {result['parameter']}: {result['verdict']} ({result['confidence']})")
            
            return True
        else:
            print(f"❌ Audit failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error during audit: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 AudifyAI Backend API Tests")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health_check),
        ("Get Parameters", test_get_parameters),
        ("Upload Files", test_upload_files),
        ("Audit Files", test_audit_files),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        if test_func():
            passed += 1
        else:
            print(f"❌ {test_name} failed")
    
    print(f"\n{'='*50}")
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! Backend is working correctly.")
    else:
        print("❌ Some tests failed. Check the errors above.")
    
    print("\n💡 Tips:")
    print("   - Make sure the backend server is running: python run.py")
    print("   - Set up your .env file with GOOGLE_API_KEY")
    print("   - Create test audio files to test upload and audit functionality")
    print("   - Check the API docs at http://localhost:8000/docs")

if __name__ == "__main__":
    main() 