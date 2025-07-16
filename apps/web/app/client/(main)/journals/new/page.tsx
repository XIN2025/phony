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
  Save,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { SidebarToggleButton } from '@/components/practitioner/SidebarToggleButton';
import { useCreateJournalEntry } from '@/lib/hooks/use-api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

const QuillEditor = dynamic(() => import('../QuillEditor'), { ssr: false });

// REMOVE all top-level Quill usage (Font, Size, etc.)
// Only use Quill inside useEffect as already done below

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [fontSize, setFontSize] = useState<number>(DEFAULT_FONT_SIZE);
  const [activeIndex, setActiveIndex] = useState(0);
  const [title, setTitle] = useState('');

  const quillEditorRef = typeof window !== 'undefined' ? useRef<any>(null) : { current: null };
  const createJournalMutation = useCreateJournalEntry();
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

  const handleSaveJournal = async () => {
    const combinedContent = notes
      .map((note, index) => {
        if (note.content.trim()) {
          return `<h3>${NOTE_TITLES[index]}</h3>${note.content}`;
        }
        return '';
      })
      .filter((content) => content.trim())
      .join('<hr>');

    if (!combinedContent.trim()) {
      toast.error('Please add some content to your journal entry');
      return;
    }
    try {
      await createJournalMutation.mutateAsync({
        title,
        content: combinedContent,
      });
      await queryClient.refetchQueries({ queryKey: ['journal-entries'] });
      toast.success('Journal entry saved successfully');
      router.push('/client/journals');
    } catch (error) {
      toast.error('Failed to save journal entry');
    }
  };

  const NOTE_TITLES = ['How are you feeling?', 'Task Feedback', "What's on your mind?"];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const Quill = require('quill');
      require('quill/dist/quill.snow.css');
      // Only use Quill inside useEffect as already done below
      // const Font = Quill.import('formats/font');
      // if (Font) {
      //   Font.whitelist = ['roboto', 'serif', 'sans-serif', 'monospace'];
      //   Quill.register(Font, true);
      // }
      // const Size = Quill.import('attributors/style/size');
      // if (Size) {
      //   delete Size.whitelist;
      //   Quill.register(Size, true);
      // }
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
  }, []);

  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <div className='flex flex-col w-full pt-4 sm:pt-6 px-3 sm:px-4 lg:px-6 xl:px-8 min-w-0 max-w-full'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 w-full gap-3'>
        <div className='flex items-center gap-2 min-w-0'>
          <Link
            href='/client/journals'
            className='rounded-full p-2 hover:bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors'
            aria-label='Back'
          >
            <ArrowLeft size={22} />
          </Link>
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-0 truncate'>
            {getTodayDateString()}
          </h1>
        </div>
        <Button
          onClick={handleSaveJournal}
          disabled={createJournalMutation.isPending}
          className='bg-black text-white rounded-full px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium shadow-sm hover:bg-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 w-full sm:w-auto'
        >
          {createJournalMutation.isPending ? (
            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
          ) : (
            <Save className='mr-2 h-4 w-4' />
          )}
          Save Entry
        </Button>
      </div>

      <div className='mb-4 w-full max-w-2xl'>
        <label htmlFor='journal-title' className='block text-base font-semibold text-gray-800 mb-1'>
          Journal Title <span className='text-gray-500 font-normal'>(Optional)</span>
        </label>
        <input
          id='journal-title'
          type='text'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Enter a title for your journal entry (optional)...'
          className='w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all bg-white placeholder-gray-400 shadow-sm'
          maxLength={100}
          autoComplete='off'
        />
      </div>

      <div className='flex flex-col md:flex-row gap-6 w-full items-start'>
        {[...Array(NUM_NOTES)].map((_, i) => {
          const toolbarId = `quill-toolbar-${i}`;
          return (
            <div
              key={i}
              className={
                `relative bg-transparent rounded-2xl shadow-lg border border-white/50 p-4 pt-8 flex flex-col transition-all duration-150 min-h-[260px] ` +
                (activeIndex === i ? 'w-auto min-w-fit ' + 'ring-2 ring-blue-500' : 'w-96')
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
                  <div className='w-full mb-4'>
                    <div
                      id={toolbarId}
                      className='flex flex-wrap items-center gap-1 bg-gray-100 rounded-lg p-2 shadow-sm'
                    >
                      <div className='flex items-center gap-1 flex-shrink-0'>
                        <Button type='button' variant='ghost' size='icon' onClick={handleUndo} className='h-8 w-8'>
                          <Undo2 size={16} />
                        </Button>
                        <Button type='button' variant='ghost' size='icon' onClick={handleRedo} className='h-8 w-8'>
                          <Redo2 size={16} />
                        </Button>
                      </div>

                      <div className='flex items-center gap-1 flex-shrink-0'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          onClick={handleDecreaseFont}
                          className='h-8 w-8'
                        >
                          <Minus size={16} />
                        </Button>
                        <input
                          type='number'
                          min={8}
                          max={100}
                          value={fontSize}
                          onChange={handleFontSizeInput}
                          onBlur={handleFontSizeBlur}
                          onKeyDown={handleFontSizeKeyDown}
                          className='w-12 text-center rounded border border-gray-300 bg-white px-1 py-1 text-xs mx-1 h-8'
                          style={{ appearance: 'textfield' }}
                        />
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          onClick={handleIncreaseFont}
                          className='h-8 w-8'
                        >
                          <Plus size={16} />
                        </Button>
                      </div>

                      <div className='hidden sm:flex items-center flex-shrink-0'>
                        <Select
                          onValueChange={(val) => {
                            if (quillEditorRef.current) {
                              quillEditorRef.current.setFontFamily(val.toLowerCase());
                            }
                          }}
                          defaultValue='roboto'
                        >
                          <SelectTrigger className='h-8 min-w-[80px] max-w-[100px] text-xs'>
                            <SelectValue placeholder='Font' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='roboto'>Roboto</SelectItem>
                            <SelectItem value='serif'>Serif</SelectItem>
                            <SelectItem value='sans-serif'>Sans Serif</SelectItem>
                            <SelectItem value='monospace'>Monospace</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Image and Link - always visible */}
                      <div className='flex items-center gap-1 flex-shrink-0'>
                        <Button type='button' variant='ghost' size='icon' className='ql-image h-8 w-8'>
                          <Image size={16} />
                        </Button>
                        <Button type='button' variant='ghost' size='icon' className='ql-link h-8 w-8'>
                          <LucideLink size={16} />
                        </Button>
                      </div>

                      {/* Text formatting - bold and italic always visible, underline hidden on small screens */}
                      <div className='flex items-center gap-1 flex-shrink-0'>
                        <Button type='button' variant='ghost' size='icon' className='ql-bold h-8 w-8'>
                          <Bold size={16} />
                        </Button>
                        <Button type='button' variant='ghost' size='icon' className='ql-italic h-8 w-8'>
                          <Italic size={16} />
                        </Button>
                      </div>
                      <div className='hidden sm:flex items-center gap-1 flex-shrink-0'>
                        <Button type='button' variant='ghost' size='icon' className='ql-underline h-8 w-8'>
                          <Underline size={16} />
                        </Button>
                      </div>

                      {/* Color picker - hidden on small screens */}
                      <div className='hidden sm:flex items-center gap-1 flex-shrink-0'>
                        <select className='ql-color mx-1 h-8 w-12 rounded border border-gray-300 bg-white text-xs'></select>
                      </div>

                      {/* Text alignment - hidden on small screens */}
                      <div className='hidden md:flex items-center gap-1 flex-shrink-0'>
                        <Button type='button' variant='ghost' size='icon' className='ql-align h-8 w-8' value=''>
                          <AlignLeft size={16} />
                        </Button>
                        <Button type='button' variant='ghost' size='icon' className='ql-align h-8 w-8' value='center'>
                          <AlignCenter size={16} />
                        </Button>
                        <Button type='button' variant='ghost' size='icon' className='ql-align h-8 w-8' value='right'>
                          <AlignRight size={16} />
                        </Button>
                        <Button type='button' variant='ghost' size='icon' className='ql-align h-8 w-8' value='justify'>
                          <AlignJustify size={16} />
                        </Button>
                      </div>

                      {/* Lists - hidden on small screens */}
                      <div className='hidden md:flex items-center gap-1 flex-shrink-0'>
                        <Button type='button' variant='ghost' size='icon' className='ql-list h-8 w-8' value='ordered'>
                          <ListOrdered size={16} />
                        </Button>
                        <Button type='button' variant='ghost' size='icon' className='ql-list h-8 w-8' value='bullet'>
                          <List size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className='flex-1 min-w-0'>
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
                  </div>
                </>
              ) : (
                <div
                  className='ql-editor flex-1'
                  style={{
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
