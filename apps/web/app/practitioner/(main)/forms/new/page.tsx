'use client';
import React, { useState, useRef } from 'react';
import { IntakeFormBuilder } from '@/components/invite/IntakeFormBuilder';
import { IntakeFormPreview } from '@/components/invite/IntakeFormPreview';
import { useCreateIntakeForm } from '@/lib/hooks/use-api';
import { CreateIntakeFormDto } from '@repo/shared-types';
import { toast } from 'sonner';
import { InviteContextProvider } from '@/context/InviteContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

function IntakeFormPageLayout({
  title,
  onBack,
  children,
  headerAction,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  return (
    <div className='flex flex-col min-h-screen'>
      {/* Header */}
      <div className='flex flex-col gap-0  px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4'>
        <div className='w-full flex items-center mb-4'>
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
          <div className='flex items-center gap-2'>
            <h1
              className='text-xl sm:text-2xl md:text-3xl font-bold leading-tight'
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {title}
            </h1>
            {/* Show headerAction only on small screens */}
            <div className='sm:hidden ml-auto'>{headerAction}</div>
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

export default function NewFormPage() {
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState<CreateIntakeFormDto | null>(null);
  const { mutate: createForm, isPending: isCreating } = useCreateIntakeForm();

  // Add ref for the form builder
  const formBuilderRef = useRef<HTMLFormElement>(null);

  const handleBack = () => {
    router.push('/practitioner/forms');
  };

  const handlePreview = (data: CreateIntakeFormDto) => {
    setFormData(data);
    setShowPreview(true);
  };

  const handleBackToEdit = () => {
    setShowPreview(false);
  };

  const handleSaveForm = () => {
    if (!formData) return;
    createForm(formData, {
      onSuccess: (response) => {
        toast.success('Form created successfully!');
        router.push('/practitioner/forms');
      },
      onError: (error) => {
        toast.error('Failed to create form. Please try again.');
      },
    });
  };

  // Header action button for small screens
  let headerAction = null;
  if (!showPreview) {
    headerAction = (
      <button
        type='button'
        className='rounded-full px-4 py-2 bg-[#807171] text-white shadow-sm hover:bg-gray-900 truncate sm:hidden ml-auto'
        onClick={() => {
          // Use ref to trigger form submission
          if (formBuilderRef.current) {
            formBuilderRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        }}
      >
        Preview
      </button>
    );
  } else {
    headerAction = (
      <button
        type='button'
        className='rounded-full px-4 py-2 bg-[#807171] text-white shadow-sm hover:bg-gray-900 truncate sm:hidden ml-auto'
        onClick={handleSaveForm}
        disabled={isCreating}
      >
        Create Form
      </button>
    );
  }

  return (
    <IntakeFormPageLayout
      title={showPreview ? 'Preview Form' : 'New Form'}
      onBack={showPreview ? handleBackToEdit : handleBack}
      headerAction={headerAction}
    >
      <InviteContextProvider>
        {showPreview && formData ? (
          <IntakeFormPreview
            formData={formData}
            onBack={handleBackToEdit}
            onSubmit={handleSaveForm}
            isLoading={isCreating}
            isNewForm={true}
            buttonText='Create Form'
            hideFixedBottomBar={true}
          />
        ) : (
          <IntakeFormBuilder
            ref={formBuilderRef}
            onSubmit={handlePreview}
            onBack={handleBack}
            isLoading={false}
            hideActionButtonOnMobile={true}
          />
        )}
      </InviteContextProvider>
    </IntakeFormPageLayout>
  );
}
