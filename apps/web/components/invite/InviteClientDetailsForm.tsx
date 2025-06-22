'use client';

import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/ui/components/card';

const schema = z.object({
  clientFirstName: z.string().min(1, 'First name is required'),
  clientLastName: z.string().min(1, 'Last name is required'),
  clientEmail: z.string().email('Invalid email address'),
  includeIntakeForm: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onNext: (data: FormValues) => void;
  isLoading: boolean;
}

export function InviteClientDetailsForm({ onNext, isLoading }: Props) {
  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientFirstName: '',
      clientLastName: '',
      clientEmail: '',
      includeIntakeForm: false,
    },
    mode: 'onBlur',
  });

  const includeIntakeForm = useWatch({
    control,
    name: 'includeIntakeForm',
  });

  const onSubmit = (data: FormValues) => {
    onNext(data);
  };

  return (
    <Card className='max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle>Invite Client</CardTitle>
        <CardDescription>Enter the details of the client you want to invite.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-8'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='clientFirstName'>First Name</Label>
              <Controller
                name='clientFirstName'
                control={control}
                render={({ field }) => <Input id='clientFirstName' placeholder='Enter first name' {...field} />}
              />
              {errors.clientFirstName && <p className='text-sm text-destructive'>{errors.clientFirstName.message}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='clientLastName'>Last Name</Label>
              <Controller
                name='clientLastName'
                control={control}
                render={({ field }) => <Input id='clientLastName' placeholder='Enter last name' {...field} />}
              />
              {errors.clientLastName && <p className='text-sm text-destructive'>{errors.clientLastName.message}</p>}
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='clientEmail'>Email</Label>
            <Controller
              name='clientEmail'
              control={control}
              render={({ field }) => <Input id='clientEmail' type='email' placeholder='Enter email' {...field} />}
            />
            {errors.clientEmail && <p className='text-sm text-destructive'>{errors.clientEmail.message}</p>}
          </div>

          <div className='flex items-center space-x-2 pt-4'>
            <Controller
              name='includeIntakeForm'
              control={control}
              render={({ field }) => (
                <Checkbox id='includeIntakeForm' checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label htmlFor='includeIntakeForm' className='font-normal'>
              Include intake form for onboarding
            </Label>
          </div>

          <div className='flex justify-end items-center pt-8 gap-4'>
            <Button type='button' variant='outline' onClick={() => (window.location.href = '/practitioner')}>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={!isValid || isLoading}
              className='px-8 bg-gray-900 text-white hover:bg-gray-800'
            >
              {isLoading ? 'Sending...' : includeIntakeForm ? 'Continue' : 'Send Invite'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
