'use client';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Checkbox } from '@repo/ui/components/checkbox';
import { inviteClientSchema } from '@repo/shared-types/schemas';
import { useInviteContext } from '@/context/InviteContext';
type FormValues = z.infer<typeof inviteClientSchema>;
interface Props {
  onNext: (data: FormValues) => void;
  isLoading: boolean;
  onCancel: () => void;
}
export function InviteClientDetailsForm({ onNext, isLoading, onCancel }: Props) {
  const { inviteData } = useInviteContext();
  const {
    handleSubmit,
    control,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(inviteClientSchema),
    defaultValues: {
      clientFirstName: inviteData.clientFirstName || '',
      clientLastName: inviteData.clientLastName || '',
      clientEmail: inviteData.clientEmail || '',
      includeIntakeForm: inviteData.includeIntakeForm || false,
    },
    mode: 'onChange',
  });
  const includeIntakeForm = watch('includeIntakeForm');
  return (
    <form onSubmit={handleSubmit(onNext)} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='clientFirstName' className='text-sm font-medium'>
          First Name
        </Label>
        <Controller
          name='clientFirstName'
          control={control}
          render={({ field }) => <Input id='clientFirstName' placeholder='Your first name' {...field} />}
        />
        {errors.clientFirstName && <p className='text-sm text-destructive'>{errors.clientFirstName.message}</p>}
      </div>
      <div className='space-y-2'>
        <Label htmlFor='clientLastName' className='text-sm font-medium'>
          Last Name
        </Label>
        <Controller
          name='clientLastName'
          control={control}
          render={({ field }) => <Input id='clientLastName' placeholder='Your first name' {...field} />}
        />
        {errors.clientLastName && <p className='text-sm text-destructive'>{errors.clientLastName.message}</p>}
      </div>
      <div className='space-y-2'>
        <Label htmlFor='clientEmail' className='text-sm font-medium'>
          Email
        </Label>
        <Controller
          name='clientEmail'
          control={control}
          render={({ field }) => <Input id='clientEmail' type='email' placeholder='Enter Email ID' {...field} />}
        />
        {errors.clientEmail && <p className='text-sm text-destructive'>{errors.clientEmail.message}</p>}
      </div>
      <div className='space-y-4'>
        <Label className='text-base font-semibold'>Intake Form</Label>
        <div className='flex items-center space-x-3'>
          <Controller
            name='includeIntakeForm'
            control={control}
            render={({ field }) => (
              <Checkbox
                id='includeIntakeForm'
                checked={field.value}
                onCheckedChange={field.onChange}
                className='h-5 w-5 rounded-sm border-gray-300'
              />
            )}
          />
          <Label htmlFor='includeIntakeForm' className='font-normal text-gray-700'>
            Include intake form for onboarding
          </Label>
        </div>
      </div>
      <div className='flex flex-col gap-4 pt-8 sm:flex-row sm:justify-between'>
        <Button type='button' variant='outline' onClick={onCancel} className='w-full rounded-lg px-6 sm:w-auto'>
          Cancel
        </Button>
        <Button type='submit' disabled={!isValid || isLoading} className='w-full rounded-lg px-6 sm:w-auto'>
          {isLoading ? 'Sending...' : 'Continue'}
        </Button>
      </div>
    </form>
  );
}
