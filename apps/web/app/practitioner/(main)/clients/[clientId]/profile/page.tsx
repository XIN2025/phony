'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { useGetClient, useGetClientIntakeForm } from '@/lib/hooks/use-api';
import { getAvatarUrl, getInitials } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { SidebarToggleButton } from '@/components/practitioner/SidebarToggleButton';

export default function ClientProfilePage({ params }: { params: Promise<{ clientId: string }> }) {
  const [clientId, setClientId] = React.useState<string>('');
  const router = useRouter();

  React.useEffect(() => {
    params.then((resolvedParams) => {
      setClientId(resolvedParams.clientId);
    });
  }, [params]);

  const { data: client, isLoading: isClientLoading } = useGetClient(clientId);
  const { data: intakeForm, isLoading: isIntakeLoading } = useGetClientIntakeForm(!!clientId);

  if (!clientId || isClientLoading) {
    return <div className='flex items-center justify-center min-h-screen'>Loading...</div>;
  }

  return (
    <div className='w-full flex flex-col items-center pt-8 px-2 sm:px-0'>
      <PageHeader
        title='Client Profile'
        showBackButton={true}
        onBack={() => router.back()}
        className='bg-transparent w-full mb-4'
      >
        <SidebarToggleButton />
      </PageHeader>
      <div className='w-full flex flex-col gap-8'>
        {/* Top section: Personal Details & Client Info */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-center gap-4 mb-4'>
                <Avatar className='h-14 w-14'>
                  <AvatarImage src={getAvatarUrl(client?.avatarUrl, client)} />
                  <AvatarFallback>
                    {getInitials({ firstName: client?.firstName, lastName: client?.lastName })}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className='font-semibold text-lg'>
                    {client?.firstName} {client?.lastName}
                  </div>
                  <div className='text-sm text-muted-foreground'>{client?.email}</div>
                </div>
              </div>
              <div className='grid grid-cols-1 gap-2 text-sm'>
                <div>
                  <span className='font-medium'>Phone Number:</span> {client?.phoneNumber || '-'}
                </div>
                <div>
                  <span className='font-medium'>DOB:</span> {client?.dob || '-'}
                </div>
                <div>
                  <span className='font-medium'>Gender:</span> {client?.gender || '-'}
                </div>
                <div>
                  <span className='font-medium'>Occupation:</span> {client?.profession || '-'}
                </div>
                <div>
                  <span className='font-medium'>Client Since:</span>{' '}
                  {client?.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'}
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 gap-2 text-sm'>
                <div>
                  <span className='font-medium'>Relevant Medical History:</span> {client?.medicalHistory || 'Nil'}
                </div>
                <div>
                  <span className='font-medium'>Current Symptoms:</span> {client?.currentSymptoms || '-'}
                </div>
                <div>
                  <span className='font-medium'>Current Medications:</span> {client?.currentMedications || '-'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Intake Survey Responses */}
        <Card>
          <CardHeader>
            <CardTitle>Intake Survey Responses</CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO: Map and display intake survey responses when available in API */}
            <div className='text-muted-foreground'>No intake survey responses found.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
