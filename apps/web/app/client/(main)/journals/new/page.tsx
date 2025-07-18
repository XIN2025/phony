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
import { useAuthStatus } from '@/lib/hooks/use-session';
import { Avatar, AvatarImage, AvatarFallback } from '@repo/ui/components/avatar';
import { useGetCurrentUser } from '@/lib/hooks/use-api';
import { getAvatarUrl, getUserDisplayName, getInitials } from '@/lib/utils';

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
  const { isAuthenticated, isLoading } = useAuthStatus();
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

  const { data: currentUser } = useGetCurrentUser();

  const handleSwitchNote = (newIndex: number) => {
    setActiveIndex(newIndex);
  };

  useEffect(() => {
    return () => {};
  }, []);

  // Add session loading and redirect logic
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/client/auth');
    }
  }, [isLoading, isAuthenticated, router]);
  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-b-black'></div>
      </div>
    );
  }

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

  const toolbarId = 'quill-toolbar-main';

  // Mobile header - only on small screens
  // Place above all content
  const mobileHeader = (
    <div className='flex items-center justify-between px-4 pt-2 pb-2 mb-2 w-full sm:hidden'>
      <div className='flex items-center'>
        <SidebarToggleButton />
        <span
          className='ml-3 text-xl font-bold text-primary'
          style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '0.05em' }}
        >
          Continuum
        </span>
      </div>
      <Avatar className='h-10 w-10 ml-2'>
        <AvatarImage
          src={getAvatarUrl(currentUser?.avatarUrl, currentUser)}
          alt={getUserDisplayName(currentUser) || 'User'}
        />
        <AvatarFallback>{getInitials(currentUser || 'U')}</AvatarFallback>
      </Avatar>
    </div>
  );

  return (
    <div className='flex flex-col w-full pt-0 sm:pt-6 px-3 sm:px-4 lg:px-6 xl:px-8 min-w-0 max-w-full'>
      {mobileHeader}
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
        {[...Array(NUM_NOTES)].map((_, i) => (
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
                <div className='flex-1 min-w-0'>
                  <QuillEditor
                    ref={quillEditorRef}
                    value={notes[i]?.content ?? ''}
                    onChange={(val) => {
                      setNotes((prev) => {
                        const updated = [...prev];
                        const prevNote = updated[i] ?? { content: '', history: { undo: [], redo: [] } };
                        updated[i] = {
                          ...prevNote,
                          content: val,
                          history: prevNote.history,
                        };
                        return updated;
                      });
                    }}
                    isActive={true}
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
        ))}
      </div>
    </div>
  );
};

export default function NewJournalEntryPage() {
  return <JournalEditors />;
}
