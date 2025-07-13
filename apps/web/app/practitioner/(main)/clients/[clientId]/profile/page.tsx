'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { useGetClient, useGetClientIntakeForm } from '@/lib/hooks/use-api';
import { getAvatarUrl, getInitials } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
// Removed PageHeader import
import { SidebarToggleButton } from '@/components/practitioner/SidebarToggleButton';

export default function ClientProfilePage({ params }: { params: Promise<{ clientId: string }> }) {
  const [clientId, setClientId] = React.useState<string>('');
  const [showIntake, setShowIntake] = useState(true);
  const router = useRouter();

  React.useEffect(() => {
    params.then((resolvedParams) => {
      setClientId(resolvedParams.clientId);
    });
  }, [params]);

  const { data: client, isLoading: isClientLoading } = useGetClient(clientId);
  const { data: intakeForm, isLoading: isIntakeLoading } = useGetClientIntakeForm(!!clientId);

  if (!clientId || isClientLoading || !client) {
    return <div className='flex items-center justify-center min-h-screen'>Loading...</div>;
  }

  // Helper for Q&A rendering
  const renderQA = (label: string, value: string | undefined, key?: string) => (
    <div className='mb-4' key={key}>
      <div className='font-medium text-sm mb-1'>{label}</div>
      <div className='  rounded-lg px-4 py-2 text-sm'>{value || '-'}</div>
    </div>
  );

  // Extract DOB, gender, occupation if available
  const dob = client?.dob || '';
  const gender = client?.gender || '';
  const occupation = client?.profession || '';

  return (
    <div className='w-full flex flex-col pt-6 px-2 sm:px-0 min-h-screen'>
      <div className='w-full flex flex-col gap-4  mx-auto'>
        {/* Back button row */}
        <div className='flex items-center mb-2'>
          <button
            type='button'
            aria-label='Back'
            onClick={() => router.back()}
            className='text-muted-foreground hover:text-foreground focus:outline-none'
            style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft className='h-6 w-6 sm:h-7 sm:w-7' />
          </button>
        </div>
        {/* Heading row */}
        <div className='flex items-center mb-6'>
          <h1
            className='text-xl sm:text-2xl md:text-3xl font-bold tracking-tight'
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Client Profile
          </h1>
          <div className='ml-auto'>
            <SidebarToggleButton />
          </div>
        </div>
        {/* Top section: Two-column grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 px-8 gap-6'>
          {/* Personal Details */}
          <div className='bg-white rounded-2xl shadow-md p-8 flex flex-col gap-4 min-h-[260px]'>
            <div className='flex items-center gap-4 mb-4'>
              <Avatar className='h-16 w-16 border-2 border-gray-200'>
                <AvatarImage src={getAvatarUrl(client.avatarUrl, client)} />
                <AvatarFallback className='text-2xl'>
                  {getInitials({ firstName: client.firstName, lastName: client.lastName })}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className='font-semibold text-xl'>
                  {client.firstName} {client.lastName}
                </div>
              </div>
            </div>
            <div className='grid grid-cols-1 gap-2 text-base'>
              <div>
                <span className='font-semibold'>Email ID:</span> <span className='font-normal'>{client.email}</span>
              </div>
              <div>
                <span className='font-semibold'>Phone Number:</span>{' '}
                <span className='font-normal'>{client.phoneNumber || '-'}</span>
              </div>
              <div>
                <span className='font-semibold'>DOB:</span> <span className='font-normal'>{dob}</span>
              </div>
              <div>
                <span className='font-semibold'>Gender:</span> <span className='font-normal'>{gender}</span>
              </div>
              <div>
                <span className='font-semibold'>Occupation:</span> <span className='font-normal'>{occupation}</span>
              </div>
              <div>
                <span className='font-semibold'>Client Since:</span>{' '}
                <span className='font-normal'>
                  {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'}
                </span>
              </div>
            </div>
          </div>
          {/* Client Information */}
          <div className='bg-white rounded-2xl shadow-md p-8  flex flex-col gap-4 min-h-[260px]'>
            <div className='font-semibold text-xl mb-4'>Client Information</div>
            <div className='grid grid-cols-1 gap-2 text-base'>
              <div>
                <span className='font-semibold'>Relevant Medical History:</span>{' '}
                <span className='font-normal'>
                  {client.medicalHistory && client.medicalHistory.length > 0 ? client.medicalHistory.join(', ') : 'Nil'}
                </span>
              </div>
              <div>
                <span className='font-semibold'>Current Symptoms:</span>{' '}
                <span className='font-normal'>
                  {client.symptoms && client.symptoms.length > 0 ? client.symptoms.join(', ') : '-'}
                </span>
              </div>
              <div>
                <span className='font-semibold'>Current Medications:</span>{' '}
                <span className='font-normal'>
                  {client.medications && client.medications.length > 0 ? client.medications.join(', ') : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Intake Survey Responses */}
        <div className='w-full px-8'>
          <div className='flex justify-end mb-2'>
            <button
              className='border border-gray-300 rounded-full px-5 py-1.5 text-sm font-medium bg-white hover:bg-gray-100 transition shadow-sm'
              onClick={() => setShowIntake((v) => !v)}
            >
              {showIntake ? 'Hide Intake Survey Responses' : 'Show Intake Survey Responses'}
            </button>
          </div>
          {showIntake && (
            <div className='bg-white rounded-2xl shadow-md px-2 p-8'>
              <div className='font-semibold text-xl mb-1'>Intake Survey Responses</div>
              {client.intakeFormSubmission ? (
                <>
                  <div className='text-xs text-gray-500 mb-6'>
                    Submitted on {new Date(client.intakeFormSubmission.submittedAt).toLocaleDateString()}
                  </div>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {client.intakeFormSubmission.form.questions.map((q: any) => {
                      const answer = client.intakeFormSubmission.answers.find((a: any) => a.questionId === q.id);
                      return (
                        <div key={q.id} className='mb-2'>
                          <div className='font-medium text-base mb-1'>{q.text}</div>
                          <div className='bg-[#F6F6F6] rounded-xl px-4 py-3 text-base'>{answer?.value || '-'}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className='text-gray-500 text-base'>No intake survey responses found.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
