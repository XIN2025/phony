'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Trash2,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  ListOrdered,
  List,
} from 'lucide-react';
import Link from 'next/link';
import { SidebarToggleButton } from '@/components/practitioner/SidebarToggleButton';
import { useGetJournalEntry, useUpdateJournalEntry, useDeleteJournalEntry } from '@/lib/hooks/use-api';
import { toast } from 'sonner';
import QuillEditor, { QuillEditorHandles } from '../QuillEditor';
import { useRef } from 'react';

export default function JournalEntryPage({ params }: { params: Promise<{ entryId: string }> }) {
  const router = useRouter();
  const [entryId, setEntryId] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  const [content, setContent] = useState('');
  const quillEditorRef = useRef<QuillEditorHandles>(null);

  const { data: entry, isLoading } = useGetJournalEntry(entryId);
  const updateJournalMutation = useUpdateJournalEntry();
  const deleteJournalMutation = useDeleteJournalEntry();

  useEffect(() => {
    params.then((resolvedParams) => {
      setEntryId(resolvedParams.entryId);
    });
  }, [params]);

  useEffect(() => {
    if (entry) {
      setContent(entry.content);
    }
  }, [entry]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Please add some content to your journal entry');
      return;
    }

    try {
      await updateJournalMutation.mutateAsync({
        entryId,
        data: {
          content,
        },
      });
      toast.success('Journal entry updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update journal entry');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      try {
        await deleteJournalMutation.mutateAsync(entryId);
        toast.success('Journal entry deleted successfully');
        router.push('/client/journals');
      } catch (error) {
        toast.error('Failed to delete journal entry');
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
    <div className='flex flex-col w-full max-w-full overflow-x-hidden pt-4 sm:pt-6 px-4 sm:px-6 md:px-8 min-w-0'>
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
            {isEditing ? 'Edit Entry' : entry.title || 'Untitled Entry'}
          </h1>
        </div>
        <div className='flex gap-2'>
          {!isEditing ? (
            <>
              <Button
                onClick={() => setIsEditing(true)}
                variant='outline'
                className='rounded-full px-4 sm:px-6 py-2 sm:py-3'
              >
                <Edit className='mr-2 h-4 w-4' />
                Edit
              </Button>
              <Button onClick={handleDelete} variant='destructive' className='rounded-full px-4 sm:px-6 py-2 sm:py-3'>
                <Trash2 className='mr-2 h-4 w-4' />
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setIsEditing(false)}
                variant='outline'
                className='rounded-full px-4 sm:px-6 py-2 sm:py-3'
              >
                <X className='mr-2 h-4 w-4' />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateJournalMutation.isPending}
                className='bg-black text-white rounded-full px-4 sm:px-6 py-2 sm:py-3'
              >
                {updateJournalMutation.isPending ? (
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                ) : (
                  <Save className='mr-2 h-4 w-4' />
                )}
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {!isEditing ? (
        // View mode
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <div className='flex justify-between items-start'>
                <div>
                  <CardTitle className='text-2xl'>{entry.title || 'Untitled Entry'}</CardTitle>
                  <p className='text-sm text-gray-500 mt-1'>
                    {formatDate(entry.createdAt)}
                    {entry.updatedAt !== entry.createdAt && (
                      <span className='ml-2'>• Updated {formatDate(entry.updatedAt)}</span>
                    )}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='prose prose-lg max-w-none' dangerouslySetInnerHTML={{ __html: entry.content }} />
            </CardContent>
          </Card>
        </div>
      ) : (
        // Edit mode
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='mb-4'>
                <div
                  id='edit-toolbar'
                  className='flex flex-wrap lg:flex-nowrap items-center gap-1 bg-gray-100 rounded-lg p-2 shadow-sm'
                >
                  <div className='flex items-center gap-1 flex-shrink-0'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => quillEditorRef.current?.undo()}
                      className='h-8 w-8'
                    >
                      <Undo2 size={16} />
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => quillEditorRef.current?.redo()}
                      className='h-8 w-8'
                    >
                      <Redo2 size={16} />
                    </Button>
                  </div>

                  <div className='flex items-center gap-1 flex-shrink-0'>
                    <Button type='button' variant='ghost' size='icon' className='ql-bold h-8 w-8'>
                      <Bold size={16} />
                    </Button>
                    <Button type='button' variant='ghost' size='icon' className='ql-italic h-8 w-8'>
                      <Italic size={16} />
                    </Button>
                    <Button type='button' variant='ghost' size='icon' className='ql-underline h-8 w-8'>
                      <Underline size={16} />
                    </Button>
                  </div>

                  <div className='flex items-center gap-1 flex-shrink-0'>
                    <Button type='button' variant='ghost' size='icon' className='ql-list h-8 w-8' value='ordered'>
                      <ListOrdered size={16} />
                    </Button>
                    <Button type='button' variant='ghost' size='icon' className='ql-list h-8 w-8' value='bullet'>
                      <List size={16} />
                    </Button>
                  </div>
                </div>
              </div>
              <div className='min-w-0'>
                <QuillEditor
                  ref={quillEditorRef}
                  value={content}
                  onChange={setContent}
                  isActive={true}
                  toolbarId='edit-toolbar'
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
