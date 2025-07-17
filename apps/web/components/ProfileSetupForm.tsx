'use client';

import React, { useState, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Loader2, Upload, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useCompleteProfile } from '@/lib/hooks/use-api';
import { getInitials, getAvatarUrl } from '@/lib/utils';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileSetupFormProps {
  onSuccess?: () => void;
  stepper?: ReactNode;
}

export function ProfileSetupForm({ onSuccess, stepper }: ProfileSetupFormProps) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // React Query hook
  const completeProfileMutation = useCompleteProfile();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: session?.user?.firstName || '',
      lastName: session?.user?.lastName || '',
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  async function onSubmit(data: ProfileFormData) {
    if (!session?.user) {
      toast.error('No user session found');
      return;
    }

    const formData = new FormData();
    formData.append('firstName', data.firstName);
    formData.append('lastName', data.lastName || '');
    if (selectedFile) {
      formData.append('avatar', selectedFile);
    }

    completeProfileMutation.mutate(formData, {
      onSuccess: async (updatedUser) => {
        await update({
          ...session,
          user: {
            ...session.user,
            ...(updatedUser && typeof updatedUser === 'object' ? updatedUser : {}),
          },
        });

        toast.success('Profile updated successfully');

        if (onSuccess) {
          onSuccess();
        } else {
          const redirectTo = session.user.role === 'CLIENT' ? '/client' : '/practitioner';
          router.push(redirectTo);
        }
      },
      onError: (error: any) => {
        toast.error(error.message ?? 'Failed to complete profile setup');
      },
    });
  }

  const currentInitials = React.useMemo(() => {
    const firstName = form.watch('firstName') || session?.user?.firstName || '';
    const lastName = form.watch('lastName') || session?.user?.lastName || '';
    return getInitials(`${firstName} ${lastName}`);
  }, [form.watch('firstName'), form.watch('lastName'), session?.user]);

  if (!session?.user) {
    return (
      <Card className='w-full max-w-md'>
        <CardContent className='flex items-center justify-center p-8'>
          <Loader2 className='h-8 w-8 animate-spin' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='w-full max-w-md'>
      <CardHeader className='text-center'>
        <CardTitle>Complete Your Profile</CardTitle>
        <p className='text-sm text-muted-foreground'>Let's get your profile set up so you can get started</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <div className='flex flex-col items-center space-y-4'>
            <div className='relative'>
              <Avatar className='h-24 w-24'>
                <AvatarImage src={previewUrl || getAvatarUrl(session.user.avatarUrl)} />
                <AvatarFallback className='text-lg'>{currentInitials}</AvatarFallback>
              </Avatar>
              <Button
                type='button'
                size='icon'
                variant='secondary'
                className='absolute -bottom-2 -right-2 h-8 w-8 rounded-full'
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                <Camera className='h-4 w-4' />
              </Button>
            </div>

            <div className='text-center'>
              <Label
                htmlFor='avatar-upload'
                className='cursor-pointer text-sm text-muted-foreground hover:text-foreground'
              >
                <Upload className='h-4 w-4 inline mr-1' />
                Upload Profile Picture
              </Label>
              <input id='avatar-upload' type='file' accept='image/*' onChange={handleFileSelect} className='hidden' />
              <p className='text-xs text-muted-foreground mt-1'>Max size: 5MB. JPG, PNG, GIF</p>
            </div>
          </div>

          <div className='space-y-4'>
            <div>
              <Label htmlFor='firstName'>First Name</Label>
              <Input id='firstName' {...form.register('firstName')} placeholder='Enter your first name' />
              {form.formState.errors.firstName && (
                <p className='text-sm text-destructive mt-1'>{form.formState.errors.firstName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor='lastName'>Last Name</Label>
              <Input id='lastName' {...form.register('lastName')} placeholder='Enter your last name' />
              {form.formState.errors.lastName && (
                <p className='text-sm text-destructive mt-1'>{form.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>
          {stepper}
          <Button type='submit' className='w-full' disabled={completeProfileMutation.isPending}>
            {completeProfileMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Complete Profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
