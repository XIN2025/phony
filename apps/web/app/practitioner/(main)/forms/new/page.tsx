'use client';
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { IntakeFormBuilder } from '@/components/invite/IntakeFormBuilder';
import { useCreateIntakeForm } from '@/lib/hooks/use-api';
import { CreateIntakeFormDto } from '@repo/shared-types/schemas';
import { toast } from 'sonner';
import { InviteContextProvider } from '@/context/InviteContext';

function NewFormWrapper({ children }: { children: React.ReactNode }) {
  return <InviteContextProvider>{children}</InviteContextProvider>;
}

export default function NewFormPage() {
  const router = useRouter();
  const { mutate: createForm, isPending: isCreating } = useCreateIntakeForm();

  const handleBack = () => {
    router.push('/practitioner/forms');
  };

  const handleSubmit = (formData: CreateIntakeFormDto) => {
    createForm(formData, {
      onSuccess: (response) => {
        toast.success('Form created successfully!');
        router.push(`/practitioner/forms/${response.id}`);
      },
      onError: (error) => {
        console.error('Error creating form:', error);
        toast.error('Failed to create form. Please try again.');
      },
    });
  };

  return (
    <div className='flex flex-col min-h-screen bg-background'>
      {/* Header */}
      <div className='flex flex-col gap-0 border-b bg-background px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4'>
        <div className='w-full flex items-center mb-4'>
          <button
            type='button'
            aria-label='Back'
            onClick={handleBack}
            className='text-muted-foreground hover:text-foreground focus:outline-none'
            style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft className='h-6 w-6 sm:h-7 sm:w-7' />
          </button>
        </div>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h1 className='text-xl sm:text-2xl md:text-3xl font-bold leading-tight'>New Form</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 w-full py-4 sm:py-6 lg:py-8 bg-background'>
        <div className='w-full px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto'>
          <NewFormWrapper>
            <IntakeFormBuilder onSubmit={handleSubmit} onBack={handleBack} isLoading={isCreating} />
          </NewFormWrapper>
        </div>
      </div>
    </div>
  );
}
