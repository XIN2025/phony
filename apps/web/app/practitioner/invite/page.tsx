'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';

import { InviteClientDetailsForm } from '@/components/invite/InviteClientDetailsForm';
import { IntakeFormSelector } from '@/components/invite/IntakeFormSelector';
import { IntakeFormBuilder } from '@/components/invite/IntakeFormBuilder';
import { IntakeFormPreview } from '@/components/invite/IntakeFormPreview';
import { useInviteContext } from '@/context/InviteContext';
import { CreateIntakeFormDto } from '@repo/shared-types/schemas';
import { Button } from '@repo/ui/components/button';
import { ApiClient } from '@/lib/api-client';

export default function InviteClientPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { step, inviteData, setInviteData, goToNextStep, goToPrevStep, goToStep, resetInviteFlow } = useInviteContext();

  const mutation = useMutation({
    mutationFn: (data: typeof inviteData) => ApiClient.post('/api/practitioner/invite-client', data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['invitations'] });
      router.push('/practitioner/invite/success');
    },
    onError: (error: any) => {
      console.error('Invitation error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send invitation.';
      toast.error(errorMessage);
    },
  });

  const handleDetailsSubmit = (data: {
    clientFirstName: string;
    clientLastName: string;
    clientEmail: string;
    includeIntakeForm: boolean;
  }) => {
    const normalizedData = {
      ...data,
      clientEmail: data.clientEmail.trim().toLowerCase(),
      clientFirstName: data.clientFirstName.trim(),
      clientLastName: data.clientLastName.trim(),
      intakeFormId: null,
    };
    setInviteData(normalizedData);

    if (normalizedData.includeIntakeForm) {
      goToNextStep();
    } else {
      mutation.mutate(normalizedData);
    }
  };

  const handleFormSelect = async (formId: string | 'create-new') => {
    if (formId === 'create-new') {
      if (inviteData.intakeFormId) {
        setInviteData({ intakeFormId: undefined, newIntakeForm: undefined });
      }
      goToNextStep();
    } else {
      try {
        const selectedForm = await ApiClient.get<CreateIntakeFormDto>(`/api/intake-forms/${formId}`);
        setInviteData({ newIntakeForm: selectedForm, intakeFormId: formId });
        goToNextStep();
      } catch (error) {
        toast.error('Could not load form for editing. Please try again.');
      }
    }
  };

  const handleFormCreatePreview = (formData: CreateIntakeFormDto) => {
    setInviteData({ newIntakeForm: formData, intakeFormId: null });
    goToNextStep();
  };

  const handleFormSubmit = async (saveAsTemplate: boolean) => {
    if (!inviteData.newIntakeForm) return;

    try {
      let finalData = { ...inviteData };

      if (!finalData.intakeFormId && saveAsTemplate) {
        const newForm = await ApiClient.post<{ id: string }>('/api/intake-forms', inviteData.newIntakeForm);
        finalData = { ...finalData, intakeFormId: newForm.id };
      }

      setInviteData(finalData);
      mutation.mutate(finalData);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create form.');
    }
  };

  const handleBack = () => {
    if (step === 1) {
      router.back();
      return;
    }
    goToPrevStep();
  };

  const steps = useMemo(
    () => [
      {
        step: 1,
        title: 'Invite Client',
        component: (
          <InviteClientDetailsForm onNext={handleDetailsSubmit} isLoading={mutation.isPending} onCancel={handleBack} />
        ),
      },
      {
        step: 2,
        title: 'Invite Client',
        component: <IntakeFormSelector onNext={handleFormSelect} />,
      },
      {
        step: 3,
        title: 'Create Intake Form',
        component: <IntakeFormBuilder onSubmit={handleFormCreatePreview} onBack={handleBack} />,
      },
      {
        step: 4,
        title: 'Preview Intake Form',
        component: inviteData.newIntakeForm ? (
          <IntakeFormPreview
            formData={inviteData.newIntakeForm}
            onBack={handleBack}
            onSubmit={handleFormSubmit}
            isLoading={mutation.isPending}
            isNewForm={!inviteData.intakeFormId}
          />
        ) : null,
      },
    ],
    [mutation.isPending, inviteData.newIntakeForm, inviteData.intakeFormId, handleBack],
  );

  const currentStepData = steps.find((s) => s.step === step);

  return (
    <div className='mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8'>
      <Button variant='ghost' size='sm' className='-ml-2 mb-4' onClick={handleBack}>
        <ArrowLeft className='h-5 w-5' />
      </Button>
      <div className='mb-8'>
        <h1 className='text-3xl font-semibold tracking-tight'>{currentStepData?.title}</h1>
      </div>
      <div>{currentStepData?.component}</div>
    </div>
  );
}
