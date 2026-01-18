import { useState, useCallback, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import { MessageSquare } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { WorkflowCanvas } from './components/WorkflowCanvas';
import { ConfigPanel } from './components/ConfigPanel';
import { ChatModal } from './components/ChatModal';
import { CreateStackModal } from './components/CreateStackModal';
import { Stack } from './types';
import { supabase } from './lib/supabase';

function App() {
  const [selectedStack, setSelectedStack] = useState<Stack | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  useEffect(() => {
    if (selectedStack) {
      setNodes(selectedStack.workflow_data?.nodes || []);
      setEdges(selectedStack.workflow_data?.edges || []);
    }
  }, [selectedStack]);

  const handleCreateStack = async (name: string, description: string) => {
    try {
      const { data, error } = await supabase
        .from('stacks')
        .insert({
          name,
          description,
          workflow_data: { nodes: [], edges: [] },
        })
        .select()
        .single();

      if (error) throw error;
      setSelectedStack(data);
    } catch (error) {
      console.error('Error creating stack:', error);
    }
  };

  const handleSelectStack = (stack: Stack) => {
    setSelectedStack(stack);
    setSelectedNode(null);
  };

  const handleNodesChange = useCallback(
    (newNodes: Node[]) => {
      setNodes(newNodes);
      saveWorkflow(newNodes, edges);
    },
    [edges]
  );

  const handleEdgesChange = useCallback(
    (newEdges: Edge[]) => {
      setEdges(newEdges);
      saveWorkflow(nodes, newEdges);
    },
    [nodes]
  );

  const saveWorkflow = async (currentNodes: Node[], currentEdges: Edge[]) => {
    if (!selectedStack) return;

    try {
      const { error } = await supabase
        .from('stacks')
        .update({
          workflow_data: { nodes: currentNodes, edges: currentEdges },
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedStack.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving workflow:', error);
    }
  };

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
  };

  const handleConfigUpdate = useCallback(
    (nodeId: string, config: Record<string, unknown>) => {
      const updatedNodes = nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config } }
          : node
      );
      setNodes(updatedNodes);
      saveWorkflow(updatedNodes, edges);
    },
    [nodes, edges]
  );

  const validateWorkflow = () => {
    if (nodes.length === 0) {
      alert('Please add components to your workflow');
      return false;
    }

    const hasUserQuery = nodes.some((node) => node.type === 'userQuery');
    const hasLLM = nodes.some((node) => node.type === 'llmEngine');
    const hasOutput = nodes.some((node) => node.type === 'output');

    if (!hasUserQuery || !hasLLM || !hasOutput) {
      alert(
        'Workflow must contain at least: User Query, LLM Engine, and Output components'
      );
      return false;
    }

    const llmNode = nodes.find((node) => node.type === 'llmEngine');
    if (!llmNode) {
      alert('LLM Engine component is required');
      return false;
    }

    if (!llmNode.data.config?.apiKey) {
      alert(
        'Please configure the API key in the LLM Engine component:\n\n' +
        '1. Click on the LLM Engine component\n' +
        '2. A panel will open on the right\n' +
        '3. Enter your Groq API key (from https://console.groq.com/keys)\n' +
        '4. Click "Save Configuration"'
      );
      setSelectedNode(llmNode);
      return false;
    }

    return true;
  };

  const handleChatWithStack = () => {
    if (!validateWorkflow()) return;
    setShowChatModal(true);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        onCreateStack={() => setShowCreateModal(true)}
        onSelectStack={handleSelectStack}
        selectedStackId={selectedStack?.id}
      />

      <div className="flex-1 flex flex-col">
        {selectedStack ? (
          <>
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-800">{selectedStack.name}</h1>
                {selectedStack.description && (
                  <p className="text-sm text-gray-500 mt-1">{selectedStack.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleChatWithStack}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat with Stack
                </button>
              </div>
            </div>

            <div className="flex-1 flex">
              <WorkflowCanvas
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onNodeClick={handleNodeClick}
                selectedNodeId={selectedNode?.id}
              />

              {selectedNode && (
                <ConfigPanel
                  node={selectedNode}
                  stackId={selectedStack.id}
                  onClose={() => setSelectedNode(null)}
                  onUpdate={handleConfigUpdate}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Create Your First Stack
              </h2>
              <p className="text-gray-600 mb-6">
                Start building intelligent workflows with drag-and-drop components
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
              >
                Create New Stack
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateStackModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateStack}
        />
      )}

      {showChatModal && selectedStack && (
        <ChatModal
          stackId={selectedStack.id}
          stackName={selectedStack.name}
          onClose={() => setShowChatModal(false)}
        />
      )}
    </div>
  );
}

export default App;
