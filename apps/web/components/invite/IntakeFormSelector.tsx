'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';
import { ApiClient } from '@/lib/api-client';
import { Plus, ChevronLeft } from 'lucide-react';

interface IntakeForm {
  id: string;
  title: string;
  description: string;
  updatedAt: string;
  _count: {
    questions: number;
  };
}

interface Props {
  onNext: (formId: string | 'create-new') => void;
  onBack: () => void;
}

export function IntakeFormSelector({ onNext, onBack }: Props) {
  const {
    data: forms,
    isLoading: formsLoading,
    error: formsError,
  } = useQuery<IntakeForm[]>({
    queryKey: ['intake-forms'],
    queryFn: () => ApiClient.get('/api/intake-forms'),
  });

  return (
    <Card className='max-w-4xl mx-auto'>
      <CardHeader>
        <CardTitle>Choose an Intake Form</CardTitle>
        <CardDescription>You can select from your existing forms or create a new one.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex justify-end mb-4'>
          <Button onClick={() => onNext('create-new')} className='bg-gray-900 text-white hover:bg-gray-800'>
            <Plus className='mr-2 h-4 w-4' />
            Create New Form
          </Button>
        </div>
        <div className='border rounded-md'>
          {formsError ? (
            <div className='text-center py-8'>
              <p className='text-destructive'>Error loading forms.</p>
            </div>
          ) : formsLoading ? (
            <div className='p-4 space-y-4'>
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
            </div>
          ) : forms && forms.length > 0 ? (
            <div className='divide-y'>
              {forms.map((form) => (
                <div
                  key={form.id}
                  onClick={() => onNext(form.id)}
                  className='grid grid-cols-4 gap-4 p-4 items-center cursor-pointer transition-colors hover:bg-muted/50'
                >
                  <div className='col-span-3'>
                    <h4 className='font-semibold'>{form.title}</h4>
                    <p className='text-sm text-muted-foreground'>
                      {form._count.questions} questions - Last Updated: {new Date(form.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className='col-span-1 text-right'>
                    <Button variant='secondary' size='sm'>
                      Select
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8'>
              <p className='text-muted-foreground'>No existing intake forms.</p>
            </div>
          )}
        </div>
        <div className='flex justify-between items-center mt-8'>
          <Button onClick={onBack} variant='outline'>
            <ChevronLeft className='mr-2 h-4 w-4' />
            Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
