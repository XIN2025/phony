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
    mutationFn: (data: {
      clientFirstName: string;
      clientLastName: string;
      clientEmail: string;
      intakeFormId?: string;
    }) => ApiClient.post('/api/practitioner/invite-client', data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['invitations'] });

      // Show success message with details about what was included
      const successMessage = inviteData.intakeFormId
        ? 'Invitation sent successfully! An intake form has been included for your client.'
        : 'Invitation sent successfully!';

      toast.success(successMessage, {
        description: 'Your client will receive an email with instructions to join.',
        duration: 4000,
      });

      router.push('/practitioner/invite/success');
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to send invitation.';

      // Extract error message from response
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Provide specific guidance based on error type
      if (errorMessage.includes('already exists')) {
        errorMessage = `A client with the email "${inviteData.clientEmail}" already exists in the system. Please use a different email address or check if this client has already been invited.`;
      } else if (errorMessage.includes('Failed to send invitation email')) {
        errorMessage =
          'The invitation email could not be sent. Please check the email address and try again, or contact support if the problem persists.';
      }

      toast.error(errorMessage, {
        description: 'Please review the information and try again.',
        duration: 5000,
      });
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
      intakeFormId: undefined,
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
      // Clear any existing form data when creating new
      setInviteData({
        intakeFormId: undefined,
        newIntakeForm: undefined,
        saveAsTemplate: true, // Reset to default for new forms
        hasChanges: false, // No changes for new forms
      });
      goToNextStep();
    } else {
      try {
        const selectedForm = await ApiClient.get<CreateIntakeFormDto>(`/api/intake-forms/${formId}`);
        // When selecting an existing template, set the form ID and form data
        // This indicates we're using an existing template, not creating a new one
        setInviteData({
          newIntakeForm: selectedForm,
          intakeFormId: formId,
          saveAsTemplate: true, // Existing templates are already saved
          hasChanges: false, // No changes initially when selecting existing template
        });
        goToNextStep();
      } catch (error) {
        toast.error('Could not load form for editing. Please try again.');
      }
    }
  };
  const handleFormCreatePreview = (formData: CreateIntakeFormDto) => {
    setInviteData({
      newIntakeForm: formData,
      intakeFormId: undefined,
      hasChanges: false, // New forms have no changes initially
    });
    goToNextStep();
  };
  const handleFormSubmit = async (saveAsTemplate: boolean) => {
    if (!inviteData.newIntakeForm) {
      toast.error('No form data found. Please go back and create a form.');
      return;
    }

    // Validate required data
    if (!inviteData.clientFirstName || !inviteData.clientLastName || !inviteData.clientEmail) {
      toast.error('Missing client information. Please go back and fill in all required fields.');
      return;
    }

    try {
      let finalData = { ...inviteData };

      // Create or update form in database if user wants to save as template
      if (saveAsTemplate) {
        if (!finalData.intakeFormId) {
          // Creating a new form
          const newForm = await ApiClient.post<{ id: string }>('/api/intake-forms', inviteData.newIntakeForm);
          finalData = { ...finalData, intakeFormId: newForm.id };
        } else if (finalData.hasChanges) {
          // Updating existing form (only if changes were made)
          await ApiClient.put(`/api/intake-forms/${finalData.intakeFormId}`, inviteData.newIntakeForm);
        } else {
          // No changes made to existing form, use existing ID
        }
      }

      setInviteData(finalData);

      // Prepare the data to send to the backend - only include the fields expected by InviteClientDto
      const invitationData = {
        clientFirstName: finalData.clientFirstName,
        clientLastName: finalData.clientLastName,
        clientEmail: finalData.clientEmail,
        intakeFormId: finalData.intakeFormId,
      };

      mutation.mutate(invitationData);
    } catch (error: any) {
      let errorMessage = 'Failed to create form.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, {
        description: 'Please check your form data and try again.',
        duration: 5000,
      });
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
    <div className='mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 sm:py-8 lg:py-10'>
      <Button variant='ghost' size='sm' className='-ml-2 mb-4' onClick={handleBack}>
        <ArrowLeft className='h-5 w-5' />
      </Button>
      <div className='mb-6 sm:mb-8'>
        <h1 className='text-2xl sm:text-3xl font-semibold tracking-tight'>{currentStepData?.title}</h1>
      </div>
      <div>{currentStepData?.component}</div>
    </div>
  );
}
