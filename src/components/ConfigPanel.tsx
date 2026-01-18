import { useState, useEffect } from 'react';
import { X, Upload, FileText, Trash2 } from 'lucide-react';
import { Node } from 'reactflow';
import { ComponentType, LLMEngineConfig, KnowledgeBaseConfig } from '../types';
import { supabase } from '../lib/supabase';
import { uploadDocument } from '../services/api';

interface ConfigPanelProps {
  node: Node | null;
  stackId?: string;
  onClose: () => void;
  onUpdate: (nodeId: string, config: Record<string, unknown>) => void;
}

export function ConfigPanel({ node, stackId, onClose, onUpdate }: ConfigPanelProps) {
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [documents, setDocuments] = useState<Array<{ id: string; filename: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (node?.data?.config) {
      setConfig(node.data.config);
    }

    if (node?.type === 'knowledgeBase' && stackId) {
      loadDocuments();
    }
  }, [node, stackId]);

  const loadDocuments = async () => {
    if (!stackId) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, filename')
        .eq('stack_id', stackId);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !stackId) return;

    try {
      setIsUploading(true);
      await uploadDocument(stackId, file);
      await loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      const { error } = await supabase.from('documents').delete().eq('id', docId);

      if (error) throw error;
      await loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleConfigChange = (key: string, value: unknown) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    if (node) {
      onUpdate(node.id, newConfig);
    }
  };

  const handleSave = () => {
    if (node) {
      onUpdate(node.id, config);
    }
    onClose();
  };

  if (!node) return null;

  const renderKnowledgeBaseConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Embedding Model
        </label>
        <select
          value={(config as KnowledgeBaseConfig).embeddingModel || 'groq'}
          onChange={(e) => handleConfigChange('embeddingModel', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="groq">Groq</option>
          <option value="openai">OpenAI</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chunk Size
        </label>
        <input
          type="number"
          value={(config as KnowledgeBaseConfig).chunkSize || 500}
          onChange={(e) => handleConfigChange('chunkSize', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chunk Overlap
        </label>
        <input
          type="number"
          value={(config as KnowledgeBaseConfig).chunkOverlap || 50}
          onChange={(e) => handleConfigChange('chunkOverlap', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Documents
        </label>
        <div className="space-y-2 mb-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{doc.filename}</span>
              </div>
              <button
                onClick={() => handleDeleteDocument(doc.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>
        <label className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors">
          <Upload className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </span>
          <input
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      </div>
    </div>
  );

  const renderLLMEngineConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
        <select
          value={(config as LLMEngineConfig).model || 'gpt-4o-mini'}
          onChange={(e) => handleConfigChange('model', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4o-mini">GPT-4o Mini</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          API Key <span className="text-red-500">*</span> (Required)
        </label>
        <input
          type="password"
          value={(config as LLMEngineConfig).apiKey || ''}
          onChange={(e) => handleConfigChange('apiKey', e.target.value)}
          placeholder="Enter your OpenAI API key"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-600 mt-2 mb-2">
          Get your API key from{' '}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-semibold"
          >
            platform.openai.com/api-keys
          </a>
        </p>
        <p className="text-xs text-gray-500">
          You must save this configuration before clicking "Chat with Stack"
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Temperature: {((config as LLMEngineConfig).temperature || 0.7).toFixed(1)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={(config as LLMEngineConfig).temperature || 0.7}
          onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Max Tokens
        </label>
        <input
          type="number"
          value={(config as LLMEngineConfig).maxTokens || 1024}
          onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          System Prompt
        </label>
        <textarea
          value={(config as LLMEngineConfig).systemPrompt || ''}
          onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="You are a helpful AI assistant..."
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="useWebSearch"
          checked={(config as LLMEngineConfig).useWebSearch || false}
          onChange={(e) => handleConfigChange('useWebSearch', e.target.checked)}
          className="rounded border-gray-300"
        />
        <label htmlFor="useWebSearch" className="text-sm text-gray-700">
          Enable Web Search
        </label>
      </div>

      {(config as LLMEngineConfig).useWebSearch && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Web Search API Key
          </label>
          <input
            type="password"
            value={(config as LLMEngineConfig).webSearchApiKey || ''}
            onChange={(e) => handleConfigChange('webSearchApiKey', e.target.value)}
            placeholder="Enter SerpAPI or Brave API key"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );

  const renderConfig = () => {
    switch (node.type as ComponentType) {
      case 'knowledgeBase':
        return renderKnowledgeBaseConfig();
      case 'llmEngine':
        return renderLLMEngineConfig();
      case 'userQuery':
      case 'output':
        return (
          <div className="text-sm text-gray-500">
            This component has no configurable options.
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{node.data.label}</h2>
          <p className="text-xs text-gray-500 mt-1">Configure component settings</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">{renderConfig()}</div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}
