'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { UserProfileCard } from '@/components/UserProfileCard';

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
    <div className='w-full flex justify-center pt-8'>
      <div className='max-w-3xl w-full'>
        <UserProfileCard userId={clientId} mode='practitioner' />
      </div>
    </div>
  );
}
