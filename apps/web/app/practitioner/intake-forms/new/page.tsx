'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api-client';
import { IntakeFormBuilder } from '@/components/invite/IntakeFormBuilder';
import { CreateIntakeFormDto } from '@repo/shared-types/schemas';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewIntakeFormPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateIntakeFormDto) => ApiClient.post('/api/intake-forms', data),
    onSuccess: (data) => {
      toast.success('Form created successfully!');
      queryClient.invalidateQueries({ queryKey: ['intake-forms'] });

      const redirectUrl = new URLSearchParams(window.location.search).get('redirect');
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push('/practitioner/intake-forms');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create form.');
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

  return (
    <div className='container mx-auto p-6'>
      <Link
        href='/practitioner/intake-forms'
        className='flex items-center gap-2 text-sm text-muted-foreground mb-4 hover:underline'
      >
        <ArrowLeft className='h-4 w-4' />
        <span>Back to Forms</span>
      </Link>
      <h1 className='text-3xl font-bold mb-6'>Create New Intake Form</h1>
      <IntakeFormBuilder
        onSubmit={handleSubmit}
        onBack={() => router.push('/practitioner/intake-forms')}
        isLoading={mutation.isPending}
      />
    </div>
  );
}
