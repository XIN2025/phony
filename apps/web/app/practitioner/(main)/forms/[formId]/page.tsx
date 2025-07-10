'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { IntakeFormBuilder } from '@/components/invite/IntakeFormBuilder';
import { useGetIntakeForm, useUpdateIntakeForm, useDeleteIntakeForm } from '@/lib/hooks/use-api';
import { CreateIntakeFormDto, QuestionType } from '@repo/shared-types';
import { toast } from 'sonner';
import { InviteContextProvider, InviteData, useInviteContext } from '@/context/InviteContext';
import { Button } from '@repo/ui/components/button';
import { Skeleton } from '@repo/ui/components/skeleton';

function IntakeFormPageLayout({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col min-h-screen'>
      {/* Header */}
      <div className='flex flex-col gap-0 border-b px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4'>
        <div className='w-full flex items-center mb-4'>
          <button
            type='button'
            aria-label='Back'
            onClick={onBack}
            className='text-muted-foreground hover:text-foreground focus:outline-none'
            style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft className='h-6 w-6 sm:h-7 sm:w-7' />
          </button>
        </div>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h1 className='text-xl sm:text-2xl md:text-3xl font-bold leading-tight'>{title}</h1>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className='flex-1 w-full py-4 sm:py-6 lg:py-8'>
        <div className='w-full px-4 sm:px-6 lg:px-8  mx-auto'>{children}</div>
      </div>
    </div>
  );
}

export default function EditFormPage({ params }: { params: Promise<{ formId: string }> }) {
  const router = useRouter();
  const [formId, setFormId] = useState<string>('');
  const [formData, setFormData] = useState<CreateIntakeFormDto | null>(null);

  const { data: form, isLoading: isLoadingForm } = useGetIntakeForm(formId);
  const { mutate: updateForm, isPending: isUpdating } = useUpdateIntakeForm();
  const { mutate: deleteForm } = useDeleteIntakeForm();
  const { setInviteData } = useInviteContext ? useInviteContext() : { setInviteData: undefined };

  useEffect(() => {
    params.then((resolvedParams) => {
      setFormId(resolvedParams.formId);
    });
  }, [params]);

  useEffect(() => {
    if (form) {
      const convertedFormData: CreateIntakeFormDto = {
        title: form.title,
        description: form.description || '',
        questions: form.questions.map((q) => ({
          id: q.id,
          title: q.text,
          type: q.type as QuestionType,
          required: q.isRequired,
          options:
            q.options?.map((option, index) => ({
              id: `${q.id}-option-${index}`,
              label: option,
              value: option,
            })) || [],
        })),
      };
      setFormData(convertedFormData);
    }
  }, [form]);

  const handleBack = () => {
    router.push('/practitioner/forms');
  };

  const handleSubmit = (updatedFormData: CreateIntakeFormDto) => {
    if (!formId) return;

    updateForm(
      { id: formId, data: updatedFormData },
      {
        onSuccess: () => {
          toast.success('Form updated successfully!');
          router.push('/practitioner/forms');
        },
        onError: (error) => {
          toast.error('Failed to update form. Please try again.');
        },
      },
    );
  };

  const handleDeleteForm = () => {
    if (!formId) return;

    if (confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      deleteForm(formId, {
        onSuccess: () => {
          toast.success('Form deleted successfully!');
          router.push('/practitioner/forms');
        },
        onError: (error) => {
          toast.error('Failed to delete form. Please try again.');
        },
      });
    }
  };

  if (!formId || isLoadingForm) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!form || !formData) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p>Form not found</p>
        </div>
      </div>
    );
  }

  return (
    <InviteContextProvider>
      <IntakeFormPageLayout title='Edit Form' onBack={handleBack}>
        <IntakeFormBuilder
          onSubmit={handleSubmit}
          onBack={handleBack}
          onDelete={handleDeleteForm}
          isLoading={isUpdating}
          isEditMode={true}
          initialFormData={formData}
          buttonText='Save Changes'
        />
      </IntakeFormPageLayout>
    </InviteContextProvider>
  );
}
