# GenAI Stack - No-Code/Low-Code Workflow Builder

A full-stack application that enables users to visually create and interact with intelligent AI workflows using drag-and-drop components.

## Features

- Visual workflow builder with React Flow
- Four core components: User Query, Knowledge Base, LLM Engine, and Output
- Document upload and processing (PDF, TXT)
- Vector embeddings with ChromaDB
- LLM integration with Groq API
- Real-time chat interface
- PostgreSQL database with Supabase
- Docker and Kubernetes deployment support

## Tech Stack

### Frontend
- React.js with TypeScript
- React Flow for workflow visualization
- Tailwind CSS for styling
- Lucide React for icons
- Supabase client

### Backend
- FastAPI (Python)
- PostgreSQL (Supabase)
- ChromaDB for vector storage
- Groq API for LLM
- PyMuPDF for document processing
- Sentence Transformers for embeddings

## Prerequisites

- Node.js 18+
- Python 3.11+
- Docker and Docker Compose (for containerized deployment)
- Supabase account
- Groq API key

## Local Development Setup

### 1. Database Setup

The database schema is already configured in Supabase. Ensure you have:
- Supabase project URL
- Supabase anonymous key

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=http://localhost:8000

# Start development server
npm run dev
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Update .env with your credentials
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
SERPAPI_KEY=your_serpapi_key

# Run the server
python main.py
```

The backend will be available at `http://localhost:8000`

## Docker Deployment

### Build and Run with Docker Compose

```bash
# Create .env file in project root with all credentials
cp .env.example .env

# Build and start services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

### Build Individual Services

```bash
# Build backend
cd backend
docker build -t genai-stack-backend .

# Build frontend
docker build -t genai-stack-frontend .
```

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (minikube, EKS, GKE, etc.)
- kubectl configured

### Deployment Steps

1. Create secrets:
```bash
cd k8s
cp secrets.yaml.template secrets.yaml
# Edit secrets.yaml with your actual credentials
kubectl apply -f secrets.yaml
```

2. Deploy backend:
```bash
kubectl apply -f backend-deployment.yaml
```

3. Deploy frontend:
```bash
kubectl apply -f frontend-deployment.yaml
```

4. Check deployment status:
```bash
kubectl get pods
kubectl get services
```

5. Access the application:
```bash
# For minikube
minikube service genai-stack-frontend

# For cloud providers, get the LoadBalancer IP
kubectl get service genai-stack-frontend
```

## Usage Guide

### Creating a Workflow

1. Click "New Stack" to create a workflow
2. Drag components from the sidebar to the canvas:
   - **User Query**: Entry point for user questions
   - **Knowledge Base**: Upload and process documents
   - **LLM Engine**: Configure AI model settings
   - **Output**: Display responses

3. Connect components by dragging from output handle to input handle
4. Click on components to configure them

### Configuring Components

#### Knowledge Base
- Upload PDF or text documents
- Configure chunk size and overlap
- Select embedding model

#### LLM Engine
- Set API key
- Adjust temperature and max tokens
- Add custom system prompt
- Enable web search (optional)

### Chat with Stack

1. Click "Chat with Stack" button
2. Enter your questions in the chat interface
3. The workflow processes your query and returns responses
4. Follow-up questions maintain context

## API Endpoints

### Documents
- `POST /documents/upload` - Upload a document
- `GET /documents/{stack_id}` - Get stack documents
- `DELETE /documents/{document_id}` - Delete document

### Embeddings
- `POST /embeddings/generate` - Generate embeddings for document

### Workflow
- `POST /workflow/execute` - Execute workflow with query

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   React     │─────▶│   FastAPI    │─────▶│  Supabase   │
│  Frontend   │      │   Backend    │      │  PostgreSQL │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ├─────▶ ChromaDB (Vectors)
                            │
                            ├─────▶ Groq API (LLM)
                            │
                            └─────▶ SerpAPI (Web Search)
```

## Component Flow

```
User Query → Knowledge Base (optional) → LLM Engine → Output
                    │
                    ├─ Document Upload
                    ├─ Text Extraction
                    ├─ Chunking
                    ├─ Embedding Generation
                    └─ Vector Search
```

## Database Schema

### Tables
- `stacks` - Workflow definitions
- `documents` - Uploaded documents
- `embeddings` - Vector embeddings
- `chat_sessions` - Chat sessions
- `chat_messages` - Chat messages
- `workflow_executions` - Execution logs

## Monitoring (Optional)

### Prometheus & Grafana Setup

```bash
# Apply monitoring stack
kubectl apply -f k8s/monitoring/prometheus.yaml
kubectl apply -f k8s/monitoring/grafana.yaml
```

### ELK Stack for Logging

```bash
# Apply logging stack
kubectl apply -f k8s/logging/elasticsearch.yaml
kubectl apply -f k8s/logging/logstash.yaml
kubectl apply -f k8s/logging/kibana.yaml
```

## Troubleshooting

### Frontend Issues
- Check browser console for errors
- Verify environment variables are set correctly
- Ensure backend URL is accessible

### Backend Issues
- Check FastAPI logs: `docker-compose logs backend`
- Verify API keys are correct
- Ensure Supabase connection is working

### Database Issues
- Verify Supabase credentials
- Check database migrations are applied
- Ensure pgvector extension is enabled

## Development

### Project Structure
```
genai-stack/
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── services/          # API services
│   ├── types/             # TypeScript types
│   └── lib/               # Utilities
├── backend/               # Backend source
│   ├── services/          # Business logic
│   ├── main.py            # FastAPI app
│   └── database.py        # Database client
├── k8s/                   # Kubernetes manifests
├── docker-compose.yml     # Docker orchestration
└── README.md             # This file
```

## API Keys Required

1. **Supabase** (Required)
   - Sign up at https://supabase.com
   - Create a project
   - Get URL and anon key from project settings

2. **Groq** (Required)
   - Sign up at https://console.groq.com
   - Generate API key from dashboard

3. **SerpAPI** (Optional - for web search)
   - Sign up at https://serpapi.com
   - Get API key from account settings

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue in the GitHub repository.
