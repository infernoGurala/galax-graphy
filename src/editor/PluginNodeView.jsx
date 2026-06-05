import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { pluginRegistry } from '../plugins/registry';
import { Trash } from 'lucide-react';

export default function PluginNodeView({ node, deleteNode }) {
  const { id: dataId, pluginId } = node.attrs;
  const plugin = pluginRegistry.get(pluginId);

  if (!plugin) {
    return (
      <NodeViewWrapper className="my-6 p-4 border border-dashed border-red-500 rounded-lg text-center text-xs text-red-500 font-sans">
        Plugin [{pluginId}] not registered in system.
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="my-8 select-none">
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-md flex flex-col w-full">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg/50 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <span className="text-3px text-xs font-semibold text-text tracking-wide font-sans">
              {plugin.name}
            </span>
            <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-bg border border-border font-sans">
              Plugin
            </span>
          </div>

          <div>
            <button
              onClick={deleteNode}
              className="p-1 hover:bg-bg border border-transparent hover:border-border text-text-muted hover:text-red-500 rounded-md transition-colors cursor-pointer"
              title="Delete Block"
            >
              <Trash className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Plugin Render Slot */}
        <div className="p-2 bg-bg">
          {plugin.render({ refId: dataId })}
        </div>
      </div>
    </NodeViewWrapper>
  );
}
