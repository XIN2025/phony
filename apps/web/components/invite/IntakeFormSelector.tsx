'use client';
import { useState } from 'react';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGetIntakeForms, useDeleteIntakeForm } from '@/lib/hooks/use-api';

interface Props {
  onNext: (formId: string | 'create-new') => void;
}

export function IntakeFormSelector({ onNext }: Props) {
  const [showAllForms, setShowAllForms] = useState(false);
  const { data: forms, isLoading: formsLoading, error: formsError } = useGetIntakeForms();

  const { mutate: deleteForm, isPending: isDeleting } = useDeleteIntakeForm();

  // Show only 3 forms by default, or all forms if showAllForms is true
  const displayedForms = showAllForms ? forms : forms?.slice(0, 3);
  const formsCount = forms?.length || 0;

  return (
    <div className='w-full max-w-[1450px] mx-auto p-8'>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-xl font-semibold'>Choose Existing Form</h2>
        {formsCount > 3 && (
          <button
            type='button'
            className='text-sm font-medium text-primary underline hover:text-primary/80 transition'
            onClick={() => setShowAllForms((v) => !v)}
          >
            {showAllForms ? 'Show Less' : 'See More'}
          </button>
        )}
      </div>
      {/* Center single form, grid for 2+ */}
      {formsLoading ? (
        <div className={`flex ${formsCount === 1 ? 'justify-center' : ''} w-full`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className='bg-white rounded-xl p-6 flex flex-col items-start animate-pulse mx-2 w-full max-w-xs'
              style={{
                boxShadow:
                  '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div className='bg-gray-200 h-20 w-full rounded-md mb-4' />
              <div className='h-4 w-1/2 bg-gray-200 rounded mb-2' />
              <div className='h-3 w-1/3 bg-gray-100 rounded' />
            </div>
          ))}
        </div>
      ) : formsError ? (
        <p className='text-destructive'>Error loading forms.</p>
      ) : formsCount === 1 ? (
        <div className='flex justify-center w-full mb-8'>
          {displayedForms?.map((form) => (
            <div
              key={form.id}
              className='bg-white rounded-xl p-6 flex flex-col cursor-pointer transition-all relative group mx-2 w-full max-w-xs'
              style={{
                boxShadow:
                  '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              }}
              onClick={() => onNext(form.id)}
              tabIndex={0}
              role='button'
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onNext(form.id);
              }}
            >
              <div className='bg-gray-200 h-20 rounded-md mb-4' />
              <div className='flex items-start justify-between w-full'>
                <div>
                  <p className='font-semibold text-base'>{form.title}</p>
                  <p className='text-sm text-gray-500'>Last Updated: {new Date(form.updatedAt).toLocaleDateString()}</p>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-destructive hover:bg-destructive/10 z-10'
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteForm(form.id, {
                      onSuccess: () => {
                        toast.success('Form deleted successfully.');
                      },
                      onError: () => {
                        toast.error('Failed to delete form.');
                      },
                    });
                  }}
                  disabled={isDeleting}
                  title='Delete form'
                >
                  <Trash2 className='h-5 w-5' />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8`}>
          {displayedForms?.map((form) => (
            <div
              key={form.id}
              className='bg-white rounded-xl p-6 flex flex-col cursor-pointer transition-all relative group'
              style={{
                boxShadow:
                  '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              }}
              onClick={() => onNext(form.id)}
              tabIndex={0}
              role='button'
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onNext(form.id);
              }}
            >
              <div className='bg-gray-200 h-20 rounded-md mb-4' />
              <div className='flex items-start justify-between w-full'>
                <div>
                  <p className='font-semibold text-base'>{form.title}</p>
                  <p className='text-sm text-gray-500'>Last Updated: {new Date(form.updatedAt).toLocaleDateString()}</p>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-destructive hover:bg-destructive/10 z-10'
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteForm(form.id, {
                      onSuccess: () => {
                        toast.success('Form deleted successfully.');
                      },
                      onError: () => {
                        toast.error('Failed to delete form.');
                      },
                    });
                  }}
                  disabled={isDeleting}
                  title='Delete form'
                >
                  <Trash2 className='h-5 w-5' />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className='mt-8 flex justify-center'>
        <button
          type='button'
          onClick={() => onNext('create-new')}
          className='w-full max-w-2xl min-h-[120px] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white/40 hover:bg-white/70 transition-all p-8 outline-none focus:ring-2 focus:ring-black/10'
          style={{
            boxShadow:
              '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          }}
        >
          <span className='text-4xl font-bold text-gray-400 mb-2'>+</span>
          <span className='text-lg font-medium text-gray-700'>Start fresh with a new form</span>
        </button>
      </div>
    </div>
  );
}
