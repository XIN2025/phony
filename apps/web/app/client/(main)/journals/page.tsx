'use client';

import { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { Button } from '@repo/ui/components/button';
import {
  Undo2,
  Redo2,
  Minus,
  Plus,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ListOrdered,
  List,
  Image,
  Link,
} from 'lucide-react';
import ReactDOM from 'react-dom';
import QuillEditor from './QuillEditor';

// Register custom font sizes and fonts
const Font = (Quill as any).import('formats/font');
if (Font) {
  Font.whitelist = ['Roboto', 'serif', 'sans-serif', 'monospace'];
  (Quill as any).register(Font, true);
}
const Size = (Quill as any).import('attributors/style/size');
if (Size) {
  delete Size.whitelist;
  (Quill as any).register(Size, true);
}

const DEFAULT_FONT_SIZE = 14;

const NUM_NOTES = 3;

// Add a type for note state
interface NoteState {
  content: string;
  history: {
    undo: any[];
    redo: any[];
    // Optionally, track last recorded timestamp
    // lastRecorded: number;
  };
}

const JournalEditors = () => {
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const [fontSize, setFontSize] = useState<number>(DEFAULT_FONT_SIZE);
  const [activeIndex, setActiveIndex] = useState(0);
  // Store both content and history for each note
  const [notes, setNotes] = useState<NoteState[]>(
    Array(NUM_NOTES)
      .fill(null)
      .map(() => ({
        content: '',
        history: { undo: [], redo: [] },
      })),
  );
  const [isReady, setIsReady] = useState(false);

  // Initialize the Quill editor for the active note
  useEffect(() => {
    if (editorRef.current && toolbarRef.current) {
      if (quillRef.current) {
        quillRef.current.off('selection-change');
        quillRef.current = null;
        editorRef.current.innerHTML = '';
      }
      const quill = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: { container: toolbarRef.current },
          history: {
            delay: 1000,
            maxStack: 500,
            userOnly: false,
          },
        },
        formats: ['font', 'size', 'bold', 'italic', 'underline', 'align', 'list', 'color', 'image', 'link'],
      });
      quillRef.current = quill;
      setIsReady(true);
      // Set content
      const note = notes[activeIndex];
      if (note && note.history) {
        const delta = quill.clipboard.convert({ html: typeof note.content === 'string' ? note.content : '' });
        quill.setContents(delta);
        // Restore history
        const history = quill.getModule('history') as any;
        history.stack.undo = Array.isArray(note.history.undo) ? [...note.history.undo] : [];
        history.stack.redo = Array.isArray(note.history.redo) ? [...note.history.redo] : [];
      }
      // Sync font size state with selection
      quill.on('selection-change', (range: any) => {
        if (range && range.length === 0) {
          const format = quill.getFormat(range ?? undefined);
          let currentSize = typeof format.size === 'string' ? format.size : `${DEFAULT_FONT_SIZE}px`;
          let sizeNum = parseInt(currentSize, 10);
          if (!isNaN(sizeNum)) {
            setFontSize(sizeNum);
          }
        }
      });
    }
    // eslint-disable-next-line
  }, [activeIndex]);

  // Save the current note's content and history before switching
  const handleSwitchNote = (newIndex: number) => {
    if (quillRef.current) {
      const html = quillRef.current.root.innerHTML;
      const history = quillRef.current.getModule('history') as any;
      setNotes((prev) => {
        const updated = [...prev];
        updated[activeIndex] = {
          content: html,
          history: {
            undo: Array.isArray(history?.stack?.undo) ? [...history.stack.undo] : [],
            redo: Array.isArray(history?.stack?.redo) ? [...history.stack.redo] : [],
          },
        };
        return updated;
      });
    }
    setActiveIndex(newIndex);
  };

  // Save content and history on unmount (optional, for safety)
  useEffect(() => {
    return () => {
      if (quillRef.current) {
        const html = quillRef.current.root.innerHTML;
        const history = quillRef.current.getModule('history') as any;
        setNotes((prev) => {
          const updated = [...prev];
          updated[activeIndex] = {
            content: html,
            history: {
              undo: Array.isArray(history?.stack?.undo) ? [...history.stack.undo] : [],
              redo: Array.isArray(history?.stack?.redo) ? [...history.stack.redo] : [],
            },
          };
          return updated;
        });
      }
    };
    // eslint-disable-next-line
  }, []);

  // Font size and toolbar handlers
  const applyFontSize = (size: number) => {
    const quill = quillRef.current;
    if (quill) {
      const range = quill.getSelection();
      if (range && range.length === 0) {
        quill.format('size', size + 'px');
      } else if (range && range.length > 0) {
        quill.format('size', size + 'px');
      } else {
        quill.format('size', size + 'px');
      }
    }
  };
  const handleFontSizeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setFontSize(value);
    }
  };
  const handleFontSizeBlur = () => {
    applyFontSize(fontSize);
  };
  const handleFontSizeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyFontSize(fontSize);
    }
  };
  const handleDecreaseFont = () => {
    const newSize = Math.max(8, fontSize - 2);
    setFontSize(newSize);
    applyFontSize(newSize);
  };
  const handleIncreaseFont = () => {
    const newSize = fontSize + 2;
    setFontSize(newSize);
    applyFontSize(newSize);
  };
  const handleUndo = () => {
    const quill = quillRef.current;
    if (quill) {
      (quill.getModule('history') as any).undo();
    }
  };
  const handleRedo = () => {
    const quill = quillRef.current;
    if (quill) {
      (quill.getModule('history') as any).redo();
    }
  };

  return (
    <div className='flex flex-col gap-6'>
      {/* Toolbar (only one in DOM) */}
      <div ref={toolbarRef} className='flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 shadow mb-4'>
        {/* 1. Undo */}
        <Button type='button' variant='ghost' size='icon' onClick={handleUndo}>
          <Undo2 size={18} />
        </Button>
        {/* 2. Redo */}
        <Button type='button' variant='ghost' size='icon' onClick={handleRedo}>
          <Redo2 size={18} />
        </Button>
        {/* 3. Decrease font size */}
        <Button type='button' variant='ghost' size='icon' onClick={handleDecreaseFont}>
          <Minus size={18} />
        </Button>
        {/* 4. Font size input */}
        <input
          type='number'
          min={8}
          max={100}
          value={fontSize}
          onChange={handleFontSizeInput}
          onBlur={handleFontSizeBlur}
          onKeyDown={handleFontSizeKeyDown}
          className='w-12 text-center rounded border border-gray-300 bg-white px-1 py-1 text-sm mx-1'
          style={{ appearance: 'textfield' }}
        />
        {/* 5. Increase font size */}
        <Button type='button' variant='ghost' size='icon' onClick={handleIncreaseFont}>
          <Plus size={18} />
        </Button>
        {/* 6. Font family dropdown */}
        <select className='ql-font rounded-full px-2 py-1 text-sm bg-white border border-gray-300 mx-1'>
          <option value='Roboto'>Roboto</option>
          <option value='serif'>Serif</option>
          <option value='sans-serif'>Sans Serif</option>
          <option value='monospace'>Monospace</option>
        </select>
        {/* 7. Color picker */}
        <select className='ql-color mx-1'></select>
        {/* 8. Bold */}
        <Button type='button' variant='ghost' size='icon' className='ql-bold'>
          <Bold size={18} />
        </Button>
        {/* 9. Italic */}
        <Button type='button' variant='ghost' size='icon' className='ql-italic'>
          <Italic size={18} />
        </Button>
        {/* 10. Underline */}
        <Button type='button' variant='ghost' size='icon' className='ql-underline'>
          <Underline size={18} />
        </Button>
        {/* 11. Align left */}
        <Button type='button' variant='ghost' size='icon' className='ql-align' value=''>
          <AlignLeft size={18} />
        </Button>
        {/* 12. Align center */}
        <Button type='button' variant='ghost' size='icon' className='ql-align' value='center'>
          <AlignCenter size={18} />
        </Button>
        {/* 13. Align right */}
        <Button type='button' variant='ghost' size='icon' className='ql-align' value='right'>
          <AlignRight size={18} />
        </Button>
        {/* 14. Align justify */}
        <Button type='button' variant='ghost' size='icon' className='ql-align' value='justify'>
          <AlignJustify size={18} />
        </Button>
        {/* 15. Ordered list */}
        <Button type='button' variant='ghost' size='icon' className='ql-list' value='ordered'>
          <ListOrdered size={18} />
        </Button>
        {/* 16. Bullet list */}
        <Button type='button' variant='ghost' size='icon' className='ql-list' value='bullet'>
          <List size={18} />
        </Button>
        {/* 17. Image */}
        <Button type='button' variant='ghost' size='icon' className='ql-image'>
          <Image size={18} />
        </Button>
        {/* 18. Link - use Quill's built-in link tooltip */}
        <Button type='button' variant='ghost' size='icon' className='ql-link'>
          <Link size={18} />
        </Button>
      </div>
      {/* All notes side by side (responsive) */}
      <div className='flex flex-col md:flex-row gap-4'>
        {[...Array(NUM_NOTES)].map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded border-2 ${activeIndex === i ? 'border-blue-500' : 'border-gray-200'} bg-white shadow-sm p-2 min-w-[250px]`}
            onClick={() => handleSwitchNote(i)}
            tabIndex={0}
            style={{ outline: 'none', cursor: 'pointer' }}
          >
            {activeIndex === i ? (
              <div ref={editorRef} style={{ height: '200px', minHeight: 100, cursor: 'text' }} />
            ) : (
              <div
                className='ql-editor'
                style={{ height: '200px', minHeight: 100, cursor: 'pointer', padding: 8, overflowY: 'auto' }}
                dangerouslySetInnerHTML={{ __html: typeof notes[i]?.content === 'string' ? notes[i]?.content : '' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default JournalEditors;
