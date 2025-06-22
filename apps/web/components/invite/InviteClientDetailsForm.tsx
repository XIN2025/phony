'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui/components/card';
import { InviteData } from '../../context/InviteContext';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const schema = z.object({
  clientFirstName: z.string().min(1, 'First name is required'),
  clientLastName: z.string().min(1, 'Last name is required'),
  clientEmail: z.string().email('Invalid email address'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onNext: (data: Partial<InviteData>) => void;
  initialData: Partial<InviteData>;
}

export function InviteClientDetailsForm({ onNext, initialData }: Props) {
  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientFirstName: initialData.clientFirstName || '',
      clientLastName: initialData.clientLastName || '',
      clientEmail: initialData.clientEmail || '',
    },
    mode: 'onBlur',
  });

  const onSubmit = (data: FormValues) => {
    onNext(data);
  };

  return (
    <div>
      <Link href='/practitioner' className='flex items-center gap-2 text-sm text-muted-foreground mb-4 hover:underline'>
        <ArrowLeft className='h-4 w-4' />
        Back to Dashboard
      </Link>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Invite Client</CardTitle>
            <CardDescription>Enter your client's details to send them an invitation.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='clientFirstName'>First Name</Label>
                <Controller
                  name='clientFirstName'
                  control={control}
                  render={({ field }) => <Input id='clientFirstName' placeholder='Sarah' {...field} />}
                />
                {errors.clientFirstName && <p className='text-sm text-destructive'>{errors.clientFirstName.message}</p>}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='clientLastName'>Last Name</Label>
                <Controller
                  name='clientLastName'
                  control={control}
                  render={({ field }) => <Input id='clientLastName' placeholder='Wilson' {...field} />}
                />
                {errors.clientLastName && <p className='text-sm text-destructive'>{errors.clientLastName.message}</p>}
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='clientEmail'>Email</Label>
              <Controller
                name='clientEmail'
                control={control}
                render={({ field }) => (
                  <Input id='clientEmail' type='email' placeholder='sarah.wilson@example.com' {...field} />
                )}
              />
              {errors.clientEmail && <p className='text-sm text-destructive'>{errors.clientEmail.message}</p>}
            </div>
          </CardContent>
          <CardFooter className='flex justify-end'>
            <Button type='submit' disabled={!isValid}>
              Next: Choose Intake Form
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
