'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Plus, MoreVertical, Trash2 } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { toast } from 'sonner';

interface IntakeForm {
  id: string;
  title: string;
  updatedAt: string;
}

interface Props {
  onNext: (formId: string | 'create-new') => void;
}

export function IntakeFormSelector({ onNext }: Props) {
  const queryClient = useQueryClient();
  const {
    data: forms,
    isLoading: formsLoading,
    error: formsError,
  } = useQuery<IntakeForm[]>({
    queryKey: ['intake-forms'],
    queryFn: async () => ApiClient.get('/api/intake-forms'),
  });

  const deleteMutation = useMutation({
    mutationFn: (formId: string) => ApiClient.delete(`/api/intake-forms/${formId}`),
    onSuccess: () => {
      toast.success('Form deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['intake-forms'] });
    },
    onError: () => {
      toast.error('Failed to delete form.');
    },
  });

  return (
    <div className='space-y-6'>
      <Card className='rounded-xl'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className='text-xl font-semibold'>Choose Existing Form</CardTitle>
          <Button variant='link' className='text-sm font-semibold'>
            See All
          </Button>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {formsLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className='h-40 rounded-lg' />)}
            {formsError && <p className='text-destructive col-span-3'>Error loading forms.</p>}
            {!formsLoading &&
              !formsError &&
              forms?.map((form) => (
                <Card
                  key={form.id}
                  onClick={() => onNext(form.id)}
                  className='rounded-xl p-4 flex flex-col justify-between h-40 cursor-pointer hover:shadow-md transition-shadow'
                >
                  <div className='bg-gray-200 h-20 rounded-md' />
                  <div className='flex items-end justify-between mt-2'>
                    <div>
                      <p className='font-semibold text-base'>{form.title}</p>
                      <p className='text-sm text-gray-500'>
                        Last Updated: {new Date(form.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon' className='h-8 w-8' onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className='h-5 w-5' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(form.id);
                          }}
                          className='text-destructive'
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card
        onClick={() => onNext('create-new')}
        className='rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center h-32 text-center cursor-pointer hover:bg-gray-50 transition-colors'
      >
        <div className='flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 mb-2'>
          <Plus className='h-6 w-6' />
        </div>
        <div>
          <p className='font-semibold'>
            Create New <span className='text-sm text-gray-500 font-normal'>- Start fresh with a new form</span>
          </p>
        </div>
      </Card>
    </div>
  );
}
