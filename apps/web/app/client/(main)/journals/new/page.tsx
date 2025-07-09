'use client';

import { Button } from '@repo/ui/components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  Image,
  Italic,
  List,
  ListOrdered,
  Link as LucideLink,
  Minus,
  Plus,
  Redo2,
  Underline,
  Undo2,
} from 'lucide-react';
import Link from 'next/link';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { useEffect, useRef, useState } from 'react';
import QuillEditor, { QuillEditorHandles } from '../QuillEditor';

const Font = (Quill as any).import('formats/font');
if (Font) {
  Font.whitelist = ['roboto', 'serif', 'sans-serif', 'monospace'];
  (Quill as any).register(Font, true);
}
const Size = (Quill as any).import('attributors/style/size');
if (Size) {
  delete Size.whitelist;
  (Quill as any).register(Size, true);
}

const DEFAULT_FONT_SIZE = 14;

const NUM_NOTES = 3;

interface NoteState {
  content: string;
  history: {
    undo: any[];
    redo: any[];
  };
}

const getTodayDateString = () => {
  const today = new Date();
  return today.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const JournalEditors = () => {
  const [fontSize, setFontSize] = useState<number>(DEFAULT_FONT_SIZE);
  const [activeIndex, setActiveIndex] = useState(0);
  const quillEditorRef = useRef<QuillEditorHandles>(null);
  const [notes, setNotes] = useState<NoteState[]>(
    Array(NUM_NOTES)
      .fill(null)
      .map(() => ({
        content: '',
        history: { undo: [], redo: [] },
      })),
  );

  const handleSwitchNote = (newIndex: number) => {
    setActiveIndex(newIndex);
  };

  useEffect(() => {
    return () => {};
  }, []);

  const applyFontSize = (size: number) => {};
  const handleFontSizeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setFontSize(value);
    }
  };
  const handleFontSizeBlur = () => {
    if (quillEditorRef.current) {
      quillEditorRef.current.setFontSize(fontSize);
    }
  };
  const handleFontSizeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (quillEditorRef.current) {
        quillEditorRef.current.setFontSize(fontSize);
      }
    }
  };
  const handleDecreaseFont = () => {
    const newSize = Math.max(8, fontSize - 2);
    setFontSize(newSize);
    if (quillEditorRef.current) {
      quillEditorRef.current.setFontSize(newSize);
    }
  };
  const handleIncreaseFont = () => {
    const newSize = fontSize + 2;
    setFontSize(newSize);
    if (quillEditorRef.current) {
      quillEditorRef.current.setFontSize(newSize);
    }
  };
  const handleUndo = () => {
    if (quillEditorRef.current) {
      quillEditorRef.current.undo();
    }
  };
  const handleRedo = () => {
    if (quillEditorRef.current) {
      quillEditorRef.current.redo();
    }
  };

  const NOTE_TITLES = ['How are you feeling?', 'Task Feedback', "What's on your mind?"];

  if (typeof window !== 'undefined') {
    const styleId = 'quill-custom-fonts';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        .ql-font-roboto { font-family: 'Roboto', Arial, sans-serif; }
        .ql-font-serif { font-family: serif; }
        .ql-font-sans-serif { font-family: 'Arial', 'Helvetica', sans-serif; }
        .ql-font-monospace { font-family: 'Fira Mono', 'Menlo', 'Monaco', 'Consolas', monospace; }
      `;
      document.head.appendChild(style);
    }
  }

  return (
    <div className='flex flex-col flex-1 h-full w-full p-6 gap-6'>
      <div className='flex items-center justify-between w-full py-4 px-2 md:px-0'>
        <div className='flex items-center gap-3 min-w-0'>
          <Link
            href='/client/journals'
            className='rounded-full p-2 hover:bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors'
            aria-label='Back'
          >
            <ArrowLeft size={22} />
          </Link>
          <h1 className='text-lg md:text-xl font-semibold text-gray-900 truncate'>{getTodayDateString()}</h1>
        </div>
        <button
          type='button'
          className='bg-black text-white rounded-full px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400'
        >
          Publish Entry
        </button>
      </div>
      <div className='border-b border-gray-200 mb-2' />
      <div className='flex flex-col md:flex-row gap-6'>
        {[...Array(NUM_NOTES)].map((_, i) => {
          const toolbarId = `quill-toolbar-${i}`;
          return (
            <div
              key={i}
              className={
                `relative flex-1 bg-gray-200 rounded-xl shadow-md p-4 pt-8 flex flex-col transition-all duration-150 ` +
                (activeIndex === i ? 'ring-2 ring-blue-500' : 'border border-gray-200')
              }
              style={{ outline: 'none', cursor: 'pointer' }}
              onClick={() => {
                if (activeIndex !== i && window && (window as any).quillRef) {
                  const quill = (window as any).quillRef;
                  if (quill) {
                    const html = quill.root.innerHTML;
                    setNotes((prev) => {
                      const updated = Array.isArray(prev) ? [...prev] : [];
                      const safeIndex = Math.max(0, Math.min(activeIndex, updated.length - 1));
                      const prevArr = prev || [];
                      const prevNote = prevArr[safeIndex] ?? { content: '', history: { undo: [], redo: [] } };
                      updated[safeIndex] = { content: html, history: prevNote.history };
                      return updated;
                    });
                  }
                }
                setActiveIndex(i);
              }}
              tabIndex={0}
            >
              <div className='absolute top-0 right-0 w-8 h-8'>
                <svg width='32' height='32' className='absolute top-0 right-0 pointer-events-none'>
                  <polygon points='0,0 32,0 32,32' fill='#e5e7eb' />
                  <polyline points='0,0 32,0 32,32' fill='none' stroke='#d1d5db' strokeWidth='2' />
                </svg>
              </div>
              <div className='font-medium text-sm text-gray-700 mb-2 select-none'>{NOTE_TITLES[i]}</div>
              {activeIndex === i ? (
                <>
                  <div
                    id={toolbarId}
                    className='flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 shadow mb-4'
                  >
                    <Button type='button' variant='ghost' size='icon' onClick={handleUndo}>
                      <Undo2 size={18} />
                    </Button>
                    <Button type='button' variant='ghost' size='icon' onClick={handleRedo}>
                      <Redo2 size={18} />
                    </Button>
                    <Button type='button' variant='ghost' size='icon' onClick={handleDecreaseFont}>
                      <Minus size={18} />
                    </Button>
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
                    <Button type='button' variant='ghost' size='icon' onClick={handleIncreaseFont}>
                      <Plus size={18} />
                    </Button>
                    <div className='flex items-center mx-1 min-w-[90px]'>
                      <Select
                        onValueChange={(val) => {
                          if (quillEditorRef.current) {
                            quillEditorRef.current.setFontFamily(val.toLowerCase());
                          }
                        }}
                        defaultValue='roboto'
                      >
                        <SelectTrigger className='min-w-[90px] w-auto max-w-xs whitespace-nowrap overflow-visible'>
                          <SelectValue
                            placeholder='Font'
                            className='whitespace-nowrap overflow-visible text-ellipsis'
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='roboto'>Roboto</SelectItem>
                          <SelectItem value='serif'>Serif</SelectItem>
                          <SelectItem value='sans-serif'>Sans Serif</SelectItem>
                          <SelectItem value='monospace'>Monospace</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <select className='ql-color mx-1'></select>
                    <Button type='button' variant='ghost' size='icon' className='ql-bold'>
                      <Bold size={18} />
                    </Button>
                    <Button type='button' variant='ghost' size='icon' className='ql-italic'>
                      <Italic size={18} />
                    </Button>
                    <Button type='button' variant='ghost' size='icon' className='ql-underline'>
                      <Underline size={18} />
                    </Button>
                    <Button type='button' variant='ghost' size='icon' className='ql-align' value=''>
                      <AlignLeft size={18} />
                    </Button>
                    <Button type='button' variant='ghost' size='icon' className='ql-align' value='center'>
                      <AlignCenter size={18} />
                    </Button>
                    <Button type='button' variant='ghost' size='icon' className='ql-align' value='right'>
                      <AlignRight size={18} />
                    </Button>
                    <Button type='button' variant='ghost' size='icon' className='ql-align' value='justify'>
                      <AlignJustify size={18} />
                    </Button>
                    <Button type='button' variant='ghost' size='icon' className='ql-list' value='ordered'>
                      <ListOrdered size={18} />
                    </Button>
                    <Button type='button' variant='ghost' size='icon' className='ql-list' value='bullet'>
                      <List size={18} />
                    </Button>
                    <Button type='button' variant='ghost' size='icon' className='ql-image'>
                      <Image size={18} />
                    </Button>
                    <Button type='button' variant='ghost' size='icon' className='ql-link'>
                      <LucideLink size={18} />
                    </Button>
                  </div>
                  <QuillEditor
                    ref={quillEditorRef}
                    value={notes[i]?.content ?? ''}
                    onChange={(val) =>
                      setNotes((prev) => {
                        const updated = [...prev];
                        const prevNote = updated[i] ?? { content: '', history: { undo: [], redo: [] } };
                        updated[i] = {
                          ...prevNote,
                          content: val,
                          history: prevNote.history,
                        };
                        return updated;
                      })
                    }
                    isActive={true}
                    toolbarId={toolbarId}
                  />
                </>
              ) : (
                <div
                  className='ql-editor'
                  style={{
                    flex: 1,
                    cursor: 'pointer',
                    padding: 0,
                    background: 'transparent',
                    boxShadow: 'none',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    whiteSpace: 'pre-wrap',
                    minHeight: 120,
                  }}
                  dangerouslySetInnerHTML={{ __html: typeof notes[i]?.content === 'string' ? notes[i]?.content : '' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function NewJournalEntryPage() {
  return <JournalEditors />;
}
