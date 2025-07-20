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
import { useGetJournalEntry, useUpdateJournalEntry, useGetCurrentUser } from '@/lib/hooks/use-api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarImage, AvatarFallback } from '@repo/ui/components/avatar';
import { getAvatarUrl, getUserDisplayName, getInitials } from '@/lib/utils';

const QuillEditor = dynamic(() => import('../../QuillEditor'), { ssr: false });

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

const JournalEditor = ({ entryId }: { entryId: string }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [fontSize, setFontSize] = useState<number>(DEFAULT_FONT_SIZE);
  const [activeIndex, setActiveIndex] = useState(0);
  const [title, setTitle] = useState('');

  const quillEditorRef = typeof window !== 'undefined' ? useRef<any>(null) : { current: null };
  const updateJournalMutation = useUpdateJournalEntry();
  const { data: entry, isLoading } = useGetJournalEntry(entryId);
  const { data: currentUser } = useGetCurrentUser();

  const [notes, setNotes] = useState<NoteState[]>(
    Array(NUM_NOTES)
      .fill(null)
      .map(() => ({
        content: '',
        history: { undo: [], redo: [] },
      })),
  );

  const NOTE_TITLES = ['How are you feeling?', 'Task Feedback', "What's on your mind?"];

  // Parse the existing journal content into the three sections
  useEffect(() => {
    if (entry) {
      setTitle(entry.title || '');

      // Parse the content to extract the three sections
      const sections = entry.content.split('<hr>');
      const parsedNotes: NoteState[] = Array(NUM_NOTES)
        .fill(null)
        .map(() => ({
          content: '',
          history: { undo: [], redo: [] },
        }));

      sections.forEach((section, index) => {
        if (index < NUM_NOTES) {
          // Remove the h3 title and get the content
          const cleanContent = section.replace(/<h3>.*?<\/h3>/, '').trim();
          parsedNotes[index] = {
            content: cleanContent,
            history: { undo: [], redo: [] },
          };
        }
      });

      setNotes(parsedNotes);
    }
  }, [entry]);

  const handleSwitchNote = (newIndex: number) => {
    setActiveIndex(newIndex);
  };

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
    // Title is optional, so we don't validate it
    try {
      await updateJournalMutation.mutateAsync({
        entryId,
        data: {
          title: title.trim() || undefined,
          content: combinedContent,
        },
      });
      // Invalidate the journal entries cache to refresh the list
      await queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast.success('Journal entry updated successfully');
      router.push('/client/journals');
    } catch (error) {
      toast.error('Failed to update journal entry');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
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

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-gray-600 mb-4'>Journal entry not found</p>
          <Link href='/client/journals'>
            <Button>Back to Journals</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col w-full pt-6 sm:pt-8 lg:pt-10 px-4 sm:px-6 lg:px-8 min-w-0 max-w-full'>
      {/* Page header with back button and title */}
      <div className='flex flex-row items-center justify-between mb-6 sm:mb-8 lg:mb-10 w-full gap-2 sm:gap-3'>
        <div className='flex items-center gap-2 min-w-0'>
          <Link
            href='/client/journals'
            className='rounded-full p-2 hover:bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors'
            aria-label='Back'
          >
            <ArrowLeft size={22} />
          </Link>
          <h1 className='text-2xl font-semibold mb-0 truncate' style={{ fontFamily: "'DM Serif Display', serif" }}>
            Journals
          </h1>
        </div>
        <Button
          onClick={handleSaveJournal}
          disabled={updateJournalMutation.isPending}
          className='bg-black text-white rounded-full px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium shadow-sm hover:bg-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 w-auto flex items-center justify-center'
        >
          {updateJournalMutation.isPending ? (
            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
          ) : (
            <Save className='mr-2 h-4 w-4' />
          )}
          Update Entry
        </Button>
      </div>

      {/* Journal title input */}
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
                    const prevNote = updated[safeIndex] ?? { content: '', history: { undo: [], redo: [] } };
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
            <div
              className='font-medium text-sm text-gray-700 mb-2 select-none'
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {NOTE_TITLES[i]}
            </div>
            {activeIndex === i ? (
              <>
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

export default function EditJournalEntryPage({ params }: { params: Promise<{ entryId: string }> }) {
  const [entryId, setEntryId] = useState<string>('');

  useEffect(() => {
    params.then((resolvedParams) => {
      setEntryId(resolvedParams.entryId);
    });
  }, [params]);

  if (!entryId) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
      </div>
    );
  }

  return <JournalEditor entryId={entryId} />;
}
