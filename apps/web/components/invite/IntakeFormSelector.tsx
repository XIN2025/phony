'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';
import { ApiClient } from '@/lib/api-client';
import { useInviteContext } from '@/context/InviteContext';
import { ArrowLeft, FilePlus2, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface IntakeForm {
  id: string;
  title: string;
  description: string;
  _count: {
    questions: number;
  };
}

interface Props {
  onNext: (data: { intakeFormId: string | null }) => void;
  onBack: () => void;
  isLoading: boolean;
}

export function IntakeFormSelector({ onNext, onBack, isLoading }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: forms,
    isLoading: formsLoading,
    error: formsError,
  } = useQuery<IntakeForm[]>({
    queryKey: ['intake-forms'],
    queryFn: async (): Promise<IntakeForm[]> => {
      console.log('Fetching intake forms...');
      const response = await ApiClient.get('/api/intake-forms');
      console.log('Intake forms response:', response);
      return response as IntakeForm[];
    },
  });
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

  // Debug logging
  console.log('IntakeFormSelector - forms:', forms);
  console.log('IntakeFormSelector - formsLoading:', formsLoading);
  console.log('IntakeFormSelector - formsError:', formsError);
  console.log('IntakeFormSelector - selectedFormId:', selectedFormId);

  // When returning to this component, we want to make sure we have the latest forms
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['intake-forms'] });
  }, []);

  const handleSelectForm = (formId: string) => {
    setSelectedFormId(formId);
  };

  const handleSendInvite = () => {
    onNext({ intakeFormId: selectedFormId });
  };

  const handleSkip = () => {
    onNext({ intakeFormId: null });
  };

  const handleCreateNew = () => {
    router.push('/practitioner/intake-forms/new?redirect=/practitioner/invite');
  };

  return (
    <div>
      <button onClick={onBack} className='flex items-center gap-2 text-sm text-muted-foreground mb-4 hover:underline'>
        <ArrowLeft className='h-4 w-4' />
        Back
      </button>
      <Card>
        <CardHeader>
          <CardTitle>Attach Intake Form (Optional)</CardTitle>
          <CardDescription>
            You can attach an existing intake form to this invitation or create a new one.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div>
            <h3 className='mb-4 font-medium'>Choose Existing</h3>
            {formsError ? (
              <div className='text-center py-8 border-2 border-dashed rounded-lg border-destructive'>
                <p className='text-destructive'>Error loading forms: {formsError.message}</p>
              </div>
            ) : formsLoading ? (
              <div className='grid gap-4 sm:grid-cols-2'>
                <Skeleton className='h-24 w-full' />
                <Skeleton className='h-24 w-full' />
              </div>
            ) : forms && forms.length > 0 ? (
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {forms.map((form) => (
                  <button
                    key={form.id}
                    type='button'
                    onClick={() => handleSelectForm(form.id)}
                    className={`p-4 border rounded-lg text-left transition-colors ${selectedFormId === form.id ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'}`}
                  >
                    <FileText className='h-6 w-6 mb-2' />
                    <h4 className='font-semibold'>{form.title}</h4>
                    <p className='text-sm text-muted-foreground'>{form._count.questions || 0} questions</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className='text-center py-8 border-2 border-dashed rounded-lg'>
                <p className='text-muted-foreground'>No existing intake forms.</p>
                <p className='text-xs text-muted-foreground mt-2'>Debug: forms={JSON.stringify(forms)}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className='mb-4 font-medium'>Or Create a New One</h3>
            <button
              onClick={handleCreateNew}
              className='w-full p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center hover:border-primary transition-colors'
            >
              <FilePlus2 className='h-8 w-8 mb-2 text-muted-foreground' />
              <span className='font-medium'>Create New Form</span>
            </button>
          </div>
        </CardContent>
        <CardFooter className='flex justify-between'>
          <Button variant='ghost' onClick={handleSkip} disabled={isLoading}>
            Skip & Send Invite
          </Button>
          <Button onClick={handleSendInvite} disabled={isLoading}>
            Send Invite
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
