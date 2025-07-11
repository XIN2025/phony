import React, { useState, useRef } from 'react';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Loader2, Edit, Trash2, CheckCircle } from 'lucide-react';
import { useGetClient, useGetCurrentUser, useUpdateProfile } from '@/lib/hooks/use-api';
import { getInitials, getAvatarUrl, getUserDisplayName } from '@/lib/utils';
import { signOut } from 'next-auth/react';

interface UserProfileCardProps {
  userId: string;
  mode: 'client' | 'practitioner';
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ userId, mode }) => {
  // Fetch user data
  const { data: user, isLoading } = mode === 'client' ? useGetClient(userId) : useGetClient(userId); // Replace with practitioner hook if available
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (user) {
      setFullName(getUserDisplayName(user));
      setEmail(user.email || '');
      setPhone(user.phoneNumber || '');
    }
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    // TODO: Implement save logic using useUpdateProfile
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[200px]'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!user) {
    return <div className='text-red-500 text-center py-10'>Failed to load user profile.</div>;
  }

  return (
    <div className='w-full bg-transparent  min-w-0'>
      <h2 className='text-2xl font-bold mb-1'>Profile Information</h2>
      <p className='text-gray-500 text-base mb-6'>Update your profile details</p>
      <div className='flex flex-col w-full px-3 gap-4 mb-8'>
        <div className='flex flex-row items-center gap-4'>
          <div className='relative group'>
            <button
              type='button'
              aria-label='Change profile picture'
              onClick={handleAvatarClick}
              className='focus:outline-none rounded-full transition-shadow focus:ring-2 focus:ring-black/30 hover:shadow-lg'
              style={{ boxShadow: '0 0 0 0 transparent' }}
            >
              <Avatar className='h-20 w-20 border-2 border-gray-300'>
                <AvatarImage src={avatarPreview || getAvatarUrl(user.avatarUrl, user)} />
                <AvatarFallback className='text-2xl'>
                  {getInitials({ firstName: user.firstName, lastName: user.lastName })}
                </AvatarFallback>
              </Avatar>
              <input type='file' ref={fileInputRef} onChange={handleFileChange} className='hidden' accept='image/*' />
              <span className='absolute bottom-0 right-0 bg-white border rounded-full p-1 shadow-sm group-hover:shadow-md transition'>
                <Edit className='h-4 w-4' />
              </span>
            </button>
          </div>
          <div className='flex flex-col items-start gap-1'>
            <h3 className='text-lg font-semibold'>{getUserDisplayName(user)}</h3>
            {/* Optionally add a settings icon here if needed */}
          </div>
        </div>
      </div>
      <div className='space-y-6'>
        <div>
          <Label htmlFor='fullName' className='text-base font-medium'>
            Full Name
          </Label>
          <Input id='fullName' value={fullName} onChange={(e) => setFullName(e.target.value)} className='mt-2' />
        </div>
        <div>
          <Label htmlFor='email' className='text-base font-medium'>
            Email ID
          </Label>
          <Input id='email' type='email' value={email} disabled className='mt-2' />
        </div>
        <div>
          <Label htmlFor='phone' className='text-base font-medium'>
            Phone Number
          </Label>
          <Input id='phone' value={phone} onChange={(e) => setPhone(e.target.value)} className='mt-2' />
        </div>
      </div>
      <div className='mt-8'>
        <Button
          variant='default'
          className='w-full bg-black text-white rounded-full py-3 text-base font-medium hover:bg-gray-900'
          onClick={() => signOut({ callbackUrl: mode === 'client' ? '/client/auth' : '/practitioner/auth' })}
        >
          Logout
        </Button>
      </div>
    </div>
  );
};
