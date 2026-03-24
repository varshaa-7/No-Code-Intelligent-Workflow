import { ComponentConfig } from '../types';

export const COMPONENT_LIBRARY: ComponentConfig[] = [
  {
    id: 'user-query',
    type: 'userQuery',
    label: 'User Query',
    description: 'Input component for user questions',
    icon: 'MessageSquare',
  },
  {
    id: 'knowledge-base',
    type: 'knowledgeBase',
    label: 'Knowledge Base',
    description: 'Upload and process documents for context',
    icon: 'Database',
  },
  {
    id: 'llm-engine',
    type: 'llmEngine',
    label: 'LLM Engine',
    description: 'AI model for generating responses',
    icon: 'Brain',
  },
  {
    id: 'output',
    type: 'output',
    label: 'Output',
    description: 'Display responses to users',
    icon: 'MessageCircle',
  },
];

export const DEFAULT_NODE_CONFIGS = {
  userQuery: {
    placeholder: 'Enter your query...',
  },
  knowledgeBase: {
    embeddingModel: 'groq',
    chunkSize: 500,
    chunkOverlap: 50,
  },
  llmEngine: {
    model: 'llama-3.1-8b-instant',
    temperature: 0.7,
    maxTokens: 1024,
    systemPrompt: 'You are a helpful AI assistant.',
    useWebSearch: false,
  },
  output: {
    displayType: 'chat',
  },
};
