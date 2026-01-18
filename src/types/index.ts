export type ComponentType = 'userQuery' | 'knowledgeBase' | 'llmEngine' | 'output';

export interface ComponentConfig {
  id: string;
  type: ComponentType;
  label: string;
  description: string;
  icon: string;
  config?: Record<string, unknown>;
}

export interface Stack {
  id: string;
  name: string;
  description: string;
  workflow_data: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  created_at?: string;
  updated_at?: string;
}

export interface WorkflowNode {
  id: string;
  type: ComponentType;
  position: { x: number; y: number };
  data: {
    label: string;
    config: Record<string, unknown>;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  stack_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface UserQueryConfig {
  placeholder?: string;
}

export interface KnowledgeBaseConfig {
  documentIds?: string[];
  embeddingModel?: 'groq' | 'openai';
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface LLMEngineConfig {
  model?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  useWebSearch?: boolean;
  webSearchApiKey?: string;
}

export interface OutputConfig {
  displayType?: 'chat' | 'text';
}
