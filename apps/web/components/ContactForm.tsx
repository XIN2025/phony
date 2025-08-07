'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSubmitContactForm } from '@/lib/hooks/use-api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const contactFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters long'),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

const countries = [
  { code: '+1', name: 'US/CA' },
  { code: '+44', name: 'UK' },
  { code: '+33', name: 'France' },
  { code: '+49', name: 'Germany' },
  { code: '+39', name: 'Italy' },
  { code: '+34', name: 'Spain' },
  { code: '+31', name: 'Netherlands' },
  { code: '+32', name: 'Belgium' },
  { code: '+41', name: 'Switzerland' },
  { code: '+43', name: 'Austria' },
  { code: '+45', name: 'Denmark' },
  { code: '+46', name: 'Sweden' },
  { code: '+47', name: 'Norway' },
  { code: '+358', name: 'Finland' },
  { code: '+61', name: 'Australia' },
  { code: '+64', name: 'New Zealand' },
  { code: '+91', name: 'India' },
  { code: '+86', name: 'China' },
  { code: '+81', name: 'Japan' },
  { code: '+82', name: 'South Korea' },
];

export const ContactForm = () => {
  const [selectedCountry, setSelectedCountry] = useState('+44');
  const { mutate: submitContactForm, isPending } = useSubmitContactForm();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  const onSubmit = (data: ContactFormData) => {
    const formattedData = {
      ...data,
      phone: data.phone ? `${selectedCountry} ${data.phone}` : undefined,
    };

    submitContactForm(formattedData, {
      onSuccess: (response) => {
        if (response.success) {
          toast.success(response.message);
          form.reset();
        } else {
          toast.error(response.message);
        }
      },
      onError: (error: any) => {
        const errorMessage = error?.message || 'Failed to send message. Please try again.';
        toast.error(errorMessage);
      },
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3 sm:space-y-4 md:space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6'>
        <div>
          <label htmlFor='firstName' className='block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2'>
            First Name
          </label>
          <input
            type='text'
            id='firstName'
            {...form.register('firstName')}
            className='w-full px-2 sm:px-3 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
            placeholder='Enter your first name'
            disabled={isPending}
          />
          {form.formState.errors.firstName && (
            <p className='mt-1 text-sm text-red-600'>{form.formState.errors.firstName.message}</p>
          )}
        </div>
        <div>
          <label htmlFor='lastName' className='block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2'>
            Last Name
          </label>
          <input
            type='text'
            id='lastName'
            {...form.register('lastName')}
            className='w-full px-2 sm:px-3 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
            placeholder='Enter your last name'
            disabled={isPending}
          />
          {form.formState.errors.lastName && (
            <p className='mt-1 text-sm text-red-600'>{form.formState.errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor='email' className='block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2'>
          Email
        </label>
        <input
          type='email'
          id='email'
          {...form.register('email')}
          className='w-full px-2 sm:px-3 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
          placeholder='your.email@example.com'
          disabled={isPending}
        />
        {form.formState.errors.email && (
          <p className='mt-1 text-sm text-red-600'>{form.formState.errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor='phone' className='block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2'>
          Phone Number (Optional)
        </label>
        <div className='flex gap-0'>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className='px-1 sm:px-2 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white w-16 sm:w-20'
            disabled={isPending}
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.code}
              </option>
            ))}
          </select>
          <input
            type='tel'
            id='phone'
            {...form.register('phone')}
            className='flex-1 px-2 sm:px-3 py-2 sm:py-2.5 text-sm sm:text-base border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
            placeholder='9876543210'
            disabled={isPending}
          />
        </div>
        {form.formState.errors.phone && (
          <p className='mt-1 text-sm text-red-600'>{form.formState.errors.phone.message}</p>
        )}
      </div>

      <div>
        <label htmlFor='message' className='block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2'>
          Message
        </label>
        <textarea
          id='message'
          {...form.register('message')}
          rows={3}
          className='w-full px-2 sm:px-3 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white min-h-[80px] sm:min-h-[100px]'
          placeholder='Leave us a message or a suggestion'
          disabled={isPending}
        />
        {form.formState.errors.message && (
          <p className='mt-1 text-sm text-red-600'>{form.formState.errors.message.message}</p>
        )}
      </div>

      <div className='text-center pt-2 sm:pt-4'>
        <button
          type='submit'
          disabled={isPending}
          className='w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors duration-300 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto min-h-[44px]'
        >
          {isPending && <Loader2 className='w-4 h-4 animate-spin' />}
          {isPending ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </form>
  );
};
