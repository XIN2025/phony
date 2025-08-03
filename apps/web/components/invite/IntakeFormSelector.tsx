'use client';
import { useState } from 'react';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select';
import { toast } from 'sonner';
import { useGetIntakeForms, useDeleteIntakeForm, useGetTemplateForms } from '@/lib/hooks/use-api';

interface Props {
  onNext: (formId: string | 'create-new') => void;
}

export function IntakeFormSelector({ onNext }: Props) {
  console.log('🎨 IntakeFormSelector component rendered');

  const [showAllForms, setShowAllForms] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const { data: forms, isLoading: formsLoading, error: formsError } = useGetIntakeForms();
  const { data: templates, isLoading: templatesLoading, error: templatesError } = useGetTemplateForms();
  const { mutate: deleteForm, isPending: isDeleting } = useDeleteIntakeForm();

  // Debug logging
  console.log('🔍 IntakeFormSelector - templates data:', templates);
  console.log('🔍 IntakeFormSelector - templates loading:', templatesLoading);
  console.log('🔍 IntakeFormSelector - templates error:', templatesError);
  console.log('🔍 IntakeFormSelector - templates length:', templates?.length);

  // Show only 3 forms by default, or all forms if showAllForms is true
  const displayedForms = showAllForms ? forms : forms?.slice(0, 3);
  const formsCount = forms?.length || 0;

  const handleTemplateSelect = (templateId: string) => {
    if (!templateId) return;

    const template = templates?.find((t: any) => t.id === templateId);
    if (!template) return;

    // Template forms are already intake forms, so we can directly select them
    onNext(template.id);
    setSelectedTemplate(''); // Reset dropdown
  };

  return (
    <div className='w-full max-w-[1450px] mx-auto p-8'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
        <h2 className='text-xl font-semibold'>Choose Your Form</h2>
        <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4'>
          {/* Template Dropdown */}
          <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
            <SelectTrigger className='w-full sm:w-48'>
              <SelectValue placeholder='Use template' />
            </SelectTrigger>
            <SelectContent>
              {templatesLoading ? (
                <SelectItem value='loading' disabled>
                  Loading templates...
                </SelectItem>
              ) : templatesError ? (
                <SelectItem value='error' disabled>
                  Error loading templates
                </SelectItem>
              ) : !templates || templates.length === 0 ? (
                <SelectItem value='empty' disabled>
                  No templates available
                </SelectItem>
              ) : (
                templates?.map((template: any) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

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
      </div>

      {/* Existing Forms Section */}
      {formsLoading ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className='animate-pulse'>
              <CardHeader>
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-3 w-1/2' />
              </CardHeader>
              <CardContent>
                <Skeleton className='h-20 w-full mb-4' />
                <Skeleton className='h-3 w-full mb-2' />
                <Skeleton className='h-3 w-2/3' />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : formsError ? (
        <div className='text-center py-8'>
          <p className='text-destructive'>Error loading forms.</p>
        </div>
      ) : (
        <div
          className={`grid gap-6 mb-8 ${
            formsCount === 1
              ? 'grid-cols-1 justify-items-center'
              : formsCount === 2
                ? 'grid-cols-1 sm:grid-cols-2 justify-items-center'
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
          }`}
        >
          {displayedForms?.map((form) => (
            <div
              key={form.id}
              className={`bg-white rounded-xl p-6 flex flex-col cursor-pointer transition-all relative group ${
                formsCount === 1 ? 'w-full max-w-xs' : formsCount === 2 ? 'w-full max-w-sm' : ''
              }`}
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

      {/* Create New Form Option */}
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
