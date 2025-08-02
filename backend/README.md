# AudifyAI Backend

A FastAPI-based backend for AI-powered call audit system using Google Gemini.

## Features

- **Audio File Processing**: Support for multiple audio formats (MP3, WAV, M4A, AAC, FLAC)
- **AI-Powered Analysis**: Uses Google Gemini for intelligent call analysis
- **Comprehensive Auditing**: 10+ audit parameters covering all aspects of call center interactions
- **RESTful API**: Clean, documented API endpoints
- **File Validation**: Secure file upload with size and format validation
- **Real-time Processing**: Async processing for better performance

## Quick Start

### Prerequisites

- Python 3.8+
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your Google API key
   ```

4. **Run the application**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Endpoints

### Health Check
- `GET /api/v1/health` - Health check endpoint
- `GET /api/v1/config` - Get application configuration

### File Upload
- `POST /api/v1/upload` - Upload audio files for processing

### Audit Operations
- `POST /api/v1/audit` - Perform audit on uploaded files
- `GET /api/v1/parameters` - Get available audit parameters

## Audit Parameters

The system supports the following audit parameters:

### Opening
- **greeting**: Professional greeting at call start
- **introduction**: Agent introduction and company identification

### Communication
- **active-listening**: Active listening skills demonstration
- **empathy**: Empathy towards customer concerns
- **clarity**: Clear and concise communication

### Problem Solving
- **solution-oriented**: Focus on solving customer problems

### Knowledge
- **product-knowledge**: Product and service knowledge

### Sales
- **objection-handling**: Effective objection handling

### Closing
- **closing**: Proper call closure
- **follow-up**: Follow-up action commitments

## Usage Examples

### Upload Files
```bash
curl -X POST "http://localhost:8000/api/v1/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "files=@call_recording.wav"
```

### Perform Audit
```bash
curl -X POST "http://localhost:8000/api/v1/audit" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "files=@call_recording.wav" \
  -F 'request={"parameters":["greeting","empathy","clarity"]}'
```

## Configuration

### Environment Variables

- `GOOGLE_API_KEY`: Your Google Gemini API key
- `SECRET_KEY`: Application secret key
- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 50MB)
- `MAX_FILES_PER_REQUEST`: Maximum files per request (default: 10)

### File Upload Settings

- **Supported Formats**: MP3, WAV, M4A, AAC, FLAC
- **Maximum File Size**: 50MB per file
- **Maximum Files**: 10 files per request

## Project Structure

```
backend/
├── app/
│   ├── core/
│   │   └── config.py          # Configuration settings
│   ├── models/
│   │   └── audit.py           # Pydantic models
│   ├── routers/
│   │   ├── audit.py           # Audit endpoints
│   │   └── health.py          # Health check endpoints
│   └── services/
│       ├── file_service.py    # File handling service
│       └── gemini_service.py  # AI analysis service
├── prompts/
│   └── audit_prompts.py       # Audit prompts
├── uploads/                   # Uploaded files (auto-created)
├── main.py                    # FastAPI application
├── requirements.txt           # Python dependencies
└── README.md                 # This file
```

## Development

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
black .
isort .
```

### Type Checking
```bash
mypy .
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Error Handling

The API includes comprehensive error handling for:
- Invalid file formats
- File size limits
- Missing API keys
- Processing errors
- Network timeouts

## Security Features

- File type validation using magic numbers
- File size limits
- CORS configuration
- Input validation
- Secure file handling

## Performance

- Async file processing
- Automatic file cleanup
- Efficient memory usage
- Parallel processing capabilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License. 