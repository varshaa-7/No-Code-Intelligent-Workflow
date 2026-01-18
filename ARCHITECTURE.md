# GenAI Stack - Architecture Documentation

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                      (React + React Flow)                       │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ HTTP/REST
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│                      API Gateway Layer                          │
│                         (FastAPI)                               │
└─────────────────┬───────────────────────────────────────────────┘
                  │
        ┌─────────┼─────────┬─────────────┬──────────────┐
        │         │         │             │              │
        ▼         ▼         ▼             ▼              ▼
   ┌────────┐ ┌──────┐ ┌────────┐  ┌──────────┐  ┌──────────┐
   │Supabase│ │Chroma│ │ Groq   │  │ SerpAPI  │  │Document  │
   │  DB    │ │  DB  │ │  API   │  │          │  │Processor │
   └────────┘ └──────┘ └────────┘  └──────────┘  └──────────┘
```

## Component Architecture

### Frontend Components

```
App
├── Sidebar
│   ├── Stack List
│   └── Component Library
│       ├── User Query Component
│       ├── Knowledge Base Component
│       ├── LLM Engine Component
│       └── Output Component
│
├── WorkflowCanvas (React Flow)
│   ├── Node Rendering
│   ├── Edge Connections
│   └── Drag & Drop Handler
│
├── ConfigPanel
│   ├── User Query Config
│   ├── Knowledge Base Config
│   │   ├── Document Upload
│   │   └── Embedding Settings
│   ├── LLM Engine Config
│   │   ├── Model Selection
│   │   ├── API Key Input
│   │   ├── Temperature Control
│   │   └── Web Search Toggle
│   └── Output Config
│
├── ChatModal
│   ├── Message History
│   ├── Input Box
│   └── Session Management
│
└── CreateStackModal
    ├── Name Input
    └── Description Input
```

### Backend Services

```
FastAPI Application
│
├── Endpoints
│   ├── /documents/upload
│   ├── /documents/{stack_id}
│   ├── /documents/{document_id} (DELETE)
│   ├── /embeddings/generate
│   └── /workflow/execute
│
├── Services
│   ├── DocumentProcessor
│   │   ├── extract_text()
│   │   └── chunk_text()
│   │
│   ├── EmbeddingService
│   │   ├── generate_embeddings()
│   │   └── generate_embedding()
│   │
│   ├── VectorStore
│   │   ├── add_documents()
│   │   ├── search()
│   │   └── delete_document()
│   │
│   ├── LLMService
│   │   ├── generate_response()
│   │   └── web_search()
│   │
│   └── WorkflowExecutor
│       ├── execute()
│       ├── _process_knowledge_base()
│       └── _process_llm_engine()
│
└── Database Client
    └── Supabase Connection
```

## Data Flow

### Workflow Creation Flow

```
1. User clicks "New Stack"
   ↓
2. CreateStackModal opens
   ↓
3. User enters name/description
   ↓
4. Stack saved to Supabase
   ↓
5. WorkflowCanvas loads empty canvas
   ↓
6. User drags components from sidebar
   ↓
7. Components placed on canvas
   ↓
8. User creates connections between nodes
   ↓
9. Workflow auto-saved to Supabase
```

### Document Upload Flow

```
1. User selects Knowledge Base node
   ↓
2. ConfigPanel opens with upload button
   ↓
3. User selects PDF/TXT file
   ↓
4. File sent to /documents/upload
   ↓
5. Backend extracts text using PyMuPDF
   ↓
6. Text saved to Supabase documents table
   ↓
7. User triggers embedding generation
   ↓
8. Text chunked into smaller pieces
   ↓
9. Embeddings generated using SentenceTransformer
   ↓
10. Embeddings stored in Supabase & ChromaDB
```

### Query Execution Flow

```
1. User clicks "Chat with Stack"
   ↓
2. Workflow validated (has required nodes)
   ↓
3. ChatModal opens
   ↓
4. User enters query
   ↓
5. Query sent to /workflow/execute
   ↓
6. WorkflowExecutor processes workflow:
   │
   ├─→ User Query Node
   │   └─→ Pass query forward
   │
   ├─→ Knowledge Base Node (optional)
   │   ├─→ Generate query embedding
   │   ├─→ Search ChromaDB for similar chunks
   │   └─→ Return context chunks
   │
   ├─→ LLM Engine Node
   │   ├─→ Load API key from config
   │   ├─→ Prepare messages with context
   │   ├─→ Optionally fetch web search results
   │   ├─→ Call Groq API
   │   └─→ Return generated response
   │
   └─→ Output Node
       └─→ Display response in chat
   ↓
7. Response saved to chat_messages table
   ↓
8. Execution log saved to workflow_executions table
   ↓
9. Response displayed in ChatModal
```

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐
│   stacks    │
│─────────────│
│ id (PK)     │───┐
│ name        │   │
│ description │   │
│ workflow    │   │
└─────────────┘   │
                  │
        ┌─────────┼───────────┬─────────────┐
        │         │           │             │
        ▼         ▼           ▼             ▼
┌──────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────┐
│documents │ │chat_    │ │workflow_ │ │              │
│          │ │sessions │ │executions│ │              │
│──────────│ │─────────│ │──────────│ │              │
│id (PK)   │ │id (PK)  │ │id (PK)   │ │              │
│stack_id  │ │stack_id │ │stack_id  │ │              │
│(FK)      │ │(FK)     │ │(FK)      │ │              │
│filename  │ └─────────┘ │session_id│ │              │
│content   │      │      │(FK)      │ │              │
└──────────┘      │      │query     │ │              │
     │            │      │response  │ │              │
     │            │      └──────────┘ │              │
     │            │                   │              │
     ▼            ▼                   │              │
┌──────────┐ ┌──────────┐            │              │
│embeddings│ │chat_     │            │              │
│          │ │messages  │            │              │
│──────────│ │──────────│            │              │
│id (PK)   │ │id (PK)   │            │              │
│document_ │ │session_id│            │              │
│id (FK)   │ │(FK)      │            │              │
│chunk_text│ │role      │            │              │
│embedding │ │content   │            │              │
│(vector)  │ └──────────┘            │              │
└──────────┘                         │              │
```

## Security Architecture

### Authentication & Authorization

- RLS (Row Level Security) enabled on all tables
- Public policies for demo (should be restricted in production)
- API keys stored in node configurations (client-side)
- Supabase handles authentication infrastructure

### Data Protection

- Environment variables for sensitive credentials
- Kubernetes secrets for production deployments
- API keys never logged or exposed in responses
- HTTPS/TLS for all communications

## Deployment Architecture

### Docker Compose Deployment

```
┌─────────────────────────────────────────┐
│         Docker Host                     │
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │  Frontend    │    │   Backend    │  │
│  │  Container   │◄───┤   Container  │  │
│  │  (Nginx)     │    │   (FastAPI)  │  │
│  │  Port: 3000  │    │   Port: 8000 │  │
│  └──────────────┘    └──────────────┘  │
│         │                    │          │
└─────────┼────────────────────┼──────────┘
          │                    │
          └─────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │  External Services  │
         │  - Supabase         │
         │  - Groq API         │
         │  - SerpAPI          │
         └─────────────────────┘
```

### Kubernetes Deployment

```
┌───────────────────────────────────────────────────┐
│              Kubernetes Cluster                    │
│                                                    │
│  ┌─────────────────────────────────────────────┐  │
│  │           LoadBalancer Service              │  │
│  │              (Port 80)                      │  │
│  └────────────────┬────────────────────────────┘  │
│                   │                               │
│  ┌────────────────▼────────────────────────────┐  │
│  │        Frontend Deployment                  │  │
│  │        (2 replicas)                         │  │
│  │  ┌──────────────┐  ┌──────────────┐        │  │
│  │  │   Pod 1      │  │   Pod 2      │        │  │
│  │  │ (Nginx:80)   │  │ (Nginx:80)   │        │  │
│  │  └──────────────┘  └──────────────┘        │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
│  ┌─────────────────────────────────────────────┐  │
│  │        ClusterIP Service                    │  │
│  │            (Port 8000)                      │  │
│  └────────────────┬────────────────────────────┘  │
│                   │                               │
│  ┌────────────────▼────────────────────────────┐  │
│  │        Backend Deployment                   │  │
│  │        (2 replicas)                         │  │
│  │  ┌──────────────┐  ┌──────────────┐        │  │
│  │  │   Pod 1      │  │   Pod 2      │        │  │
│  │  │ (FastAPI)    │  │ (FastAPI)    │        │  │
│  │  └──────────────┘  └──────────────┘        │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
│  ┌─────────────────────────────────────────────┐  │
│  │           Secrets                           │  │
│  │  - supabase-url                             │  │
│  │  - supabase-anon-key                        │  │
│  │  - groq-api-key                             │  │
│  │  - serpapi-key                              │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
└────────────────────────────────────────────────────┘
```

## Technology Choices

### Frontend

- **React + TypeScript**: Type safety and component reusability
- **React Flow**: Industry-standard for workflow visualization
- **Tailwind CSS**: Rapid UI development with utility classes
- **Vite**: Fast build times and hot module replacement

### Backend

- **FastAPI**: Modern Python framework with automatic API documentation
- **Supabase**: Managed PostgreSQL with real-time capabilities
- **ChromaDB**: In-memory vector database for fast similarity search
- **Groq API**: Fast LLM inference with multiple models
- **Sentence Transformers**: Local embedding generation

### Advantages

1. **Supabase over traditional PostgreSQL**: Built-in auth, RLS, real-time subscriptions
2. **ChromaDB over Pinecone/Weaviate**: Simple setup, no external service required
3. **Groq over OpenAI**: Faster inference, cost-effective, multiple models
4. **React Flow over custom canvas**: Production-ready, feature-rich, maintained

## Scalability Considerations

### Horizontal Scaling

- Frontend: Nginx load balancing across multiple instances
- Backend: Multiple FastAPI workers behind load balancer
- Database: Supabase handles scaling automatically

### Performance Optimization

- Vector search caching
- Embedding batch processing
- Response streaming for long outputs
- Lazy loading of documents

### Future Enhancements

1. Redis caching layer
2. Queue system for background jobs (Celery)
3. CDN for static assets
4. Database connection pooling
5. Rate limiting and throttling
