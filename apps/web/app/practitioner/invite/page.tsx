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
import { CreateIntakeFormDto } from '@repo/shared-types/schemas';
import { useInviteClient, useCreateIntakeForm, useUpdateIntakeForm, useGetIntakeForm } from '@/lib/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';

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
    clientLastName: string;
    clientEmail: string;
    includeIntakeForm: boolean;
  }) => {
    setSubmitting(true);
    const normalizedData = {
      ...data,
      clientEmail: data.clientEmail.trim().toLowerCase(),
      clientFirstName: data.clientFirstName.trim(),
      clientLastName: data.clientLastName.trim(),
      intakeFormId: undefined,
    };
    setInviteData(normalizedData);
    if (normalizedData.includeIntakeForm) {
      setSubmitting(false);
      goToNextStep();
    } else {
      inviteClient(normalizedData, {
        onSuccess: () => {
          // Invalidate invitations query after success
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
      intakeFormId: undefined,
      hasChanges: false,
    });
    goToNextStep();
  };

  const handleFormSubmit = async (saveAsTemplate: boolean) => {
    if (!inviteData.newIntakeForm) {
      toast.error('No form data found. Please go back and create a form.');
      return;
    }

    if (!inviteData.clientFirstName || !inviteData.clientLastName || !inviteData.clientEmail) {
      toast.error('Missing client information. Please go back and fill in all required fields.');
      return;
    }

    try {
      let finalData = { ...inviteData };

      if (saveAsTemplate) {
        if (!finalData.intakeFormId) {
          createIntakeForm(inviteData.newIntakeForm, {
            onSuccess: (newForm) => {
              finalData = { ...finalData, intakeFormId: newForm.id };
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
                },
              });
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
            },
          });
          return;
        } else if (finalData.hasChanges) {
          updateIntakeForm(
            { id: finalData.intakeFormId!, data: inviteData.newIntakeForm },
            {
              onSuccess: () => {
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
                  },
                });
              },
              onError: (error: Error) => {
                let errorMessage = 'Failed to update form.';
                if (error.message) {
                  errorMessage = error.message;
                }
                toast.error(errorMessage, {
                  description: 'Please check your form data and try again.',
                  duration: 5000,
                });
              },
            },
          );
          return;
        }
      }

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
        },
      });
    } catch (error: unknown) {
      let errorMessage = 'Failed to process form.';
      if (error instanceof Error && error.message) {
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
            isLoading={isInviting || isCreatingForm || isUpdatingForm}
            isNewForm={!inviteData.intakeFormId}
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
      const mapQuestionType = (
        apiType: string,
      ):
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'SCALE'
        | 'DROPDOWN'
        | 'FILE_UPLOAD'
        | 'RATING'
        | 'MULTIPLE_CHOICE_GRID'
        | 'TICK_BOX_GRID' => {
        const typeMap: Record<
          string,
          | 'SHORT_ANSWER'
          | 'LONG_ANSWER'
          | 'MULTIPLE_CHOICE'
          | 'CHECKBOXES'
          | 'SCALE'
          | 'DROPDOWN'
          | 'FILE_UPLOAD'
          | 'RATING'
          | 'MULTIPLE_CHOICE_GRID'
          | 'TICK_BOX_GRID'
        > = {
          TEXT: 'SHORT_ANSWER',
          TEXTAREA: 'LONG_ANSWER',
          MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
          SINGLE_CHOICE: 'MULTIPLE_CHOICE',
          CHECKBOX: 'CHECKBOXES',
          RADIO: 'MULTIPLE_CHOICE',
          DATE: 'SHORT_ANSWER',
          EMAIL: 'SHORT_ANSWER',
          PHONE: 'SHORT_ANSWER',
          NUMBER: 'SHORT_ANSWER',
          SCALE: 'SCALE',
          DROPDOWN: 'DROPDOWN',
          FILE_UPLOAD: 'FILE_UPLOAD',
          RATING: 'RATING',
          MULTIPLE_CHOICE_GRID: 'MULTIPLE_CHOICE_GRID',
          TICK_BOX_GRID: 'TICK_BOX_GRID',
        };
        return typeMap[apiType] || 'SHORT_ANSWER';
      };

      const transformedForm: CreateIntakeFormDto = {
        title: selectedForm.title,
        description: selectedForm.description,
        questions: selectedForm.questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: mapQuestionType(q.type),
          options: q.options?.map((option) => ({ text: option })) || [],
          isRequired: q.isRequired,
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

  return (
    <div className='w-full min-h-screen bg-white flex flex-col items-center px-2 sm:px-6 py-8'>
      {/* Back button at the very top left (fixed width container for alignment) */}
      <div className='w-full max-w-2xl mx-auto'>
        <button
          type='button'
          aria-label='Back'
          onClick={handleBack}
          className='mb-6 text-gray-700 hover:text-black focus:outline-none'
          style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft className='h-5 w-5' />
        </button>
        {/* Heading and step indicator */}
        <div className='mb-8'>
          <h1 className='text-2xl font-bold mb-1'>Invite Client</h1>
          <p className='text-muted-foreground text-sm'>
            Step {step} of {steps.length}
          </p>
        </div>
        {/* Show spinner if submitting, otherwise show form */}
        {submitting ? (
          <div className='flex justify-center items-center h-40'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : (
          <div className='w-full max-w-xl mx-auto'>{steps[step - 1]?.component}</div>
        )}
      </div>
    </div>
  );
}
