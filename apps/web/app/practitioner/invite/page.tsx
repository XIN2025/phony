'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { InviteClientDetailsForm } from '@/components/invite/InviteClientDetailsForm';
import { IntakeFormSelector } from '@/components/invite/IntakeFormSelector';
import { IntakeFormBuilder } from '@/components/invite/IntakeFormBuilder';
import { IntakeFormPreview } from '@/components/invite/IntakeFormPreview';
import { ApiClient } from '@/lib/api-client';
import { useInviteContext, InviteData } from '@/context/InviteContext';
import { CreateIntakeFormDto } from '@repo/shared-types/schemas';

export default function InviteClientPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { step, inviteData, setInviteData, goToNextStep, resetInviteFlow, goToPrevStep } = useInviteContext();
  const [newlyCreatedForm, setNewlyCreatedForm] = useState<CreateIntakeFormDto | null>(null);

  const mutation = useMutation({
    mutationFn: (data: typeof inviteData) => ApiClient.post('/api/practitioner/invite-client', data),
    onSuccess: () => {
      resetInviteFlow();
      setNewlyCreatedForm(null);
      router.push('/practitioner/invite/success');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
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
      goToNextStep(); // -> Step 2: IntakeFormSelector
    } else {
      mutation.mutate(normalizedData);
    }
  };

  const handleFormSelect = (formId: string | 'create-new') => {
    if (formId === 'create-new') {
      setInviteData({ intakeFormId: undefined });
      goToNextStep(); // -> Step 3: IntakeFormBuilder
    } else {
      const finalData = { ...inviteData, intakeFormId: formId };
      setInviteData(finalData);
      mutation.mutate(finalData);
    }
  };

  const handleFormCreatePreview = (formData: CreateIntakeFormDto) => {
    setNewlyCreatedForm(formData);
    goToNextStep(); // -> Step 4: Preview
  };

  const handleFormSubmit = async () => {
    if (!newlyCreatedForm) return;
    try {
      const newForm = await ApiClient.post<{ id: string }>('/api/intake-forms', newlyCreatedForm);
      const finalData = { ...inviteData, intakeFormId: newForm.id };
      setInviteData(finalData);
      mutation.mutate(finalData);
    } catch (error: any) {
      console.error('Failed to create intake form:', error);
      toast.error(error.response?.data?.message || 'Failed to create form.');
    }
  };

  const handleBack = () => {
    if (step === 4) {
      // from preview back to builder
      goToPrevStep();
    } else if (step === 3) {
      // from builder back to selector
      setInviteData({ intakeFormId: undefined });
      goToPrevStep();
    } else {
      goToPrevStep();
    }
  };

  const steps = useMemo(
    () => [
      {
        step: 1,
        component: <InviteClientDetailsForm onNext={handleDetailsSubmit} isLoading={mutation.isPending} />,
      },
      {
        step: 2,
        component: <IntakeFormSelector onNext={handleFormSelect} onBack={handleBack} />,
      },
      {
        step: 3,
        component: <IntakeFormBuilder onSubmit={handleFormCreatePreview} onBack={handleBack} />,
      },
      {
        step: 4,
        component: newlyCreatedForm ? (
          <IntakeFormPreview
            formData={newlyCreatedForm}
            onBack={handleBack}
            onSubmit={handleFormSubmit}
            isLoading={mutation.isPending}
          />
        ) : null,
      },
    ],
    [mutation.isPending, newlyCreatedForm],
  );

  const currentStepComponent = steps.find((s) => s.step === step)?.component;

  return (
    <div className='container mx-auto max-w-4xl p-6'>
      {currentStepComponent || <InviteClientDetailsForm onNext={handleDetailsSubmit} isLoading={mutation.isPending} />}
    </div>
  );
}
