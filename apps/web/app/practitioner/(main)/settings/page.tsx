'use client';

import { PageHeader } from '@/components/PageHeader';
import { useGetCurrentUser, useUpdateProfile } from '@/lib/hooks/use-api';
import { getAvatarUrl, getFileUrl, getInitials, getUserDisplayName } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Switch } from '@repo/ui/components/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/tabs';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Edit, Loader2, Trash2, Upload } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';
import { cn } from '@repo/ui/lib/utils';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: user, isLoading, error } = useGetCurrentUser();
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();

  const [fullName, setFullName] = useState('');
  const [profession, setProfession] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [idProofFileName, setIdProofFileName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications'>('profile');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const idProofInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFullName(getUserDisplayName(user));
      setProfession(user.profession || '');
    }
  }, [user]);

  const [notificationSettings, setNotificationSettings] = React.useState({
    emailReminders: true,
    clientMessages: true,
    marketingEmails: false,
  });

  const handleNotificationChange = (key: keyof typeof notificationSettings) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  const handleIdProofClick = () => {
    idProofInputRef.current?.click();
  };

  const handleIdProofChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIdProofFile(file);
      setIdProofFileName(file.name);
    }
  };

  const handleSaveChanges = () => {
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ');

    const formData = new FormData();
    formData.append('firstName', firstName || '');
    formData.append('lastName', lastName || '');
    formData.append('profession', profession || '');
    if (avatarFile) {
      formData.append('profileImage', avatarFile);
    }
    if (idProofFile) {
      formData.append('idProof', idProofFile);
    }

    updateProfile(formData, {
      onSuccess: () => {
        toast.success('Profile updated successfully!');
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      },
      onError: () => {
        toast.error('Failed to update profile.');
      },
    });
  };

  const UserProfileSkeleton = () => (
    <div className='space-y-6'>
      <div className='flex items-center space-x-4'>
        <Skeleton className='h-20 w-20 rounded-full' />
        <div className='space-y-2'>
          <Skeleton className='h-6 w-40' />
          <Skeleton className='h-4 w-52' />
        </div>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 pt-4'>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-10 w-full' />
        </div>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-10 w-full' />
        </div>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-10 w-full' />
        </div>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-10 w-full' />
        </div>
      </div>
    </div>
  );

  return (
    <div className='flex flex-col bg-transparent text-foreground'>
      <PageHeader
        title={
          <>
            <span className='block sm:hidden ' style={{ fontFamily: "'DM Serif Display', serif" }}>
              Profile
              <br />
              Settings
            </span>
            <span className='hidden sm:inline' style={{ fontFamily: "'DM Serif Display', serif" }}>
              Profile Settings
            </span>
          </>
        }
        showBackButton={false}
        titleClassName='mb-2 sm:mb-0 truncate text-2xl lg:text-3xl xl:text-4xl'
        leftElement={<div className='sm:hidden'>{/*  */}</div>}
        rightElement={
          <Button
            className='bg-foreground text-background hover:bg-foreground/90 rounded-full px-6'
            onClick={handleSaveChanges}
            disabled={isUpdatingProfile}
          >
            {isUpdatingProfile && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
          </Button>
        }
      />
      <main className='flex-1 overflow-y-auto p-4 sm:p-6 lg:px-8'>
        {/* Dashboard-style tab bar */}
        <div className='flex flex-row gap-0 bg-[#f6f5f4] border border-[#d1d1d1] rounded-full w-full sm:w-fit mb-6 overflow-x-auto whitespace-nowrap max-w-xs mx-auto sm:mx-0'>
          {[
            { key: 'profile', label: 'Profile' },
            { key: 'notifications', label: 'Notifications' },
          ].map((tab) => (
            <button
              key={tab.key}
              type='button'
              onClick={() => setActiveTab(tab.key as 'profile' | 'notifications')}
              className={cn(
                'rounded-full px-8 py-3 text-base font-normal transition-colors',
                activeTab === tab.key
                  ? 'bg-[#c8c3c3] text-black font-semibold shadow-none'
                  : 'bg-transparent text-[#b0acae]',
              )}
              aria-selected={activeTab === tab.key}
              tabIndex={0}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Tab content */}
        {activeTab === 'profile' && (
          <>
            <Card className='border border-border rounded-2xl shadow-none'>
              <CardContent className='p-6 sm:p-8'>
                <div className='max-w-4xl'>
                  <h2 className='text-lg font-semibold'>Profile Information</h2>
                  <p className='text-muted-foreground text-sm mt-1 mb-6'>Update your profile details</p>
                  {isLoading ? (
                    <UserProfileSkeleton />
                  ) : user ? (
                    <>
                      <div className='flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-8'>
                        <div className='relative group'>
                          <Avatar className='h-20 w-20 border-2 border-primary'>
                            <AvatarImage src={avatarPreview || getAvatarUrl(user.avatarUrl, user)} />
                            <AvatarFallback className='text-2xl'>
                              {getInitials({ firstName: user.firstName, lastName: user.lastName })}
                            </AvatarFallback>
                          </Avatar>
                          <input
                            type='file'
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className='hidden'
                            accept='image/*'
                          />
                          <button
                            onClick={handleAvatarClick}
                            className='absolute bottom-0 right-0 bg-background border rounded-full p-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity'
                          >
                            <Edit className='h-3.5 w-3.5' />
                          </button>
                        </div>
                        <div className='flex items-center gap-2'>
                          <h3 className='text-lg font-semibold'>{getUserDisplayName(user)}</h3>
                          {user.isEmailVerified && <CheckCircle className='h-5 w-5 text-green-500' />}
                        </div>
                      </div>
                      <div className='space-y-6'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                          <div className='space-y-2'>
                            <Label htmlFor='fullName'>Full Name</Label>
                            <Input id='fullName' value={fullName} onChange={(e) => setFullName(e.target.value)} />
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor='email'>Email ID</Label>
                            <Input id='email' type='email' defaultValue={user.email} disabled />
                          </div>
                        </div>
                      </div>
                      <div className='space-y-6 mt-8'>
                        <div className='space-y-2'>
                          <Label>ID Proof</Label>
                          {user.idProofUrl && (
                            <div className='mb-2'>
                              <a
                                href={getFileUrl(user.idProofUrl)}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='underline text-blue-600'
                              >
                                View current ID Proof
                              </a>
                            </div>
                          )}
                          <input
                            type='file'
                            ref={idProofInputRef}
                            onChange={handleIdProofChange}
                            className='hidden'
                            accept='.pdf,image/*'
                          />
                          <Button variant='outline' type='button' onClick={handleIdProofClick}>
                            <Upload className='h-4 w-4 mr-2' />
                            {idProofFileName ? 'Change File' : 'Upload ID Proof'}
                          </Button>
                          {idProofFileName && (
                            <span className='text-xs text-green-600 mt-2'>Selected: {idProofFileName}</span>
                          )}
                        </div>
                      </div>
                      {/* Logout button for small screens inside the card */}
                      <div className=' mt-8'>
                        <Button
                          className='bg-foreground text-background hover:bg-foreground/90 rounded-full w-full sm:w-auto'
                          onClick={() => signOut({ callbackUrl: '/' })}
                        >
                          Logout
                        </Button>
                      </div>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
            <div className='mt-6 flex max-w-4xl'>
              <Button variant='destructive' className='bg-red-500/10 rounded-full text-red-500 hover:bg-red-500/20'>
                <Trash2 className='h-4 w-4 mr-2' />
                Delete Account
              </Button>
            </div>
          </>
        )}
        {activeTab === 'notifications' && (
          <Card className='border border-border rounded-2xl shadow-none'>
            <CardContent className='p-6 sm:p-8'>
              <h2 className='text-lg font-semibold'>Email Notifications</h2>
              <p className='text-muted-foreground text-sm mt-1 mb-6'>Manage how you receive notifications</p>
              <div className='space-y-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <Label htmlFor='emailReminders' className='font-medium'>
                      Email Reminders
                    </Label>
                    <p className='text-sm text-muted-foreground'>When a client accepts the invitation</p>
                  </div>
                  <Switch
                    id='emailReminders'
                    checked={notificationSettings.emailReminders}
                    onCheckedChange={() => handleNotificationChange('emailReminders')}
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <div>
                    <Label htmlFor='clientMessages' className='font-medium'>
                      Client Messages
                    </Label>
                    <p className='text-sm text-muted-foreground'>When a client messages you</p>
                  </div>
                  <Switch
                    id='clientMessages'
                    checked={notificationSettings.clientMessages}
                    onCheckedChange={() => handleNotificationChange('clientMessages')}
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <div>
                    <Label htmlFor='marketingEmails' className='font-medium'>
                      Marketing Emails
                    </Label>
                    <p className='text-sm text-muted-foreground'>News and feature updates</p>
                  </div>
                  <Switch
                    id='marketingEmails'
                    checked={notificationSettings.marketingEmails}
                    onCheckedChange={() => handleNotificationChange('marketingEmails')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
