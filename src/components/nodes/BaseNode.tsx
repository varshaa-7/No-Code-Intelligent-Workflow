import { Handle, Position } from 'reactflow';
import * as Icons from 'lucide-react';
import { ComponentType } from '../../types';

interface BaseNodeProps {
  data: {
    label: string;
    type: ComponentType;
    config?: Record<string, unknown>;
  };
  selected: boolean;
}

const iconMap: Record<ComponentType, keyof typeof Icons> = {
  userQuery: 'MessageSquare',
  knowledgeBase: 'Database',
  llmEngine: 'Brain',
  output: 'MessageCircle',
};

export function BaseNode({ data, selected }: BaseNodeProps) {
  const IconComponent = Icons[iconMap[data.type]] as React.ComponentType<{ className?: string }>;

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[200px] ${
        selected ? 'border-blue-500' : 'border-gray-200'
      }`}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-gray-400" />

      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-50">
          <IconComponent className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-800">{data.label}</div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-gray-400" />
    </div>
  );
}
