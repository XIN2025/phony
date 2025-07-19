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
    <AuthLayout>
      <div className=' sm:px-8  pb-2'>
        <AuthHeader />
      </div>
      <div className='px-4 sm:px-8 pt-2 pb-4'>
        <h2 className='text-xl font-semibold mb-2' style={{ color: '#7A6E5A', fontFamily: 'Playfair Display, serif' }}>
          Your Profile
        </h2>
      </div>
      <form onSubmit={handleNext} className='space-y-6 px-4 sm:px-8 max-w-md mx-auto w-full'>
        <div className='flex justify-center mb-8'>
          <label htmlFor='profile-photo-upload' className='cursor-pointer flex flex-col items-center'>
            {profileImagePreview ? (
              <Avatar className='h-24 w-24 mb-2'>
                <AvatarImage src={profileImagePreview} alt='Profile Photo' />
                <AvatarFallback>
                  <User className='h-12 w-12' />
                </AvatarFallback>
              </Avatar>
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
            required
          />
          <Input
            id='last-name'
            placeholder='Last Name'
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <Input
            id='phone-number'
            placeholder='Phone Number'
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            required
          />
          {/* Date of Birth with calendar popover */}
          <div>
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Input
                  id='dob'
                  placeholder='Date of Birth'
                  value={dob}
                  readOnly
                  onClick={() => setShowCalendar(true)}
                  required
                  className='text-left pl-3 pr-10'
                  style={{ textAlign: 'left' }}
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
          </div>
          <Input
            id='occupation'
            placeholder='Occupation'
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            required
          />
        </div>
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
      </form>
    </AuthLayout>
  );
}
