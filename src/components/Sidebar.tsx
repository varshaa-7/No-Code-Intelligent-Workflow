import { useState, useEffect } from 'react';
import { Plus, Edit2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { COMPONENT_LIBRARY } from '../constants/components';
import { Stack, ComponentConfig } from '../types';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  onCreateStack: () => void;
  onSelectStack: (stack: Stack) => void;
  selectedStackId?: string;
}

export function Sidebar({ onCreateStack, onSelectStack, selectedStackId }: SidebarProps) {
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [isLoadingStacks, setIsLoadingStacks] = useState(true);

  useEffect(() => {
    loadStacks();
  }, []);

  const loadStacks = async () => {
    try {
      setIsLoadingStacks(true);
      const { data, error } = await supabase
        .from('stacks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStacks(data || []);
    } catch (error) {
      console.error('Error loading stacks:', error);
    } finally {
      setIsLoadingStacks(false);
    }
  };

  const onDragStart = (event: React.DragEvent, component: ComponentConfig) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(component));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-gray-800">GenAI Stack</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">My Stacks</h2>
            <button
              onClick={onCreateStack}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Stack
            </button>
          </div>

          {isLoadingStacks ? (
            <div className="text-sm text-gray-500">Loading stacks...</div>
          ) : stacks.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-3">
                Start building your generative AI apps with our essential tools and frameworks
              </p>
              <button
                onClick={onCreateStack}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors mx-auto"
              >
                <Plus className="w-4 h-4" />
                New Stack
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {stacks.map((stack) => (
                <div
                  key={stack.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedStackId === stack.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => onSelectStack(stack)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-800">{stack.name}</h3>
                      {stack.description && (
                        <p className="text-xs text-gray-500 mt-1">{stack.description}</p>
                      )}
                    </div>
                    <button
                      className="p-1 hover:bg-gray-100 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStack(stack);
                      }}
                    >
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Components</h2>
          <div className="space-y-2">
            {COMPONENT_LIBRARY.map((component) => {
              const IconComponent = Icons[component.icon as keyof typeof Icons] as React.ComponentType<{
                className?: string;
              }>;

              return (
                <div
                  key={component.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, component)}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-move hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-50">
                    <IconComponent className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-800">{component.label}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{component.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
