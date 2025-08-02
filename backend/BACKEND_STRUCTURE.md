# AudifyAI Backend Structure

## Overview

The AudifyAI backend is a FastAPI-based REST API that provides AI-powered call audit functionality using Google Gemini. It processes audio files and analyzes them for various call center interaction parameters.

## Architecture

```
backend/
├── app/                          # Main application package
│   ├── core/                     # Core configuration
│   │   └── config.py            # Settings and configuration
│   ├── models/                   # Data models
│   │   └── audit.py             # Pydantic models for API
│   ├── routers/                  # API route handlers
│   │   ├── audit.py             # Audit endpoints
│   │   └── health.py            # Health check endpoints
│   └── services/                 # Business logic services
│       ├── file_service.py      # File handling and validation
│       └── gemini_service.py    # AI analysis using Gemini
├── prompts/                      # AI prompts
│   └── audit_prompts.py         # Individual audit prompts
├── uploads/                      # Temporary file storage
├── main.py                       # FastAPI application entry point
├── run.py                        # Startup script with checks
├── test_main.py                  # Structure validation tests
├── example_usage.py              # API usage examples
├── requirements.txt              # Python dependencies
├── env.example                   # Environment variables template
└── README.md                     # Comprehensive documentation
```

## Key Components

### 1. Configuration (`app/core/config.py`)
- Environment variable management
- API settings (file sizes, formats, etc.)
- Google Gemini configuration
- CORS settings

### 2. Data Models (`app/models/audit.py`)
- `AuditParameter`: Enum of available audit parameters
- `AuditResult`: Individual audit result
- `FileAuditResult`: Complete file audit results
- `AuditRequest`: API request model
- `AuditResponse`: API response model

### 3. Services

#### File Service (`app/services/file_service.py`)
- File upload validation
- Audio format checking
- File size limits
- Secure file handling
- Automatic cleanup

#### Gemini Service (`app/services/gemini_service.py`)
- Google Gemini API integration
- Audio file processing
- Prompt management
- Response parsing
- Error handling

### 4. API Endpoints

#### Health Check (`app/routers/health.py`)
- `GET /api/v1/health` - Health status
- `GET /api/v1/config` - Configuration info

#### Audit (`app/routers/audit.py`)
- `POST /api/v1/upload` - Upload audio files
- `POST /api/v1/audit` - Perform audit analysis
- `GET /api/v1/parameters` - Get available parameters

### 5. Prompts (`prompts/audit_prompts.py`)
Individual prompts for each audit parameter:
- **Opening**: greeting, introduction
- **Communication**: active-listening, empathy, clarity
- **Problem Solving**: solution-oriented
- **Knowledge**: product-knowledge
- **Sales**: objection-handling
- **Closing**: closing, follow-up

## API Flow

1. **File Upload**
   ```
   Client → POST /api/v1/upload → File Validation → Storage → Response
   ```

2. **Audit Process**
   ```
   Client → POST /api/v1/audit → File Processing → Gemini Analysis → Results → Cleanup → Response
   ```

3. **Parameter Retrieval**
   ```
   Client → GET /api/v1/parameters → Available Parameters → Response
   ```

## Data Flow

### Upload Process
1. Client uploads audio files
2. File service validates format, size, and type
3. Files are temporarily stored with unique names
4. Upload confirmation returned

### Audit Process
1. Client sends files + audit parameters
2. Files are validated and processed
3. For each file and parameter:
   - File uploaded to Gemini
   - Appropriate prompt selected
   - AI analysis performed
   - Results parsed and structured
4. Overall scores calculated
5. Files cleaned up
6. Comprehensive results returned

## Security Features

- **File Validation**: MIME type checking, size limits
- **Input Validation**: Pydantic models ensure data integrity
- **CORS Protection**: Configured for frontend domains
- **Secure File Handling**: Temporary storage with cleanup
- **Error Handling**: Comprehensive error responses

## Performance Optimizations

- **Async Processing**: Non-blocking file operations
- **Parallel Processing**: Multiple files processed concurrently
- **Memory Management**: Automatic file cleanup
- **Efficient Parsing**: Optimized response parsing

## Error Handling

The backend includes comprehensive error handling for:
- Invalid file formats
- File size violations
- Missing API keys
- Network timeouts
- Processing failures
- Invalid parameters

## Configuration

### Environment Variables
```bash
GOOGLE_API_KEY=your_gemini_api_key
SECRET_KEY=your_secret_key
MAX_FILE_SIZE=52428800  # 50MB
MAX_FILES_PER_REQUEST=10
```

### File Upload Settings
- **Supported Formats**: MP3, WAV, M4A, AAC, FLAC
- **Maximum Size**: 50MB per file
- **Maximum Files**: 10 per request

## Testing

### Structure Tests
```bash
python test_main.py
```

### API Tests
```bash
python example_usage.py
```

### Manual Testing
```bash
# Start server
python run.py

# Test endpoints
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/api/v1/parameters
```

## Development

### Setup
1. Install dependencies: `pip install -r requirements.txt`
2. Copy environment: `cp env.example .env`
3. Configure API key in `.env`
4. Run tests: `python test_main.py`
5. Start server: `python run.py`

### API Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Integration with Frontend

The backend is designed to work seamlessly with the React frontend:

1. **File Upload**: Frontend uploads files via `/api/v1/upload`
2. **Parameter Selection**: Frontend gets available parameters via `/api/v1/parameters`
3. **Audit Execution**: Frontend sends files + parameters via `/api/v1/audit`
4. **Results Display**: Frontend receives structured audit results

## Scalability Considerations

- **Horizontal Scaling**: Stateless design allows multiple instances
- **File Storage**: Can be extended to use cloud storage (S3, etc.)
- **Database Integration**: Can add persistent storage for audit history
- **Caching**: Can add Redis for frequently accessed data
- **Load Balancing**: Can be deployed behind a load balancer

## Monitoring and Logging

- **Health Checks**: Built-in health monitoring
- **Error Logging**: Comprehensive error tracking
- **Performance Metrics**: Processing time tracking
- **File Cleanup**: Automatic temporary file management

## Future Enhancements

- **Database Integration**: Store audit history
- **User Authentication**: JWT-based authentication
- **Batch Processing**: Queue-based processing for large files
- **Advanced Analytics**: Detailed performance metrics
- **Custom Prompts**: User-defined audit criteria
- **Export Features**: PDF/Excel report generation 