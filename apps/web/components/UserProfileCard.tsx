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
  const [profession, setProfession] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (user) {
      setFullName(getUserDisplayName(user));
      setEmail(user.email || '');
      setProfession(user.profession || '');
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
    <div className='w-full bg-transparent min-w-0'>
      <h2 className='text-base sm:text-lg font-semibold mb-1'>Profile Information</h2>
      <p className='text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6'>Update your profile details</p>
      <div className='flex flex-col sm:flex-row items-center gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8'>
        <div className='relative group'>
          <button
            type='button'
            aria-label='Change profile picture'
            onClick={handleAvatarClick}
            className='focus:outline-none rounded-full transition-shadow focus:ring-2 focus:ring-black/30 hover:shadow-lg'
            style={{ boxShadow: '0 0 0 0 transparent' }}
          >
            <Avatar className='h-16 w-16 sm:h-20 sm:w-20 border-2 border-primary'>
              <AvatarImage src={avatarPreview || getAvatarUrl(user.avatarUrl, user)} />
              <AvatarFallback className='text-lg sm:text-2xl'>
                {getInitials({ firstName: user.firstName, lastName: user.lastName })}
              </AvatarFallback>
            </Avatar>
            <input type='file' ref={fileInputRef} onChange={handleFileChange} className='hidden' accept='image/*' />
            <span className='absolute bottom-0 right-0 bg-background border rounded-full p-1 sm:p-1.5 shadow-sm group-hover:shadow-md transition'>
              <Edit className='h-3 w-3 sm:h-3.5 sm:w-3.5' />
            </span>
          </button>
        </div>
        <div className='flex items-center gap-2 min-w-0'>
          <h3 className='text-base sm:text-lg font-semibold truncate'>{getUserDisplayName(user)}</h3>
          {user.isEmailVerified && <CheckCircle className='h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0' />}
        </div>
      </div>
      <div className='space-y-4 sm:space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'>
          <div className='space-y-2'>
            <Label htmlFor='fullName' className='text-sm sm:text-base'>
              Full Name
            </Label>
            <Input
              id='fullName'
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className='text-sm sm:text-base'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='email' className='text-sm sm:text-base'>
              Email ID
            </Label>
            <Input id='email' type='email' value={email} disabled className='text-sm sm:text-base' />
          </div>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='profession' className='text-sm sm:text-base'>
            Profession
          </Label>
          <Input
            id='profession'
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            className='text-sm sm:text-base'
          />
        </div>
        {/* Add more fields as needed, e.g., verification proof, etc. */}
      </div>
      <div className='mt-6 sm:mt-8 pt-4 sm:pt-6 border-t flex flex-col sm:flex-row gap-3 sm:gap-4 min-w-0'>
        <Button
          variant='default'
          className='bg-foreground text-background hover:bg-foreground/90 text-sm sm:text-base'
          onClick={() => signOut({ callbackUrl: mode === 'client' ? '/client/auth' : '/practitioner/auth' })}
        >
          Logout
        </Button>
        <Button variant='destructive' className='bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm sm:text-base'>
          <Trash2 className='h-4 w-4 mr-2' />
          Delete Account
        </Button>
        <Button
          className='sm:ml-auto bg-black text-white rounded-full px-4 sm:px-6 py-2 text-sm sm:text-base'
          onClick={handleSaveChanges}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};
