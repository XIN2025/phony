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
import { AuthLayout, AuthHeader } from '@repo/ui/components/auth-layout';

export default function PersonalDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { signUpData, updateSignUpData } = useSignUpContext();

  const [firstName, setFirstName] = useState(signUpData.firstName || '');
  const [lastName, setLastName] = useState(signUpData.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState(signUpData.phoneNumber || '');
  const [dob, setDob] = useState(signUpData.dob || '');
  const [gender, setGender] = useState(signUpData.gender || '');
  const [occupation, setOccupation] = useState(signUpData.occupation || '');
  const [profileImage, setProfileImage] = useState<File | null>(signUpData.profileImage || null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');

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

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim() || !dob.trim() || !gender || !occupation.trim()) {
      toast.error('Please fill out all fields.');
      return;
    }

    updateSignUpData({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phoneNumber.trim(),
      dob: dob.trim(),
      gender,
      occupation: occupation.trim(),
      profileImage,
    });

    router.push(`/client/medical-details?token=${token}`);
  };

  return (
    <AuthLayout>
      <AuthHeader title='Personal Details' />
      <form onSubmit={handleNext} className='space-y-6'>
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
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label htmlFor='first-name' className='block text-sm font-medium mb-2'>
              First Name
            </Label>
            <Input
              id='first-name'
              placeholder='Your first name'
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor='last-name' className='block text-sm font-medium mb-2'>
              Last Name
            </Label>
            <Input
              id='last-name'
              placeholder='Your last name'
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor='phone-number' className='block text-sm font-medium mb-2'>
            Phone Number
          </Label>
          <Input
            id='phone-number'
            placeholder='Your phone number'
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label htmlFor='dob' className='block text-sm font-medium mb-2'>
              DOB
            </Label>
            <Input id='dob' placeholder='DD/MM/YYYY' value={dob} onChange={(e) => setDob(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor='gender' className='block text-sm font-medium mb-2'>
              Gender
            </Label>
            <Select onValueChange={setGender} value={gender} required>
              <SelectTrigger>
                <SelectValue placeholder='Select' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='male'>Male</SelectItem>
                <SelectItem value='female'>Female</SelectItem>
                <SelectItem value='other'>Other</SelectItem>
                <SelectItem value='prefer-not-to-say'>Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor='occupation' className='block text-sm font-medium mb-2'>
            Occupation
          </Label>
          <Input
            id='occupation'
            placeholder='Your occupation'
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            required
          />
        </div>
        <div className='pt-4'>
          <Button type='submit' className='w-full rounded-full'>
            Next
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
