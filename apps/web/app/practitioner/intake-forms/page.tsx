'use client';

import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Badge } from '@repo/ui/components/badge';
import { FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@repo/ui/components/skeleton';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/ui/components/alert-dialog';
import { useRouter } from 'next/navigation';

interface IntakeForm {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    questions: number;
  };
}

export default function IntakeFormsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: forms, isLoading } = useQuery<IntakeForm[]>({
    queryKey: ['intake-forms'],
    queryFn: () => ApiClient.get('/api/intake-forms'),
  });

  const deleteMutation = useMutation({
    mutationFn: (formId: string) => ApiClient.delete(`/api/intake-forms/${formId}`),
    onSuccess: () => {
      toast.success('Form deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['intake-forms'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete form.');
    },
  });

  const handleDelete = (formId: string) => {
    deleteMutation.mutate(formId);
  };

  return (
    <div className='flex flex-col gap-8 p-6 md:p-8'>
      <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold text-gray-800'>Intake Forms</h1>
          <p className='text-muted-foreground'>Create and manage intake forms for your clients.</p>
        </div>
        <Button asChild className='bg-gray-900 text-white hover:bg-gray-800'>
          <Link href='/practitioner/intake-forms/new'>
            <Plus className='mr-2 h-4 w-4' />
            Create Form
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Forms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <div className='min-w-[800px]'>
              <div className='grid grid-cols-12 gap-4 border-b pb-4 text-sm font-medium text-muted-foreground'>
                <div className='col-span-5'>Title</div>
                <div className='col-span-2'>Questions</div>
                <div className='col-span-3'>Created At</div>
                <div className='col-span-2 text-right'>Actions</div>
              </div>

              <div className='flex flex-col'>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className='grid grid-cols-12 items-center gap-4 border-b py-4'>
                      <div className='col-span-5'>
                        <Skeleton className='h-5 w-3/4' />
                        <Skeleton className='mt-1 h-4 w-1/2' />
                      </div>
                      <div className='col-span-2'>
                        <Skeleton className='h-5 w-1/4' />
                      </div>
                      <div className='col-span-3'>
                        <Skeleton className='h-5 w-1/2' />
                      </div>
                      <div className='col-span-2 flex items-center justify-end gap-2'>
                        <Skeleton className='h-8 w-8 rounded-md' />
                        <Skeleton className='h-8 w-8 rounded-md' />
                      </div>
                    </div>
                  ))
                ) : forms && forms.length > 0 ? (
                  forms.map((form) => (
                    <div
                      key={form.id}
                      className='grid grid-cols-12 items-center gap-4 border-b py-4 transition-colors hover:bg-gray-50'
                    >
                      <div className='col-span-5'>
                        <p className='font-medium text-gray-800'>{form.title}</p>
                        <p className='text-sm text-muted-foreground'>{form.description}</p>
                      </div>
                      <div className='col-span-2 text-muted-foreground'>{form._count.questions}</div>
                      <div className='col-span-3 text-muted-foreground'>
                        {new Date(form.createdAt).toLocaleDateString()}
                      </div>
                      <div className='col-span-2 flex items-center justify-end gap-2'>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='text-destructive hover:bg-destructive/10 hover:text-destructive'
                              aria-label='Delete form'
                            >
                              <Trash2 className='h-5 w-5' />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Form</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{form.title}"? This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(form.id)}
                                disabled={deleteMutation.isPending}
                                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          variant='ghost'
                          size='icon'
                          aria-label='Edit form'
                          onClick={() => router.push(`/practitioner/intake-forms/${form.id}`)}
                        >
                          <Edit className='h-5 w-5' />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='py-10 text-center text-muted-foreground'>
                    <FileText className='mx-auto h-12 w-12 text-gray-400' />
                    <h3 className='mt-2 text-lg font-medium'>No intake forms yet</h3>
                    <p className='mt-1 text-sm text-gray-500'>
                      Create your first intake form to start collecting information.
                    </p>
                    <div className='mt-6'>
                      <Button asChild className='bg-gray-900 text-white hover:bg-gray-800'>
                        <Link href='/practitioner/intake-forms/new'>
                          <Plus className='mr-2 h-4 w-4' />
                          Create Form
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
