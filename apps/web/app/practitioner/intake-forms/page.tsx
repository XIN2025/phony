'use client';

import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
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
    <div className='container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6'>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
        <div className='space-y-1 sm:space-y-2'>
          <h1 className='text-2xl sm:text-3xl font-bold'>Intake Forms</h1>
          <p className='text-sm sm:text-base text-muted-foreground'>Create and manage intake forms for your clients</p>
        </div>
        <Button asChild className='w-full sm:w-auto'>
          <Link href='/practitioner/intake-forms/new'>
            <Plus className='w-4 h-4 mr-2' />
            Create Form
          </Link>
        </Button>
      </div>

      <div className='grid gap-4 sm:gap-6'>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className='h-6 w-1/2' />
                <Skeleton className='h-4 w-3/4' />
              </CardHeader>
              <CardContent>
                <Skeleton className='h-4 w-1/4' />
              </CardContent>
            </Card>
          ))
        ) : forms && forms.length > 0 ? (
          forms.map((form) => (
            <Card key={form.id} className='flex flex-col'>
              <CardHeader>
                <CardTitle className='text-base sm:text-lg'>{form.title}</CardTitle>
                <CardDescription className='text-sm'>{form.description}</CardDescription>
              </CardHeader>
              <CardContent className='flex-grow'>
                <p className='text-xs sm:text-sm text-muted-foreground'>{form._count.questions} questions</p>
              </CardContent>
              <div className='flex justify-end p-4 gap-2'>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant='ghost' size='sm' className='text-destructive hover:text-destructive'>
                      <Trash2 className='h-4 w-4' />
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
                        className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => router.push(`/practitioner/intake-forms/${form.id}`)}
                >
                  <Edit className='h-4 w-4' />
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className='text-center py-8 sm:py-12 px-4 sm:px-6'>
              <FileText className='w-8 h-8 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-4' />
              <h3 className='text-base sm:text-lg font-medium mb-2'>No intake forms yet</h3>
              <p className='text-sm sm:text-base text-muted-foreground mb-4'>
                Create your first intake form to start collecting information.
              </p>
              <Button asChild>
                <Link href='/practitioner/intake-forms/new'>
                  <Plus className='w-4 h-4 mr-2' />
                  Create Your First Form
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
