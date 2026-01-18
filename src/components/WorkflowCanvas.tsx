import { useCallback, useRef, DragEvent } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { BaseNode } from './nodes/BaseNode';
import { ComponentConfig, ComponentType } from '../types';
import { DEFAULT_NODE_CONFIGS } from '../constants/components';

interface WorkflowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onNodeClick: (node: Node) => void;
  selectedNodeId?: string;
}

const nodeTypes: NodeTypes = {
  userQuery: BaseNode,
  knowledgeBase: BaseNode,
  llmEngine: BaseNode,
  output: BaseNode,
};

export function WorkflowCanvas({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  selectedNodeId,
}: WorkflowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, handleNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, handleEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(params, edges);
      setEdges(newEdges);
      onEdgesChange(newEdges);
    },
    [edges, setEdges, onEdgesChange]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const componentData = event.dataTransfer.getData('application/reactflow');

      if (!componentData || !reactFlowBounds) return;

      const component: ComponentConfig = JSON.parse(componentData);
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 20,
      };

      const newNode: Node = {
        id: `${component.type}-${Date.now()}`,
        type: component.type,
        position,
        data: {
          label: component.label,
          type: component.type,
          config: DEFAULT_NODE_CONFIGS[component.type as ComponentType] || {},
        },
      };

      const newNodes = [...nodes, newNode];
      setNodes(newNodes);
      onNodesChange(newNodes);
    },
    [nodes, setNodes, onNodesChange]
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeClick(node);
    },
    [onNodeClick]
  );

  const handleNodesChangeWrapper = useCallback(
    (changes: unknown) => {
      handleNodesChange(changes as never);
      onNodesChange(nodes);
    },
    [handleNodesChange, nodes, onNodesChange]
  );

  const handleEdgesChangeWrapper = useCallback(
    (changes: unknown) => {
      handleEdgesChange(changes as never);
      onEdgesChange(edges);
    },
    [handleEdgesChange, edges, onEdgesChange]
  );

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChangeWrapper}
        onEdgesChange={handleEdgesChangeWrapper}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Drag & drop to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}
