'use client';
import * as React from 'react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select';
import { useSignUpContext } from '@/context/signup-context';
import { AuthLayout } from '@repo/ui/components/auth-layout';
import { AuthHeader } from '@/components/PageHeader';
import { useCheckInvitationIntakeForm, useClientSignup } from '@/lib/hooks/use-api';
import { SignupStepper } from '@/components/SignupStepper';
import { Calendar } from '@repo/ui/components/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/popover';
import Image from 'next/image';

const validatePhoneNumber = (value: string): string => {
  return value.replace(/[^0-9+\-()\s]/g, '');
};

export default function PersonalDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { signUpData, updateSignUpData } = useSignUpContext();
  const { mutate: checkIntakeForm } = useCheckInvitationIntakeForm();
  const { mutateAsync: signupClient, isPending: isSigningUp } = useClientSignup();

  const [firstName, setFirstName] = useState(signUpData.firstName || '');
  const [lastName, setLastName] = useState(signUpData.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState(signUpData.phoneNumber || '');
  const [dob, setDob] = useState(signUpData.dob || '');
  const [occupation, setOccupation] = useState(signUpData.occupation || '');
  const [profileImage, setProfileImage] = useState<File | null>(signUpData.profileImage || null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState(false);

  React.useEffect(() => {
    if (!token) {
      toast.error('Invalid access. Please start from the invitation link.');
      router.push('/client/auth');
      return;
    }

    if (!signUpData.email || !signUpData.invitationToken) {
      toast.error('Please complete the previous steps first.');
      router.push(`/client/auth/signup?token=${token}`);
      return;
    }
  }, [token, signUpData, router]);

  React.useEffect(() => {
    if (signUpData.profileImage) {
      setProfileImagePreview(URL.createObjectURL(signUpData.profileImage));
    }
  }, [signUpData.profileImage]);

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validatedValue = validatePhoneNumber(e.target.value);
    setPhoneNumber(validatedValue);
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim() || !dob.trim() || !occupation.trim()) {
      toast.error('Please fill out all fields.');
      return;
    }

    updateSignUpData({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phoneNumber.trim(),
      dob: dob.trim(),
      occupation: occupation.trim(),
      profileImage,
    });

    const { email, invitationToken } = signUpData;
    if (!email || !invitationToken) {
      toast.error('Missing required information. Please go back and complete the form.');
      router.push(`/client/auth/signup?token=${token}`);
      return;
    }

    const formData = new FormData();
    formData.append('email', email);
    formData.append('firstName', firstName.trim());
    formData.append('lastName', lastName.trim());
    formData.append('invitationToken', invitationToken);
    if (profileImage) formData.append('profileImage', profileImage);
    formData.append('phoneNumber', phoneNumber.trim());
    formData.append('dob', dob.trim());
    formData.append('profession', occupation.trim());

    try {
      await signupClient(formData);

      checkIntakeForm(
        { invitationToken },
        {
          onSuccess: (checkResult) => {
            if (checkResult.hasIntakeForm) {
              router.push(`/client/intake?token=${token}`);
            } else {
              router.push(`/client`);
            }
          },
          onError: () => {
            router.push(`/client`);
          },
        },
      );
    } catch (err) {
      toast.error('Failed to create account. Please try again.');
    }
  };

  return (
    <AuthLayout variant='client'>
      {/* Top bar for mobile - fixed at the top */}
      <div className='block sm:hidden fixed top-0 left-0 right-0 z-20 px-4 pt-4 pb-2 w-full'>
        <AuthHeader />
      </div>

      {/* Content container */}
      <div className='flex-1 flex flex-col items-center w-full'>
        {/* Add top margin for mobile to avoid overlap with fixed header */}
        <div className='block sm:hidden' style={{ marginTop: '40px' }}></div>
        <div className='w-full max-w-md mx-auto flex flex-col items-center rounded-xl py-2 sm:py-6 sm:px-8 sm:mt-0 mt-0'>
          {/* Top bar for desktop */}
          <div className='hidden sm:flex w-full mb-4'>
            <AuthHeader />
          </div>

          <form onSubmit={handleNext} className='space-y-4 px-4 sm:px-8 max-w-md mx-auto w-full'>
            <div className='text-left'>
              <h2
                className='font-semibold mb-2'
                style={{ color: '#7A6E5A', fontFamily: 'DM Serif Display, serif', fontSize: '26px' }}
              >
                Your Profile
              </h2>
            </div>
            <div className='flex justify-center mb-6'>
              <label htmlFor='profile-photo-upload' className='cursor-pointer flex flex-col items-center'>
                {profileImagePreview ? (
                  <div className='h-24 w-24 rounded-full overflow-hidden mb-2 border-2 border-gray-200'>
                    <Image
                      src={profileImagePreview}
                      alt='Profile Photo'
                      width={96}
                      height={96}
                      className='w-full h-full object-cover'
                      style={{ minWidth: '96px', minHeight: '96px' }}
                    />
                  </div>
                ) : (
                  <div className='h-24 w-24 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center bg-gray-50 mb-2'>
                    <User className='h-12 w-12 text-gray-400' />
                  </div>
                )}
                <span className='text-sm text-muted-foreground'>Profile Photo</span>
                <input
                  id='profile-photo-upload'
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={handleProfileImageChange}
                />
              </label>
            </div>
            <div className='grid grid-cols-1 gap-4'>
              <Input
                id='first-name'
                placeholder='First Name'
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className='bg-white/80 text-sm'
                required
              />
              <Input
                id='last-name'
                placeholder='Last Name'
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className='bg-white/80 text-sm'
                required
              />
              <Input
                id='phone-number'
                placeholder='Phone Number'
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                className='bg-white/80 text-sm'
                required
              />
              {/* Date of Birth with calendar popover */}
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger>
                  <Input
                    id='dob'
                    placeholder='Date of Birth '
                    value={dob}
                    readOnly
                    onClick={() => setShowCalendar(true)}
                    required
                    className='bg-white/80 cursor-pointer text-sm'
                  />
                </PopoverTrigger>
                <PopoverContent align='start' className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={dob ? new Date(dob) : undefined}
                    onSelect={(date) => {
                      setDob(date ? date.toISOString().slice(0, 10) : '');
                      setShowCalendar(false);
                    }}
                    captionLayout='dropdown'
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Input
                id='occupation'
                placeholder='Occupation'
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className='bg-white/80 text-sm'
                required
              />
            </div>

            {/* Desktop stepper and button inside form */}
            <div className='hidden sm:block'>
              {/* Progress bar above the button */}
              <SignupStepper totalSteps={4} currentStep={3} />
              <div className='pt-4'>
                <Button
                  type='submit'
                  className='w-full rounded-full'
                  disabled={isSigningUp}
                  style={{ fontSize: 18, fontWeight: 600, height: 48 }}
                >
                  {isSigningUp ? 'Creating Account...' : 'Continue'}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Mobile-only stepper and button positioned at bottom of screen */}
        <div className='block sm:hidden fixed bottom-0 left-0 right-0 z-20  pb-6 pt-4 '>
          {/* Progress bar at top */}
          <div className='flex justify-center mb-4'>
            <SignupStepper totalSteps={4} currentStep={3} />
          </div>

          {/* Continue button positioned below stepper */}
          <div className='flex justify-center px-4'>
            <Button
              type='submit'
              className='w-full max-w-md rounded-full'
              disabled={isSigningUp}
              style={{ fontSize: 18, fontWeight: 600, height: 48 }}
              onClick={handleNext}
            >
              {isSigningUp ? 'Creating Account...' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
