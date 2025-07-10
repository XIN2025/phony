'use client';
import React from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { InviteClientDetailsForm } from '@/components/invite/InviteClientDetailsForm';
import { IntakeFormSelector } from '@/components/invite/IntakeFormSelector';
import { IntakeFormBuilder } from '@/components/invite/IntakeFormBuilder';
import { IntakeFormPreview } from '@/components/invite/IntakeFormPreview';
import { useInviteContext } from '@/context/InviteContext';
import { CreateIntakeFormDto, QuestionType } from '@repo/shared-types';
import { useInviteClient, useCreateIntakeForm, useUpdateIntakeForm, useGetIntakeForm } from '@/lib/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@repo/ui/components/button';

export default function InviteClientPage() {
  const router = useRouter();
  const { step, inviteData, setInviteData, goToNextStep, goToPrevStep } = useInviteContext();
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedFormId, setSelectedFormId] = React.useState<string | null>(null);
  const queryClient = useQueryClient();

  const { mutate: inviteClient, isPending: isInviting } = useInviteClient();
  const { mutate: createIntakeForm, isPending: isCreatingForm } = useCreateIntakeForm();
  const { mutate: updateIntakeForm, isPending: isUpdatingForm } = useUpdateIntakeForm();
  const { data: selectedForm } = useGetIntakeForm(selectedFormId || '');

  const handleDetailsSubmit = (data: {
    clientFirstName: string;
    clientLastName?: string;
    clientEmail: string;
    intakeFormId?: string;
  }) => {
    setSubmitting(true);
    const normalizedData = {
      ...data,
      clientEmail: data.clientEmail.trim().toLowerCase(),
      clientFirstName: data.clientFirstName.trim(),
      clientLastName: data.clientLastName?.trim() || '',
    };
    setInviteData(normalizedData);
    if (normalizedData.intakeFormId) {
      setSubmitting(false);
      goToNextStep();
    } else {
      inviteClient(normalizedData, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['invitations'] });
          router.push('/practitioner/invite/success');
        },
        onError: (error: Error) => {
          setSubmitting(false);
          let errorMessage = 'Failed to send invitation.';
          if (error.message) {
            errorMessage = error.message;
          }
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
    }
  };

  const handleFormSelect = async (formId: string | 'create-new') => {
    if (formId === 'create-new') {
      setInviteData({
        intakeFormId: undefined,
        newIntakeForm: undefined,
        saveAsTemplate: true,
        hasChanges: false,
      });
      goToNextStep();
    } else {
      setSelectedFormId(formId);
    }
  };

  const handleFormCreatePreview = (formData: CreateIntakeFormDto) => {
    setInviteData({
      newIntakeForm: formData,
      intakeFormId: inviteData.intakeFormId || undefined,
      hasChanges: false,
    });
    goToNextStep();
  };

  const handleFormSubmit = async (saveAsTemplate?: boolean) => {
    setSubmitting(true);

    let finalData = { ...inviteData };

    if (inviteData.newIntakeForm) {
      if (inviteData.intakeFormId) {
        // Update existing form
        updateIntakeForm(
          { id: inviteData.intakeFormId, data: inviteData.newIntakeForm },
          {
            onSuccess: () => {
              finalData = {
                ...finalData,
                intakeFormId: inviteData.intakeFormId,
              };
              // Send invitation after form update
              sendInvitation(finalData);
            },
            onError: (error: Error) => {
              let errorMessage = 'Failed to update form.';
              if (error.message) {
                errorMessage = error.message;
              }
              toast.error(errorMessage, {
                description: 'Please review the information and try again.',
                duration: 5000,
              });
              setSubmitting(false);
            },
          },
        );
      } else {
        // Create new form
        createIntakeForm(inviteData.newIntakeForm, {
          onSuccess: (response) => {
            finalData = {
              ...finalData,
              intakeFormId: response.id,
            };
            // Send invitation after form creation
            sendInvitation(finalData);
          },
          onError: (error: Error) => {
            let errorMessage = 'Failed to create form.';
            if (error.message) {
              errorMessage = error.message;
            }
            toast.error(errorMessage, {
              description: 'Please check your form data and try again.',
              duration: 5000,
            });
            setSubmitting(false);
          },
        });
      }
    } else {
      // No form to create/update, send invitation directly
      sendInvitation(finalData);
    }
  };

  const sendInvitation = (finalData: any) => {
    setInviteData(finalData);

    const invitationData = {
      clientFirstName: finalData.clientFirstName,
      clientLastName: finalData.clientLastName,
      clientEmail: finalData.clientEmail,
      intakeFormId: finalData.intakeFormId,
    };

    inviteClient(invitationData, {
      onSuccess: () => {
        const successMessage = finalData.intakeFormId
          ? 'Invitation sent successfully! An intake form has been included for your client.'
          : 'Invitation sent successfully!';
        toast.success(successMessage, {
          description: 'Your client will receive an email with instructions to join.',
          duration: 4000,
        });
        router.push('/practitioner/invite/success');
      },
      onError: (error: Error) => {
        let errorMessage = 'Failed to send invitation.';
        if (error.message) {
          errorMessage = error.message;
        }
        toast.error(errorMessage, {
          description: 'Please review the information and try again.',
          duration: 5000,
        });
        setSubmitting(false);
      },
    });
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
          <InviteClientDetailsForm onNext={handleDetailsSubmit} isLoading={isInviting} onCancel={handleBack} />
        ),
      },
      {
        step: 2,
        title: 'Invite Client',
        component: <IntakeFormSelector onNext={handleFormSelect} />,
      },
      {
        step: 3,
        title: inviteData.intakeFormId ? 'Edit Intake Form' : 'Create Intake Form',
        component: (
          <IntakeFormBuilder
            onSubmit={handleFormCreatePreview}
            onBack={handleBack}
            isEditMode={!!inviteData.intakeFormId}
            buttonText={inviteData.intakeFormId ? 'Edit Intake Form' : 'Create Intake Form'}
          />
        ),
      },
      {
        step: 4,
        title: 'Preview Intake Form',
        component: inviteData.newIntakeForm ? (
          <IntakeFormPreview
            formData={inviteData.newIntakeForm}
            onBack={handleBack}
            onSubmit={handleFormSubmit}
            isLoading={isInviting || isCreatingForm || isUpdatingForm}
            isNewForm={!inviteData.intakeFormId}
            buttonText='Send Invitation'
          />
        ) : null,
      },
    ],
    [step, inviteData, isInviting, isCreatingForm, isUpdatingForm],
  );

  // Handle form selection and transformation
  React.useEffect(() => {
    if (selectedForm && selectedFormId) {
      // Map API question types to DTO question types
      const mapQuestionType = (apiType: string): QuestionType => {
        const typeMap: Record<string, QuestionType> = {
          TEXT: QuestionType.SHORT_ANSWER,
          TEXTAREA: QuestionType.LONG_ANSWER,
          MULTIPLE_CHOICE: QuestionType.MULTIPLE_CHOICE,
          SINGLE_CHOICE: QuestionType.MULTIPLE_CHOICE,
          CHECKBOX: QuestionType.CHECKBOXES,
          RADIO: QuestionType.MULTIPLE_CHOICE,
          DATE: QuestionType.SHORT_ANSWER,
          EMAIL: QuestionType.SHORT_ANSWER,
          PHONE: QuestionType.SHORT_ANSWER,
          NUMBER: QuestionType.SCALE,
          SCALE: QuestionType.SCALE,
          DROPDOWN: QuestionType.DROPDOWN,
          FILE_UPLOAD: QuestionType.FILE_UPLOAD,
          RATING: QuestionType.RATING,
          MULTIPLE_CHOICE_GRID: QuestionType.MULTIPLE_CHOICE_GRID,
          TICK_BOX_GRID: QuestionType.TICK_BOX_GRID,
        };
        return typeMap[apiType] || QuestionType.SHORT_ANSWER;
      };

      const transformedForm: CreateIntakeFormDto = {
        title: selectedForm.title,
        description: selectedForm.description,
        questions: selectedForm.questions.map((q) => ({
          id: q.id,
          title: q.text,
          type: mapQuestionType(q.type),
          options:
            q.options?.map((option, index) => ({
              id: `option-${index}`,
              value: option,
              label: option,
            })) || [],
          required: q.isRequired,
          order: q.order,
        })),
      };

      setInviteData({
        newIntakeForm: transformedForm,
        intakeFormId: selectedFormId,
        saveAsTemplate: true,
        hasChanges: false,
      });
      setSelectedFormId(null);
      goToNextStep();
    }
  }, [selectedForm, selectedFormId, setInviteData, goToNextStep]);

  const currentStepData = steps[step - 1];

  return (
    <div className='flex flex-col items-center justify-start min-h-screen w-full py-10 px-4'>
      <div className='w-full max-w-[1050px] mx-auto'>
        {/* Header: Back button and page title (match dashboard style) */}
        <div className='mb-6'>
          <button
            type='button'
            aria-label='Back'
            onClick={handleBack}
            className='text-muted-foreground hover:text-foreground focus:outline-none'
            style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft className='h-6 w-6 sm:h-7 sm:w-7' />
          </button>
          <h1 className='text-3xl font-bold tracking-tight mt-4'>{currentStepData?.title}</h1>
        </div>
        {/* Show spinner if submitting, otherwise show form */}
        {submitting ? (
          <div className='flex justify-center items-center h-40'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : (
          <div className='w-full'>{currentStepData?.component}</div>
        )}
      </div>
    </div>
  );
}
