# AudifyAI - AI-Powered Call Audit System

<div align="center">
  <img src="frontend/public/logo.png" alt="AudifyAI Logo" width="200"/>
  
  <h3>Intelligent Call Center Analysis with Google Gemini AI</h3>
  
  [![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
</div>

## 🚀 Overview

AudifyAI is a cutting-edge AI-powered call audit system that automatically analyzes call center interactions using Google's Gemini AI. It provides comprehensive insights into agent performance across 10+ audit parameters, from professional greetings to follow-up commitments.

### ✨ Key Features

- **🤖 AI-Powered Analysis**: Uses Google Gemini AI for intelligent audio analysis
- **📊 Comprehensive Auditing**: 10+ audit parameters covering all aspects of call center interactions
- **⚡ Real-time Processing**: Live progress updates with streaming responses
- **🔄 Parallel Processing**: Optimized for handling multiple files simultaneously
- **📱 Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS
- **🔒 Secure & Private**: Automatic file cleanup and secure processing
- **📈 Detailed Analytics**: Scores, confidence levels, and actionable insights

## 🏗️ Architecture

### Technology Stack

**Backend:**
- **FastAPI** - Modern, fast web framework for building APIs
- **Google Gemini AI** - Advanced AI for audio analysis
- **Python 3.8+** - Core backend language
- **AsyncIO** - Asynchronous processing for optimal performance
- **Pydantic** - Data validation and serialization

**Frontend:**
- **React 18** with **TypeScript** - Modern UI framework
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Service    │
│   (React/TS)    │◄──►│   (FastAPI)     │◄──►│   (Gemini AI)   │
│                 │    │                 │    │                 │
│ • File Upload   │    │ • File Service  │    │ • Audio Analysis│
│ • Parameters    │    │ • AI Service    │    │ • Score Calc    │
│ • Progress      │    │ • Streaming     │    │ • Reasoning     │
│ • Results       │    │ • Validation    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+**
- **Node.js 18+**
- **Google Gemini API Key** ([Get one here](https://ai.google.dev/))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AudifyAI
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   
   # Create environment file
   cp .env.example .env
   # Edit .env with your Google API key
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Run the Application**
   
   **Backend:**
   ```bash
   cd backend
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   
   **Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 📋 Usage Guide

### 3-Step Process

1. **📁 Upload Calls**
   - Upload up to 10 audio files
   - Supports MP3, WAV, M4A, AAC, FLAC formats
   - Maximum 50MB per file

2. **⚙️ Select Audit Parameters**
   - Choose from 10 predefined parameters
   - Categories: Opening, Communication, Problem Solving, Knowledge, Sales, Closing
   - Custom parameters supported

3. **📊 Generate Report**
   - Real-time processing with live updates
   - Detailed scores and reasoning
   - Exportable results

### Audit Parameters

| Category | Parameters |
|----------|------------|
| **Opening** | Professional Greeting, Agent Introduction |
| **Communication** | Active Listening, Empathy, Clear Communication |
| **Problem Solving** | Solution-Oriented Approach |
| **Knowledge** | Product Knowledge |
| **Sales** | Objection Handling |
| **Closing** | Proper Closing, Follow-up Commitment |

## 🔧 API Endpoints

### Core Endpoints

- `POST /api/v1/upload` - Upload audio files
- `POST /api/v1/audit` - Standard audit processing
- `GET /api/v1/parameters` - Get available audit parameters
- `GET /api/v1/health` - Health check

### Advanced Endpoints

- `POST /api/v1/audit/optimized` - Optimized parallel processing
- `POST /api/v1/audit/stream` - Real-time streaming updates
- `POST /api/v1/audit/async` - Background job processing
- `GET /api/v1/audit/status/{job_id}` - Job status tracking

## 🛠️ Development

### Project Structure

```
AudifyAI/
├── backend/
│   ├── app/
│   │   ├── core/           # Configuration
│   │   ├── models/         # Pydantic models
│   │   ├── routers/        # API endpoints
│   │   └── services/       # Business logic
│   ├── prompts/            # AI prompts
│   ├── uploads/            # Temporary file storage
│   └── main.py             # FastAPI application
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── hooks/          # Custom hooks
│   └── public/             # Static assets
└── README.md
```

### Environment Variables

**Backend (.env):**
```env
GOOGLE_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_secret_key_here
MAX_FILE_SIZE=52428800  # 50MB
MAX_FILES_PER_REQUEST=10
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Formatting

```bash
# Backend
cd backend
black .
isort .

# Frontend
cd frontend
npm run lint
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Manual Deployment

1. **Backend**: Deploy to your preferred Python hosting (Railway, Heroku, etc.)
2. **Frontend**: Build and deploy to Vercel, Netlify, or similar
3. **Environment**: Set up environment variables on your hosting platform

## 📊 Performance Features

- **Parallel Processing**: Files processed concurrently for faster results
- **Optimized API Calls**: Reduced from N×M to N calls (N=files, M=parameters)
- **Streaming Updates**: Real-time progress via Server-Sent Events
- **Background Jobs**: Asynchronous processing for large batches
- **Automatic Cleanup**: Secure file handling with automatic deletion

## 🔒 Security Features

- **File Validation**: Magic number verification for audio files
- **Size Limits**: Configurable file size and count restrictions
- **CORS Protection**: Proper cross-origin resource sharing configuration
- **Input Validation**: Pydantic models for request validation
- **Secure Storage**: Temporary file handling with automatic cleanup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use TypeScript for all frontend code
- Write tests for new features
- Update documentation as needed
- Follow conventional commit messages

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful audio analysis capabilities
- **FastAPI** team for the excellent web framework
- **React** team for the amazing UI library
- **shadcn/ui** for beautiful, accessible components

## 📞 Support

- **Documentation**: Check the `/docs` endpoint when running the backend
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Join our community discussions for questions and ideas

---
