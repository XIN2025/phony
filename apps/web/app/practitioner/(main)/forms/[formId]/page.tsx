'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { IntakeFormBuilder } from '@/components/invite/IntakeFormBuilder';
import { useGetIntakeForm, useUpdateIntakeForm, useDeleteIntakeForm } from '@/lib/hooks/use-api';
import { CreateIntakeFormDto, QuestionType } from '@repo/shared-types';
import { toast } from 'sonner';
import { InviteContextProvider } from '@/context/InviteContext';
import { Button } from '@repo/ui/components/button';
import { Skeleton } from '@repo/ui/components/skeleton';
import Image from 'next/image';

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
      <div className='flex flex-col gap-0  px-4 sm:px-6 lg:px-4 pt-4 sm:pt-6 pb-3 sm:pb-4 lg:pb-2'>
        <div className='w-full flex items-center mb-4 lg:mb-2'>
          <button
            type='button'
            aria-label='Back'
            onClick={onBack}
            className='text-muted-foreground hover:text-foreground focus:outline-none flex items-center justify-center w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-full transition-all min-w-0 min-h-0 max-w-full max-h-full p-0'
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Image
              src='/arrow-right.svg'
              alt='Back'
              width={30}
              height={30}
              className='h-15 w-15 sm:h-7 sm:w-7 md:h-10 md:w-10'
            />
          </button>
        </div>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h1
              className='font-semibold mb-2 sm:mb-0 truncate text-xl sm:text-2xl lg:text-[26px] xl:text-[32px]'
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {title}
            </h1>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className='flex-1 w-full py-4 sm:py-6 lg:py-4'>
        <div className='w-full px-4 sm:px-6 lg:px-4  mx-auto'>{children}</div>
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

  // Ref for IntakeFormBuilder form
  const formBuilderRef = useRef<HTMLFormElement>(null);

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

  // Header action for small screens
  const headerAction = (
    <Button
      type='button'
      className='rounded-full px-4 py-2 bg-black text-white shadow-sm hover:bg-gray-900 truncate sm:hidden ml-2'
      onClick={() => formBuilderRef.current?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
      disabled={isUpdating}
    >
      Save Changes
    </Button>
  );

  return (
    <InviteContextProvider>
      <div className='flex flex-col min-h-screen'>
        {/* Header */}
        <div className='flex flex-col gap-0  px-4 sm:px-6 lg:px-4 pt-4 sm:pt-6 pb-3 sm:pb-4 lg:pb-2'>
          <div className='w-full flex items-center mb-4 lg:mb-2'>
            <button
              type='button'
              aria-label='Back'
              onClick={handleBack}
              className='text-muted-foreground hover:text-foreground focus:outline-none flex items-center justify-center w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-full transition-all min-w-0 min-h-0 max-w-full max-h-full p-0'
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Image
                src='/arrow-right.svg'
                alt='Back'
                width={30}
                height={30}
                className='h-15 w-15 sm:h-7 sm:w-7 md:h-10 md:w-10'
              />
            </button>
          </div>
          <div className='mb-6 flex items-center justify-between lg:mb-2'>
            <h1
              className='font-semibold mb-2 sm:mb-0 truncate text-xl sm:text-2xl lg:text-[26px] xl:text-[32px]'
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Edit Form
            </h1>
            <div className='sm:hidden'>{headerAction}</div>
          </div>
        </div>
        {/* Content */}
        <div className='flex-1 w-full py-4 sm:py-6 lg:py-4'>
          <div className='w-full px-4 sm:px-6 lg:px-4  mx-auto'>
            <IntakeFormBuilder
              ref={formBuilderRef}
              onSubmit={handleSubmit}
              onBack={handleBack}
              onDelete={handleDeleteForm}
              isLoading={isUpdating}
              isEditMode={true}
              initialFormData={formData}
              buttonText='Save Changes'
              hideActionButtonOnMobile={true}
            />
          </div>
        </div>
      </div>
    </InviteContextProvider>
  );
}
