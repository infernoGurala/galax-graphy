import React, { useEffect, useState, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { useStore } from '../store/useStore';

// Register custom fonts with whitelist
const Font = Quill.import('formats/font');
Font.whitelist = ['georgia', 'sofia', 'slabo', 'roboto-slab', 'inconsolata', 'ubuntu-mono'];
Quill.register(Font, true);

// Lossless migration helper from TipTap to Quill Delta format
function convertTipTapToDelta(tiptapJson) {
  if (!tiptapJson || tiptapJson.type !== 'doc') {
    return tiptapJson;
  }
  
  const ops = [];
  if (Array.isArray(tiptapJson.content)) {
    tiptapJson.content.forEach(node => {
      if (node.type === 'paragraph') {
        if (Array.isArray(node.content)) {
          node.content.forEach(child => {
            if (child.type === 'text' && child.text) {
              ops.push({ insert: child.text });
            }
          });
        }
        ops.push({ insert: '\n' });
      } else if (node.type === 'heading') {
        if (Array.isArray(node.content)) {
          node.content.forEach(child => {
            if (child.type === 'text' && child.text) {
              ops.push({ insert: child.text });
            }
          });
        }
        ops.push({ insert: '\n', attributes: { header: node.attrs?.level || 1 } });
      } else if (node.type === 'taskList') {
        if (Array.isArray(node.content)) {
          node.content.forEach(item => {
            if (item.type === 'taskItem' && Array.isArray(item.content)) {
              item.content.forEach(paragraph => {
                if (paragraph.type === 'paragraph' && Array.isArray(paragraph.content)) {
                  paragraph.content.forEach(child => {
                    if (child.type === 'text' && child.text) {
                      ops.push({ insert: child.text });
                    }
                  });
                }
              });
              ops.push({ insert: '\n', attributes: { list: 'bullet' } });
            }
          });
        }
      } else if (node.type === 'bulletList' || node.type === 'orderedList') {
        const listType = node.type === 'orderedList' ? 'ordered' : 'bullet';
        if (Array.isArray(node.content)) {
          node.content.forEach(item => {
            if (item.type === 'listItem' && Array.isArray(item.content)) {
              item.content.forEach(paragraph => {
                if (paragraph.type === 'paragraph' && Array.isArray(paragraph.content)) {
                  paragraph.content.forEach(child => {
                    if (child.type === 'text' && child.text) {
                      ops.push({ insert: child.text });
                    }
                  });
                }
              });
              ops.push({ insert: '\n', attributes: { list: listType } });
            }
          });
        }
      } else {
        let text = '';
        const extractText = (n) => {
          if (n.text) text += n.text;
          if (Array.isArray(n.content)) {
            n.content.forEach(extractText);
          }
        };
        extractText(node);
        if (text) {
          ops.push({ insert: text });
        }
        ops.push({ insert: '\n' });
      }
    });
  }
  
  return { ops };
}

export default function NovelEditor({ noteId, setSaveStatus }) {
  const notes = useStore(state => state.notes);
  const updateNoteContent = useStore(state => state.updateNoteContent);
  const renameNote = useStore(state => state.renameNote);
  const note = notes.find(n => n.id === noteId);

  const [title, setTitle] = useState('');

  // Sync title from store
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
    }
  }, [noteId, note?.title]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    renameNote(noteId, newTitle);
  };

  const quillElementRef = useRef(null);
  const [quill, setQuill] = useState(null);
  const quillRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const noteIdRef = useRef(noteId);
  const updateNoteContentRef = useRef(updateNoteContent);
  const setSaveStatusRef = useRef(setSaveStatus);

  // Sync refs to prevent stale closure capture in listeners
  useEffect(() => {
    noteIdRef.current = noteId;
    updateNoteContentRef.current = updateNoteContent;
    setSaveStatusRef.current = setSaveStatus;
  }, [noteId, updateNoteContent, setSaveStatus]);

  // Clean heading & underline styling rule parser
  const updateHeadingDecorations = () => {
    const q = quillRef.current;
    if (!q) return;

    const lines = q.getLines();

    // First remove custom class from all lines
    lines.forEach(line => {
      if (line.domNode) {
        line.domNode.classList.remove('custom-heading-2x');
      }
    });

    // Scan lines and apply styling for matching pairs
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i];
      const prevLine = lines[i - 1];

      if (currentLine.domNode && prevLine.domNode) {
        const currentText = currentLine.domNode.textContent || '';
        const prevText = prevLine.domNode.textContent || '';

        const isEqualsOnly = /^[=]+$/.test(currentText);
        if (isEqualsOnly && currentText.length === prevText.length && prevText.length > 0) {
          prevLine.domNode.classList.add('custom-heading-2x');
        }
      }
    }
  };

  // Initialize Quill Editor once on mount
  useEffect(() => {
    if (!quillElementRef.current || quillRef.current) return;

    let active = true;
    let rAFId = null;

    const initQuill = () => {
      if (!active || quillRef.current) return;
      
      const toolbarEl = document.getElementById('quill-toolbar');
      if (!toolbarEl) {
        // Wait a frame if TopBar hasn't fully rendered the toolbar in DOM yet
        rAFId = requestAnimationFrame(initQuill);
        return;
      }

      const q = new Quill(quillElementRef.current, {
        theme: 'snow',
        modules: {
          toolbar: '#quill-toolbar'
        },
        placeholder: 'Type your notes here...'
      });

      setQuill(q);
      quillRef.current = q;
    };

    initQuill();

    return () => {
      active = false;
      if (rAFId) cancelAnimationFrame(rAFId);
    };
  }, []);

  // Sync note loading when active noteId changes
  useEffect(() => {
    const q = quill;
    if (!q || !note) return;

    const rawContent = note.content;
    let cleanDelta;
    if (rawContent && rawContent.type === 'doc') {
      cleanDelta = convertTipTapToDelta(rawContent);
    } else {
      cleanDelta = rawContent || { ops: [] };
    }

    const currentContents = q.getContents();
    if (JSON.stringify(currentContents) !== JSON.stringify(cleanDelta)) {
      q.setContents(cleanDelta, 'silent');
      setTimeout(updateHeadingDecorations, 50);
    }
  }, [noteId, quill, note]);

  // Handle user input changes and auto-save
  useEffect(() => {
    const q = quill;
    if (!q) return;

    const handleTextChange = (delta, oldDelta, source) => {
      if (source === 'user') {
        setSaveStatusRef.current?.('saving');
        updateHeadingDecorations();

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
          const content = q.getContents();
          await updateNoteContentRef.current?.(noteIdRef.current, content);
          setSaveStatusRef.current?.('saved');
        }, 750);
      } else {
        updateHeadingDecorations();
      }
    };

    q.on('text-change', handleTextChange);
    return () => {
      q.off('text-change', handleTextChange);
    };
  }, [quill]);

  // Format text command listener (triggered from right-click context menu)
  useEffect(() => {
    const q = quill;
    if (!q) return;

    const handleFormatText = (e) => {
      const { format, value } = e.detail;
      const range = q.getSelection();

      // Ensure Quill editor holds focus
      q.focus();

      if (format === 'clean') {
        if (range && range.length > 0) {
          q.removeFormat(range.index, range.length);
        }
      } else {
        if (range) {
          if (format === 'bold') {
            const currentFormat = q.getFormat(range);
            q.format('bold', !currentFormat.bold);
          } else if (format === 'italic') {
            const currentFormat = q.getFormat(range);
            q.format('italic', !currentFormat.italic);
          } else if (format === 'underline') {
            const currentFormat = q.getFormat(range);
            q.format('underline', !currentFormat.underline);
          } else if (format === 'strike') {
            const currentFormat = q.getFormat(range);
            q.format('strike', !currentFormat.strike);
          } else if (format === 'code-block') {
            const currentFormat = q.getFormat(range);
            q.format('code-block', !currentFormat['code-block']);
          } else {
            q.format(format, value);
          }
        }
      }
    };

    window.addEventListener('format-text', handleFormatText);
    return () => {
      window.removeEventListener('format-text', handleFormatText);
    };
  }, [quill]);

  return (
    <div className="w-full relative py-2">
      {/* Title Input Field */}
      <div className="mb-8 mt-2">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled Note"
          className="w-full text-[2rem] font-light bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder:text-text-muted/30 text-text text-center"
          style={{
            fontFamily: 'var(--font-sailec)',
            textAlign: 'center',
            border: 'none',
            outline: 'none',
          }}
        />
      </div>

      {/* Editor Body Area */}
      <div ref={quillElementRef} />
    </div>
  );
}
