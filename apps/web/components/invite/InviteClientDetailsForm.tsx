'use client';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Checkbox } from '@repo/ui/components/checkbox';
import { inviteClientSchema } from '@repo/shared-types';
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
    formState: { errors, isValid },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(inviteClientSchema),
    defaultValues: {
      clientFirstName: inviteData.clientFirstName || '',
      clientLastName: inviteData.clientLastName || '',
      clientEmail: inviteData.clientEmail || '',
      intakeFormId: undefined, // Always start with undefined to allow unchecking
    },
    mode: 'onChange',
  });

  // Reset form when component mounts to ensure checkbox can be unchecked
  React.useEffect(() => {
    reset({
      clientFirstName: inviteData.clientFirstName || '',
      clientLastName: inviteData.clientLastName || '',
      clientEmail: inviteData.clientEmail || '',
      intakeFormId: undefined, // Always reset to undefined
    });
  }, [inviteData, reset]);

  return (
    <form onSubmit={handleSubmit(onNext)} className='w-full max-w-[1450px] mx-auto p-4 sm:p-8 space-y-6'>
      <div className='space-y-2'>
        <Label htmlFor='clientFirstName' className='text-sm font-medium' style={{ color: '#8C8B8B' }}>
          First Name
        </Label>
        <Controller
          name='clientFirstName'
          control={control}
          render={({ field }) => (
            <Input
              id='clientFirstName'
              placeholder="Client's first name"
              {...field}
              className='rounded-lg bg-white border border-gray-200 w-full text-base py-3 px-4 sm:text-base sm:py-2 sm:px-3'
              style={{
                boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              }}
            />
          )}
        />
        {errors.clientFirstName && <p className='text-sm text-destructive'>{errors.clientFirstName.message}</p>}
      </div>
      <div className='space-y-2'>
        <Label htmlFor='clientLastName' className='text-sm font-medium' style={{ color: '#8C8B8B' }}>
          Last Name
        </Label>
        <Controller
          name='clientLastName'
          control={control}
          render={({ field }) => (
            <Input
              id='clientLastName'
              placeholder="Client's last name"
              {...field}
              className='rounded-lg bg-white border border-gray-200 w-full text-base py-3 px-4 sm:text-base sm:py-2 sm:px-3'
              style={{
                boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              }}
            />
          )}
        />
        {errors.clientLastName && <p className='text-sm text-destructive'>{errors.clientLastName.message}</p>}
      </div>
      <div className='space-y-2'>
        <Label htmlFor='clientEmail' className='text-sm font-medium' style={{ color: '#8C8B8B' }}>
          Email
        </Label>
        <Controller
          name='clientEmail'
          control={control}
          render={({ field }) => (
            <Input
              id='clientEmail'
              type='email'
              placeholder='Enter Email ID'
              {...field}
              className='rounded-lg bg-white border border-gray-200 w-full text-base py-3 px-4 sm:text-base sm:py-2 sm:px-3'
              style={{
                boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              }}
            />
          )}
        />
        {errors.clientEmail && <p className='text-sm text-destructive'>{errors.clientEmail.message}</p>}
      </div>
      <div className='space-y-4'>
        <Label className='text-base font-semibold'>Intake Form (Optional)</Label>
        <div className='flex items-center space-x-3'>
          <Controller
            name='intakeFormId'
            control={control}
            render={({ field }) => (
              <Checkbox
                id='includeIntakeForm'
                checked={!!field.value}
                onCheckedChange={(checked) => field.onChange(checked ? 'placeholder' : undefined)}
                className='h-5 w-5 rounded-sm border-gray-300'
              />
            )}
          />
          <Label htmlFor='includeIntakeForm' className='font-normal text-gray-700'>
            Include intake form for onboarding
          </Label>
        </div>
      </div>
      {/* Action Buttons */}
      {/* Fixed bar for small screens only */}
      <div className='fixed bottom-0 left-0 w-full z-50 flex gap-3 px-2 py-8 block sm:hidden border-gray-200'>
        <Button
          type='button'
          variant='outline'
          onClick={onCancel}
          className='flex-1 rounded-full px-4  sm:hidden border border-black text-black bg-transparent hover:bg-gray-100 shadow-sm text-base'
        >
          Cancel
        </Button>
        <Button
          type='submit'
          disabled={!isValid || isLoading}
          className='flex-1 rounded-full px-4 py-3 bg-[#807171]   sm:hidden text-white shadow-sm   text-base'
        >
          {isLoading ? 'Sending...' : 'Continue'}
        </Button>
      </div>
      {/* Normal row for sm+ only */}
      <div className='hidden sm:flex flex-row gap-4 pt-8 sm:justify-between'>
        <Button
          type='button'
          variant='outline'
          onClick={onCancel}
          className='w-full rounded-full px-8 py-2 border border-black text-black bg-transparent hover:bg-gray-100 shadow-sm sm:w-auto'
        >
          Cancel
        </Button>
        <Button
          type='submit'
          disabled={!isValid || isLoading}
          className='w-full rounded-full px-8 py-2 bg-[#807171] text-white shadow-sm hover:bg-gray-900 sm:w-auto'
        >
          {isLoading ? 'Sending...' : 'Continue'}
        </Button>
      </div>
    </form>
  );
}
