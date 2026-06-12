import { Node, mergeAttributes, Extension } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import CanvasNodeView from './CanvasNodeView';
import PluginNodeView from './PluginNodeView';
import Suggestion from '@tiptap/suggestion';
import { pluginRegistry } from '../plugins/registry';

// 1. Define custom Excalidraw Node
export const ExcalidrawNode = Node.create({
  name: 'excalidrawCanvas',
  group: 'block',
  atom: true, // Treated as a single unit inside the document

  addAttributes() {
    return {
      id: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'excalidraw-canvas',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['excalidraw-canvas', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CanvasNodeView);
  },
});

// 2. Define custom generic Plugin Block Node
export const PluginBlockNode = Node.create({
  name: 'pluginBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      pluginId: {
        default: null,
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'plugin-block',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['plugin-block', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PluginNodeView);
  },
});

// 3. Define Suggestion items and logic for Slash Command
export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export const getSuggestionItems = ({ query }) => {
  const baseItems = [
    {
      title: 'Heading 1',
      description: 'Big section heading',
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode('heading', { level: 1 })
          .run();
      },
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode('heading', { level: 2 })
          .run();
      },
    },
    {
      title: 'Bullet List',
      description: 'Create a simple bulleted list',
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleBulletList()
          .run();
      },
    },
    {
      title: 'Task List',
      description: 'Create a list of checkable tasks',
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleTaskList()
          .run();
      },
    },
    {
      title: 'Code Block',
      description: 'Create a pre-formatted code container',
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleCodeBlock()
          .run();
      },
    },
    {
      title: 'Horizontal Rule',
      description: 'Insert a page divider line',
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setHorizontalRule()
          .run();
      },
    },
    {
      title: 'Excalidraw Canvas',
      description: 'Insert an inline sketch board',
      command: ({ editor, range }) => {
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('insert-embedded-canvas', {
            detail: { editor, range },
          });
          window.dispatchEvent(event);
        }
      },
    },
  ];

  // Dynamically load additional plugins from Registry
  const registeredPluginItems = pluginRegistry.getAll()
    .filter(p => p.panelType === 'embedded-block')
    .map(p => ({
      title: p.name,
      description: `Insert a ${p.name} block`,
      command: ({ editor, range }) => {
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('insert-embedded-plugin', {
            detail: { editor, range, pluginId: p.id },
          });
          window.dispatchEvent(event);
        }
      }
    }));

  return [...baseItems, ...registeredPluginItems].filter((item) =>
    item.title.toLowerCase().startsWith(query.toLowerCase())
  );
};
