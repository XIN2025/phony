'use client';

import { useGetCurrentUser, useUpdateProfile, useDeleteAccount } from '@/lib/hooks/use-api';
import { getAvatarUrl, getInitials, getUserDisplayName } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Switch } from '@repo/ui/components/switch';
import { Edit, Loader2 } from 'lucide-react';
import { signOut, getSession } from 'next-auth/react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@repo/ui/components/alert-dialog';
import { Calendar } from '@repo/ui/components/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/popover';

const validatePhoneNumber = (value: string): string => {
  return value.replace(/[^0-9+\-()\s]/g, '');
};

export default function ClientSettingsPage() {
  const { data: currentUser } = useGetCurrentUser();
  const updateProfileMutation = useUpdateProfile();
  const queryClient = useQueryClient();
  const deleteAccountMutation = useDeleteAccount();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [dob, setDob] = useState(currentUser && 'dob' in currentUser && currentUser.dob ? currentUser.dob : '');
  const [profession, setProfession] = useState(currentUser?.profession || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  React.useEffect(() => {
    if (currentUser) {
      setFullName(getUserDisplayName(currentUser));
      setEmail(currentUser.email || '');
      setPhone(currentUser.phoneNumber || '');
      setDob(currentUser.dob || '');
      setProfession(currentUser.profession || '');
    }
  }, [currentUser]);

  const [notificationSettings, setNotificationSettings] = useState({
    emailReminders: currentUser?.notificationSettings?.emailReminders ?? true,
    practitionerMessages: currentUser?.notificationSettings?.practitionerMessages ?? true,
    engagementPrompts: currentUser?.notificationSettings?.engagementPrompts ?? false,
    marketingEmails: currentUser?.notificationSettings?.marketingEmails ?? false,
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validatedValue = validatePhoneNumber(e.target.value);
    setPhone(validatedValue);
  };

  const handleSaveChanges = async () => {
    if (!currentUser) return;

    const formData = new FormData();

    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('phoneNumber', phone);
    formData.append('notificationSettings', JSON.stringify(notificationSettings));
    if (currentUser?.role === 'CLIENT') {
      formData.append('dob', String(dob || ''));
      formData.append('profession', String(profession || ''));
    }

    if (avatarFile) {
      formData.append('profileImage', avatarFile);
    }

    updateProfileMutation.mutate(formData, {
      onSuccess: () => {
        toast.success('Profile updated successfully');
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      },
      onError: () => {
        toast.error('Failed to update profile');
      },
    });
  };

  const handleDeleteAccount = async () => {
    deleteAccountMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Account deleted successfully');
        setDeleteDialogOpen(false);
        signOut({ callbackUrl: '/' });
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.error || 'Failed to delete account');
      },
    });
  };

  return (
    <div className='pt-6 sm:pt-8 lg:pt-10 px-4 sm:px-8 w-full'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-4'>
          <h1
            className='mb-2 sm:mb-0 truncate text-2xl lg:text-3xl font-bold xl:text-4xl font-serif font-normal'
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            <span className='block sm:hidden font-bold ' style={{ fontFamily: "'DM Serif Display', serif" }}>
              Profile
              <br />
              Settings
            </span>
            <span className='hidden sm:inline font-bold' style={{ fontFamily: "'DM Serif Display', serif" }}>
              Profile Settings
            </span>
          </h1>
        </div>
        <Button
          className='bg-foreground bg-[#807171] text-background hover:bg-foreground/90 rounded-full px-6'
          onClick={handleSaveChanges}
          disabled={updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
      <div className='mb-8 w-full'>
        <div className='flex flex-row w-full sm:w-fit bg-[#f6f5f4] border p-1 border-[#d1d1d1] rounded-full mb-6 overflow-x-auto whitespace-nowrap'>
          {[
            { key: 'profile', label: 'Profile' },
            { key: 'notifications', label: 'Notifications' },
          ].map((tab) => (
            <button
              key={tab.key}
              type='button'
              onClick={() => setActiveTab(tab.key)}
              className={`text-center rounded-full p-1 px-8 py-2 text-base font-normal transition-colors w-full sm:w-auto flex-1 sm:flex-none ${activeTab === tab.key ? 'bg-[#D1CCE9] text-black font-semibold shadow-none' : 'bg-transparent text-[#b0acae]'}`}
              aria-selected={activeTab === tab.key}
              tabIndex={0}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {activeTab === 'profile' && (
        <div className='w-full'>
          <div
            className='w-full rounded-xl border border-[#BDBDBD] bg-white mb-4'
            style={{ boxShadow: '0 0 0 0 transparent' }}
          >
            <div className='p-4 sm:p-10'>
              <h2 className='text-xl font-semibold mb-1' style={{ fontFamily: "'DM Serif Display', serif" }}>
                Profile Information
              </h2>
              <p className='text-gray-500 text-base mb-6'>Update your profile details</p>
              <div className='flex flex-col sm:flex-row items-center gap-4 mb-8'>
                <div className='relative group'>
                  <button
                    type='button'
                    aria-label='Change profile picture'
                    onClick={handleAvatarClick}
                    className='focus:outline-none rounded-full transition-shadow focus:ring-2 focus:ring-black/30 hover:shadow-lg'
                    style={{ boxShadow: '0 0 0 0 transparent' }}
                  >
                    <Avatar className='h-20 w-20 border-2 border-gray-300'>
                      <AvatarImage src={avatarPreview || getAvatarUrl(currentUser?.avatarUrl, currentUser)} />
                      <AvatarFallback className='text-2xl'>
                        {getInitials({ firstName: currentUser?.firstName, lastName: currentUser?.lastName })}
                      </AvatarFallback>
                    </Avatar>
                    <input
                      type='file'
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className='hidden'
                      accept='image/*'
                    />
                    <span className='absolute bottom-1 right-1 bg-white border border-gray-300 rounded-full p-1.5 shadow group-hover:shadow-md transition flex items-center justify-center'>
                      <Edit className='h-4 w-4 text-gray-700' />
                    </span>
                  </button>
                </div>
                <div className='flex flex-col items-start gap-1 mt-2 sm:mt-0'>
                  <h3
                    className='text-base sm:text-lg font-semibold'
                    style={{ fontFamily: "'DM Serif Display', serif" }}
                  >
                    {getUserDisplayName(currentUser)}
                  </h3>
                </div>
              </div>
              <div className='space-y-6'>
                <div>
                  <Label htmlFor='fullName' className='text-base font-medium'>
                    Full Name
                  </Label>
                  <Input
                    id='fullName'
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className='mt-2'
                  />
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
                  <Input id='phone' value={phone} onChange={handlePhoneChange} className='mt-2' />
                </div>
                {currentUser?.role === 'CLIENT' && (
                  <>
                    <div>
                      <Label htmlFor='dob' className='text-base font-medium'>
                        Date of Birth
                      </Label>
                      <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                        <PopoverTrigger asChild>
                          <Input
                            id='dob'
                            placeholder='Date of Birth'
                            value={dob}
                            readOnly
                            onClick={() => setShowCalendar(true)}
                            className='mt-2 text-left pl-3 pr-10'
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
                    <div>
                      <Label htmlFor='profession' className='text-base font-medium'>
                        Occupation
                      </Label>
                      <Input
                        id='profession'
                        value={String(profession || '')}
                        onChange={(e) => setProfession(e.target.value)}
                        className='mt-2'
                      />
                    </div>
                  </>
                )}
              </div>
              <div className='flex justify-end mt-8'>
                <Button
                  className='bg-[#807171] text-white rounded-full px-6 py-3 text-base font-medium hover:bg-[#6e625c] w-auto'
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant='destructive'
                className='rounded-full px-6 py-2 text-base font-medium bg-[#FFE5E5] text-[#E54848] hover:bg-[#FFD6D6] ml-0'
                style={{ minWidth: '0', boxShadow: 'none' }}
                disabled={deleteAccountMutation.isPending}
              >
                {deleteAccountMutation.isPending ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Account</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete your account? This action cannot be undone and all your data will be
                  permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteAccountMutation.isPending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className='bg-destructive text-white hover:bg-destructive/10'
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountMutation.isPending}
                >
                  {deleteAccountMutation.isPending ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Deleting...
                    </>
                  ) : (
                    'Delete Account'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
      {activeTab === 'notifications' && (
        <div className='w-full'>
          <div
            className='w-full rounded-xl border border-[#BDBDBD] bg-white mb-4'
            style={{ boxShadow: '0 0 0 0 transparent' }}
          >
            <div className='p-6 sm:p-8'>
              <h2 className='text-xl font-semibold mb-2' style={{ fontFamily: "'DM Serif Display', serif" }}>
                Email Notifications
              </h2>
              <p className='text-gray-500 text-base mb-6'>Manage how you receive notifications</p>
              <div className='space-y-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <Label htmlFor='emailReminders' className='font-medium'>
                      Email Reminders
                    </Label>
                    <p className='text-sm text-muted-foreground'>
                      When your practitioner sends a new Action Plan or makes changes in tasks
                    </p>
                  </div>
                  <Switch
                    id='emailReminders'
                    checked={notificationSettings.emailReminders}
                    onCheckedChange={() => handleNotificationChange('emailReminders')}
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <div>
                    <Label htmlFor='practitionerMessages' className='font-medium'>
                      Practitioner Messages
                    </Label>
                    <p className='text-sm text-muted-foreground'>When your practitioner messages you</p>
                  </div>
                  <Switch
                    id='practitionerMessages'
                    checked={notificationSettings.practitionerMessages}
                    onCheckedChange={() => handleNotificationChange('practitionerMessages')}
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <div>
                    <Label htmlFor='engagementPrompts' className='font-medium'>
                      Engagement Prompts
                    </Label>
                    <p className='text-sm text-muted-foreground'>When your activity is low</p>
                  </div>
                  <Switch
                    id='engagementPrompts'
                    checked={notificationSettings.engagementPrompts}
                    onCheckedChange={() => handleNotificationChange('engagementPrompts')}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
