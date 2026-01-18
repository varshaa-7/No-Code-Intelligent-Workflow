import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadDocument = async (stackId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('stack_id', stackId);

  const response = await api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const executeWorkflow = async (
  stackId: string,
  query: string,
  sessionId?: string
) => {
  const response = await api.post('/workflow/execute', {
    stack_id: stackId,
    query,
    session_id: sessionId,
  });

  return response.data;
};

export const generateEmbeddings = async (documentId: string, apiKey: string) => {
  const response = await api.post('/embeddings/generate', {
    document_id: documentId,
    api_key: apiKey,
  });

  return response.data;
};
