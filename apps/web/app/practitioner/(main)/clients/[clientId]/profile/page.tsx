'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
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
    <div className='w-full'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card className='bg-card border border-border rounded-2xl shadow-none'>
          <CardHeader className='pb-4'>
            <CardTitle className='text-lg font-semibold text-card-foreground'>Personal Details</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='flex items-center gap-4'>
              <Avatar className='h-16 w-16'>
                <AvatarImage src='' />
                <AvatarFallback className='text-lg font-semibold bg-muted'>
                  {mockClientProfile.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className='text-lg font-semibold text-card-foreground'>{mockClientProfile.name}</h2>
                <p className='text-sm text-muted-foreground'>{mockClientProfile.email}</p>
              </div>
            </div>

            <div className='space-y-4'>
              <div>
                <span className='text-sm font-medium text-muted-foreground'>Phone Number:</span>
                <p className='text-sm text-card-foreground'>{mockClientProfile.phone}</p>
              </div>
              <div>
                <span className='text-sm font-medium text-muted-foreground'>DOB:</span>
                <p className='text-sm text-card-foreground'>{mockClientProfile.dob}</p>
              </div>
              <div>
                <span className='text-sm font-medium text-muted-foreground'>Emergency:</span>
                <p className='text-sm text-card-foreground'>{mockClientProfile.emergencyContact}</p>
              </div>
              <div>
                <span className='text-sm font-medium text-muted-foreground'>Client Since:</span>
                <p className='text-sm text-card-foreground'>{mockClientProfile.clientSince}</p>
              </div>
              <div>
                <span className='text-sm font-medium text-muted-foreground'>Case Number:</span>
                <p className='text-sm text-card-foreground'>{mockClientProfile.caseNumber}</p>
              </div>
            </div>

            <div className='pt-4'>
              <Button variant='outline' className='text-sm rounded-full'>
                Show Intake Survey Responses
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-card border border-border rounded-2xl shadow-none'>
          <CardHeader className='pb-4'>
            <CardTitle className='text-lg font-semibold text-card-foreground'>Anthropometry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div>
                <span className='text-sm font-medium text-muted-foreground'>Weight:</span>
                <p className='text-sm text-card-foreground'>{mockClientProfile.personalDetails.weight}</p>
              </div>
              <div>
                <span className='text-sm font-medium text-muted-foreground'>Height:</span>
                <p className='text-sm text-card-foreground'>{mockClientProfile.personalDetails.height}</p>
              </div>
              <div>
                <span className='text-sm font-medium text-muted-foreground'>Allergies:</span>
                <p className='text-sm text-card-foreground'>{mockClientProfile.personalDetails.allergies}</p>
              </div>
              <div>
                <span className='text-sm font-medium text-muted-foreground'>Recent Medical History:</span>
                <p className='text-sm text-card-foreground'>{mockClientProfile.personalDetails.recentMedicalHistory}</p>
              </div>
              <div>
                <span className='text-sm font-medium text-muted-foreground'>Vaccination History:</span>
                <p className='text-sm text-card-foreground'>{mockClientProfile.personalDetails.vaccinationHistory}</p>
              </div>
              <div>
                <span className='text-sm font-medium text-muted-foreground'>Occupation & Lifestyle:</span>
                <p className='text-sm text-card-foreground'>
                  {mockClientProfile.personalDetails.occupation}, {mockClientProfile.personalDetails.lifestyle}
                </p>
              </div>
              <div>
                <span className='text-sm font-medium text-muted-foreground'>Current Symptoms:</span>
                <p className='text-sm text-card-foreground'>{mockClientProfile.personalDetails.currentSymptoms}</p>
              </div>
              <div>
                <span className='text-sm font-medium text-muted-foreground'>Current Medications:</span>
                <p className='text-sm text-card-foreground'>{mockClientProfile.personalDetails.currentMedications}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
