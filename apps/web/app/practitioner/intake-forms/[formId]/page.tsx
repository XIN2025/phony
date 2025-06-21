'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { ApiClient } from '@/lib/api-client';
import { IntakeFormBuilder } from '@/components/invite/IntakeFormBuilder';
import { CreateIntakeFormDto } from '@repo/shared-types/schemas';
import { toast } from 'sonner';
import { Skeleton } from '@repo/ui/components/skeleton';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditIntakeFormPage() {
  const router = useRouter();
  const params = useParams();
  const formId = params.formId as string;
  const queryClient = useQueryClient();

  const { data: form, isLoading: isFormLoading } = useQuery<CreateIntakeFormDto>({
    queryKey: ['intake-form', formId],
    queryFn: () => ApiClient.get(`/api/intake-forms/${formId}`),
    enabled: !!formId,
  });

  const mutation = useMutation({
    mutationFn: (data: CreateIntakeFormDto) => ApiClient.put(`/api/intake-forms/${formId}`, data),
    onSuccess: () => {
      toast.success('Form updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['intake-forms'] });
      queryClient.invalidateQueries({ queryKey: ['intake-form', formId] });
      router.push('/practitioner/intake-forms');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update form.');
    },
  });

  const handleSubmit = (data: CreateIntakeFormDto) => {
    // Re-add order to questions before submitting
    const dataWithOrder = {
      ...data,
      questions: data.questions.map((q, index) => ({ ...q, order: index })),
    };
    mutation.mutate(dataWithOrder);
  };

  if (isFormLoading) {
    return (
      <div className='container mx-auto p-6 space-y-6'>
        <Skeleton className='h-8 w-1/4' />
        <Skeleton className='h-20 w-full' />
        <Skeleton className='h-40 w-full' />
        <Skeleton className='h-40 w-full' />
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6'>
      <Link
        href='/practitioner/intake-forms'
        className='flex items-center gap-2 text-sm text-muted-foreground mb-4 hover:underline'
      >
        <ArrowLeft className='h-4 w-4' />
        <span>Back to Forms</span>
      </Link>
      <h1 className='text-3xl font-bold mb-6'>Edit Intake Form</h1>
      {form && <IntakeFormBuilder initialData={form} onSubmit={handleSubmit} isLoading={mutation.isPending} />}
    </div>
  );
}
