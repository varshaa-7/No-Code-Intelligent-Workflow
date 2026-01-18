/*
  # GenAI Stack Application Schema

  ## Overview
  This migration creates the database schema for the GenAI Stack workflow builder application.

  ## 1. New Tables
  
  ### `stacks`
  - `id` (uuid, primary key) - Unique identifier for each stack/workflow
  - `name` (text) - Name of the stack
  - `description` (text) - Description of what the stack does
  - `user_id` (uuid) - Owner of the stack (for future auth)
  - `workflow_data` (jsonb) - React Flow nodes and edges configuration
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `documents`
  - `id` (uuid, primary key) - Unique identifier for each document
  - `stack_id` (uuid, foreign key) - Associated stack
  - `filename` (text) - Original filename
  - `file_path` (text) - Storage path
  - `content` (text) - Extracted text content
  - `metadata` (jsonb) - Additional metadata (size, type, etc.)
  - `created_at` (timestamptz) - Upload timestamp

  ### `embeddings`
  - `id` (uuid, primary key) - Unique identifier for each embedding chunk
  - `document_id` (uuid, foreign key) - Associated document
  - `chunk_text` (text) - Text chunk
  - `chunk_index` (integer) - Order of chunk in document
  - `embedding` (vector) - Vector embedding (requires pgvector extension)
  - `metadata` (jsonb) - Additional metadata
  - `created_at` (timestamptz) - Creation timestamp

  ### `chat_sessions`
  - `id` (uuid, primary key) - Unique identifier for each chat session
  - `stack_id` (uuid, foreign key) - Associated stack
  - `created_at` (timestamptz) - Session start timestamp
  - `updated_at` (timestamptz) - Last message timestamp

  ### `chat_messages`
  - `id` (uuid, primary key) - Unique identifier for each message
  - `session_id` (uuid, foreign key) - Associated chat session
  - `role` (text) - 'user' or 'assistant'
  - `content` (text) - Message content
  - `metadata` (jsonb) - Additional data (workflow execution details, etc.)
  - `created_at` (timestamptz) - Message timestamp

  ### `workflow_executions`
  - `id` (uuid, primary key) - Unique identifier for each execution
  - `stack_id` (uuid, foreign key) - Associated stack
  - `session_id` (uuid, foreign key) - Associated chat session
  - `query` (text) - User query
  - `response` (text) - Final response
  - `execution_data` (jsonb) - Detailed execution log
  - `status` (text) - 'success', 'error', 'pending'
  - `error_message` (text) - Error details if failed
  - `created_at` (timestamptz) - Execution timestamp
  - `completed_at` (timestamptz) - Completion timestamp

  ## 2. Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own data
  - Public read access for demo purposes (can be restricted later)

  ## 3. Extensions
  - Enable pgvector for vector similarity search
  - Enable uuid-ossp for UUID generation

  ## 4. Indexes
  - Add indexes on foreign keys for better query performance
  - Add indexes on frequently queried fields
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create stacks table
CREATE TABLE IF NOT EXISTS stacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  user_id uuid,
  workflow_data jsonb DEFAULT '{"nodes": [], "edges": []}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stack_id uuid REFERENCES stacks(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_path text,
  content text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create embeddings table
CREATE TABLE IF NOT EXISTS embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  chunk_text text NOT NULL,
  chunk_index integer NOT NULL,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stack_id uuid REFERENCES stacks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create workflow_executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stack_id uuid REFERENCES stacks(id) ON DELETE CASCADE,
  session_id uuid REFERENCES chat_sessions(id) ON DELETE SET NULL,
  query text NOT NULL,
  response text,
  execution_data jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'error')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_stack_id ON documents(stack_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_document_id ON embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_stack_id ON chat_sessions(stack_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_stack_id ON workflow_executions(stack_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_session_id ON workflow_executions(session_id);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops);

-- Enable Row Level Security
ALTER TABLE stacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
-- In production, these should be restricted to authenticated users

CREATE POLICY "Allow public read access to stacks"
  ON stacks FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to stacks"
  ON stacks FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to stacks"
  ON stacks FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from stacks"
  ON stacks FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to documents"
  ON documents FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to documents"
  ON documents FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to documents"
  ON documents FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from documents"
  ON documents FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to embeddings"
  ON embeddings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to embeddings"
  ON embeddings FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public delete from embeddings"
  ON embeddings FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to chat_sessions"
  ON chat_sessions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to chat_sessions"
  ON chat_sessions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to chat_sessions"
  ON chat_sessions FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from chat_sessions"
  ON chat_sessions FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to chat_messages"
  ON chat_messages FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to chat_messages"
  ON chat_messages FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public delete from chat_messages"
  ON chat_messages FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to workflow_executions"
  ON workflow_executions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to workflow_executions"
  ON workflow_executions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to workflow_executions"
  ON workflow_executions FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from workflow_executions"
  ON workflow_executions FOR DELETE
  TO public
  USING (true);