'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { InviteClientDetailsForm } from '@/components/invite/InviteClientDetailsForm';
import { IntakeFormSelector } from '@/components/invite/IntakeFormSelector';
import { ApiClient } from '@/lib/api-client';
import { useInviteContext } from '@/context/InviteContext';

export default function InviteClientPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { step, inviteData, setInviteData, goToNextStep, resetInviteFlow, goToPrevStep } = useInviteContext();

  const mutation = useMutation({
    mutationFn: (data: typeof inviteData) => ApiClient.post('/api/practitioner/invite-client', data),
    onSuccess: () => {
      router.push('/practitioner/invite/success');
      // Invalidate queries to refetch dashboard/client list data
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: (error: any) => {
      console.error('Invitation error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send invitation.';
      toast.error(errorMessage);
    },
  });

  const handleDetailsSubmit = (data: Partial<typeof inviteData>) => {
    setInviteData(data);
    goToNextStep();
  };

  const handleFormSubmit = (data: Partial<typeof inviteData>) => {
    if (mutation.isPending) {
      console.log('Invitation already in progress, ignoring duplicate request');
      toast.error('Invitation is already being sent. Please wait.');
      return;
    }

    // Basic validation
    const finalData = { ...inviteData, ...data };
    if (!finalData.clientFirstName?.trim() || !finalData.clientLastName?.trim() || !finalData.clientEmail?.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (!finalData.clientEmail?.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    // Normalize email
    finalData.clientEmail = finalData.clientEmail.trim().toLowerCase();
    finalData.clientFirstName = finalData.clientFirstName.trim();
    finalData.clientLastName = finalData.clientLastName.trim();

    setInviteData(finalData);
    mutation.mutate(finalData);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <InviteClientDetailsForm onNext={handleDetailsSubmit} initialData={inviteData} />;
      case 2:
        return <IntakeFormSelector onNext={handleFormSubmit} onBack={goToPrevStep} isLoading={mutation.isPending} />;
      default:
        return <InviteClientDetailsForm onNext={handleDetailsSubmit} initialData={inviteData} />;
    }
  };

  return <div className='container mx-auto max-w-3xl p-6'>{renderStep()}</div>;
}
