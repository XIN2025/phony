'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';

const mockClientProfile = {
  name: 'Sophie Bennett',
  email: 'sophiebennett100@email.com',
  phone: '+44 987654270',
  dob: '30-05-2001',
  emergencyContact: 'Aronley Management',
  clientSince: 'Jan 1, 2025',
  caseNumber: '44 987654270',
  personalDetails: {
    weight: '119 lbs',
    height: '165 cm',
    allergies: 'Nil',
    recentMedicalHistory: 'Nil',
    vaccinationHistory: 'All vaccines received',
    occupation: 'Product Designer',
    lifestyle: 'Sedentary Lifestyle',
    currentSymptoms: 'Panic Attacks, Restlessness, Difficulty Concentrating',
    currentMedications: 'Benzodiazepines, Xanax, Atrazodone',
  },
};

export default function ClientProfilePage({ params }: { params: Promise<{ clientId: string }> }) {
  const router = useRouter();
  const [clientId, setClientId] = React.useState<string>('');

  React.useEffect(() => {
    params.then((resolvedParams) => {
      setClientId(resolvedParams.clientId);
    });
  }, [params]);

  if (!clientId) {
    return <div className='flex items-center justify-center min-h-screen'>Loading...</div>;
  }

  return (
    <div className='flex flex-col min-h-screen bg-gray-50'>
      <div className='flex flex-col gap-0 border-b bg-white px-6 pt-6 pb-4'>
        <div className='w-full flex items-center'>
          <button
            type='button'
            aria-label='Back'
            onClick={() => router.push(`/practitioner/clients/${clientId}/dashboard`)}
            className='text-gray-600 hover:text-gray-900 focus:outline-none mr-4'
          >
            <ArrowLeft className='h-6 w-6' />
          </button>
        </div>
        <div className='mt-2'>
          <h1 className='text-xl font-semibold text-gray-900'>Client Profile Information</h1>
        </div>
      </div>

      <div className='flex-1 w-full py-8 bg-gray-50'>
        <div className='max-w-7xl mx-auto px-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card className='bg-white border border-gray-200 rounded-lg shadow-sm'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-lg font-semibold text-gray-900'>Personal Details</CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='flex items-center gap-4'>
                  <Avatar className='h-16 w-16'>
                    <AvatarImage src='' />
                    <AvatarFallback className='text-lg font-semibold bg-gray-100'>
                      {mockClientProfile.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className='text-lg font-semibold text-gray-900'>{mockClientProfile.name}</h2>
                    <p className='text-sm text-gray-500'>{mockClientProfile.email}</p>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div>
                    <span className='text-sm font-medium text-gray-700'>Phone Number:</span>
                    <p className='text-sm text-gray-900'>{mockClientProfile.phone}</p>
                  </div>
                  <div>
                    <span className='text-sm font-medium text-gray-700'>DOB:</span>
                    <p className='text-sm text-gray-900'>{mockClientProfile.dob}</p>
                  </div>
                  <div>
                    <span className='text-sm font-medium text-gray-700'>Emergency:</span>
                    <p className='text-sm text-gray-900'>{mockClientProfile.emergencyContact}</p>
                  </div>
                  <div>
                    <span className='text-sm font-medium text-gray-700'>Client Since:</span>
                    <p className='text-sm text-gray-900'>{mockClientProfile.clientSince}</p>
                  </div>
                  <div>
                    <span className='text-sm font-medium text-gray-700'>Case Number:</span>
                    <p className='text-sm text-gray-900'>{mockClientProfile.caseNumber}</p>
                  </div>
                </div>

                <div className='pt-4'>
                  <Button variant='outline' className='text-sm border-gray-300 text-gray-700 hover:bg-gray-50'>
                    Show Intake Survey Responses
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className='bg-white border border-gray-200 rounded-lg shadow-sm'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-lg font-semibold text-gray-900'>Anthropometry</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div>
                    <span className='text-sm font-medium text-gray-700'>Weight:</span>
                    <p className='text-sm text-gray-900'>{mockClientProfile.personalDetails.weight}</p>
                  </div>
                  <div>
                    <span className='text-sm font-medium text-gray-700'>Height:</span>
                    <p className='text-sm text-gray-900'>{mockClientProfile.personalDetails.height}</p>
                  </div>
                  <div>
                    <span className='text-sm font-medium text-gray-700'>Allergies:</span>
                    <p className='text-sm text-gray-900'>{mockClientProfile.personalDetails.allergies}</p>
                  </div>
                  <div>
                    <span className='text-sm font-medium text-gray-700'>Recent Medical History:</span>
                    <p className='text-sm text-gray-900'>{mockClientProfile.personalDetails.recentMedicalHistory}</p>
                  </div>
                  <div>
                    <span className='text-sm font-medium text-gray-700'>Vaccination History:</span>
                    <p className='text-sm text-gray-900'>{mockClientProfile.personalDetails.vaccinationHistory}</p>
                  </div>
                  <div>
                    <span className='text-sm font-medium text-gray-700'>Occupation & Lifestyle:</span>
                    <p className='text-sm text-gray-900'>
                      {mockClientProfile.personalDetails.occupation}, {mockClientProfile.personalDetails.lifestyle}
                    </p>
                  </div>
                  <div>
                    <span className='text-sm font-medium text-gray-700'>Current Symptoms:</span>
                    <p className='text-sm text-gray-900'>{mockClientProfile.personalDetails.currentSymptoms}</p>
                  </div>
                  <div>
                    <span className='text-sm font-medium text-gray-700'>Current Medications:</span>
                    <p className='text-sm text-gray-900'>{mockClientProfile.personalDetails.currentMedications}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
