'use client';
import React, { useState } from 'react';
import { Button } from '@repo/ui/components/button';
import { Textarea } from '@repo/ui/components/textarea';
import { Label } from '@repo/ui/components/label';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSignUpContext } from '@/context/signup-context';
import { useClientSignup, useCheckInvitationIntakeForm } from '@/lib/hooks/use-api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';
import { AuthLayout, AuthHeader } from '@repo/ui/components/auth-layout';

function FreeformInput({
  label,
  placeholder,
  value,
  setValue,
}: {
  label: string;
  placeholder: string;
  value: string;
  setValue: (v: string) => void;
}) {
  return (
    <div>
      <Label className='block text-sm font-medium mb-1'>{label}</Label>
      <Textarea
        placeholder={placeholder}
        className='min-h-[100px] resize-none'
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}

export default function MedicalDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { signUpData, updateSignUpData } = useSignUpContext();

  const [medicalHistory, setMedicalHistory] = useState(
    typeof signUpData.medicalHistory === 'string' ? signUpData.medicalHistory : '',
  );
  const [symptoms, setSymptoms] = useState(typeof signUpData.symptoms === 'string' ? signUpData.symptoms : '');
  const [medications, setMedications] = useState(
    typeof signUpData.medications === 'string' ? signUpData.medications : '',
  );

  const { mutate: handleSignup, isPending: isSigningUp } = useClientSignup();
  const { mutate: checkIntakeForm } = useCheckInvitationIntakeForm();

  React.useEffect(() => {
    if (!token) {
      toast.error('Invalid access. Please start from the invitation link.');
      router.push('/client/auth');
      return;
    }

    if (!signUpData.email || !signUpData.invitationToken || !signUpData.firstName) {
      toast.error('Please complete the previous steps first.');
      router.push(`/client/auth/signup?token=${token}`);
      return;
    }
  }, [token, signUpData, router]);

  const handleNext = () => {
    // Update signup data with medical info
    updateSignUpData({
      medicalHistory: medicalHistory || '',
      symptoms: symptoms || '',
      medications: medications || '',
    });

    const { email, firstName, lastName, invitationToken, profileImage, phoneNumber, dob, gender, occupation } =
      signUpData;

    if (!email || !firstName || !invitationToken) {
      toast.error('Missing required information. Please go back and complete the form.');
      router.push(`/client/auth/signup?token=${token}`);
      return;
    }

    // Create FormData for the API call
    const formData = new FormData();
    formData.append('email', email);
    formData.append('firstName', firstName);
    if (lastName) formData.append('lastName', lastName);
    formData.append('invitationToken', invitationToken);
    if (profileImage) formData.append('profileImage', profileImage);

    // Add personal details
    if (phoneNumber) formData.append('phoneNumber', phoneNumber);
    if (dob) formData.append('dob', dob);
    if (gender) formData.append('gender', gender);
    if (occupation) formData.append('profession', occupation);

    // Add medical details
    if (medicalHistory) {
      const medicalHistoryArray = medicalHistory.split('\n').filter((item) => item.trim());
      formData.append('medicalHistory', JSON.stringify(medicalHistoryArray));
    }
    if (symptoms) {
      const symptomsArray = symptoms.split('\n').filter((item) => item.trim());
      formData.append('symptoms', JSON.stringify(symptomsArray));
    }
    if (medications) {
      const medicationsArray = medications.split('\n').filter((item) => item.trim());
      formData.append('medications', JSON.stringify(medicationsArray));
    }

    const toastId = toast.loading('Creating your account...');

    handleSignup(formData, {
      onSuccess: async (response) => {
        toast.success('Account created successfully!', { id: toastId });

        // First, sign in the user to establish the session
        try {
          const signInResult = await signIn('credentials', {
            email: response.user.email,
            token: response.token,
            role: 'CLIENT',
            redirect: false,
          });

          if (signInResult?.error) {
            toast.error('Account created but failed to sign in. Please try logging in manually.');
            router.push('/client/auth');
            return;
          }

          // Successfully signed in - now check if there's an intake form attached to the invitation
          checkIntakeForm(
            { invitationToken },
            {
              onSuccess: (checkResult) => {
                if (checkResult.hasIntakeForm) {
                  // Has intake form - redirect to intake page
                  router.push(`/client/intake?token=${token}`);
                } else {
                  // No intake form - redirect directly to response sent page
                  router.push(`/client/response-sent?token=${token}`);
                }
              },
              onError: (checkError) => {
                // If check fails, assume no intake form and redirect to response sent
                router.push(`/client/response-sent?token=${token}`);
              },
            },
          );
        } catch (signInError) {
          toast.error('Account created but failed to sign in. Please try logging in manually.');
          router.push('/client/auth');
        }
      },
      onError: (err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
        toast.error(errorMessage, { id: toastId });
      },
    });
  };

  return (
    <AuthLayout>
      <AuthHeader title='Medical Details' />
      <form
        className='space-y-6'
        onSubmit={(e) => {
          e.preventDefault();
          handleNext();
        }}
      >
        <FreeformInput
          label='Relevant Medical History'
          placeholder='Enter medical history'
          value={medicalHistory}
          setValue={setMedicalHistory}
        />
        <FreeformInput
          label='Current Symptoms'
          placeholder='Enter current symptoms'
          value={symptoms}
          setValue={setSymptoms}
        />
        <FreeformInput
          label='Current Medications'
          placeholder='Enter current medications'
          value={medications}
          setValue={setMedications}
        />
        <div className='pt-4'>
          <Button type='submit' disabled={isSigningUp} className='w-full rounded-full'>
            {isSigningUp && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Next
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
