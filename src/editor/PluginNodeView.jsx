import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { pluginRegistry } from '../plugins/registry';

export default function PluginNodeView({ node, deleteNode }) {
  const { id: dataId, pluginId } = node.attrs;
  const plugin = pluginRegistry.get(pluginId);

  if (!plugin) {
    return (
      <NodeViewWrapper className="my-6 p-4 border border-dashed border-red-500 rounded-lg text-center text-xs text-red-500 font-sans uppercase">
        Plugin [{pluginId}] not registered in system.
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="my-8 select-none">
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-md flex flex-col w-full">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg/50 backdrop-blur-sm font-sans">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-text tracking-wide uppercase">
              {plugin.name}
            </span>
            <span className="text-[9px] text-text-muted px-1.5 py-0.5 rounded bg-bg border border-border font-sans uppercase font-semibold">
              Plugin
            </span>
          </div>

          <div>
            <button
              onClick={deleteNode}
              className="text-[10px] text-text-muted hover:text-red-500 font-bold uppercase tracking-wider hover:underline cursor-pointer"
            >
              Delete
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
