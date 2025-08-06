'use client';

import { useGetCurrentUser, useUpdateProfile, useDeleteAccount, useUpdateTrackingSettings } from '@/lib/hooks/use-api';
import { getAvatarUrl, getInitials, getUserDisplayName } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Switch } from '@repo/ui/components/switch';
import { Edit, Loader2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
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
  const updateTrackingMutation = useUpdateTrackingSettings();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [dob, setDob] = useState(currentUser && 'dob' in currentUser && currentUser.dob ? currentUser.dob : '');
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
      setTrackingEnabled(currentUser.trackingEnabled ?? true);
    }
  }, [currentUser]);

  const [notificationSettings, setNotificationSettings] = useState({
    emailReminders: currentUser?.notificationSettings?.emailReminders ?? true,
    practitionerMessages: currentUser?.notificationSettings?.practitionerMessages ?? true,
    engagementPrompts: currentUser?.notificationSettings?.engagementPrompts ?? false,
    marketingEmails: currentUser?.notificationSettings?.marketingEmails ?? false,
  });

  const [trackingEnabled, setTrackingEnabled] = useState(currentUser?.trackingEnabled ?? true);

  const handleNotificationChange = (key: keyof typeof notificationSettings) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTrackingToggle = () => {
    const newValue = !trackingEnabled;
    setTrackingEnabled(newValue);
    updateTrackingMutation.mutate(newValue, {
      onSuccess: () => {
        toast.success(`Progress tracking ${newValue ? 'enabled' : 'disabled'} successfully`);
      },
      onError: () => {
        toast.error('Failed to update tracking settings');
        setTrackingEnabled(!newValue);
      },
    });
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
      onError: (error: unknown) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
              'Failed to delete account';
        toast.error(errorMessage);
      },
    });
  };

  return (
    <div className='pt-6 sm:pt-8 lg:pt-10 px-4 sm:px-8 w-full'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-4'>
          <h1
            className='mb-2 sm:mb-0 truncate text-2xl lg:text-3xl font-bold xl:text-4xl'
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            <span className='block sm:hidden' style={{ fontFamily: "'DM Serif Display', serif" }}>
              Profile
              <br />
              Settings
            </span>
            <span className='hidden sm:inline' style={{ fontFamily: "'DM Serif Display', serif" }}>
              Profile Settings
            </span>
          </h1>
        </div>
        <Button
          className='bg-[#807171] text-background hover:bg-[#807171]/90 rounded-full px-6'
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
            { key: 'privacy', label: 'Privacy' },
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
                  <button
                    type='button'
                    onClick={() => handleNotificationChange('emailReminders')}
                    className={`
                      relative inline-flex w-12 h-6 rounded-full transition-all duration-300 ease-in-out
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      shadow-inner border-2
                      ${
                        notificationSettings.emailReminders
                          ? 'bg-green-500 border-green-400'
                          : 'bg-gray-300 border-gray-300'
                      }
                      cursor-pointer
                    `}
                    aria-pressed={notificationSettings.emailReminders}
                    aria-label='Toggle email reminders'
                  >
                    <span
                      className={`
                        inline-block w-4 h-4 bg-white rounded-full shadow-md
                        transition-transform duration-300 ease-in-out
                        transform
                        ${notificationSettings.emailReminders ? 'translate-x-6' : 'translate-x-0.5'}
                        mt-0.5 ml-0.5
                      `}
                    />
                  </button>
                </div>
                <div className='flex items-center justify-between'>
                  <div>
                    <Label htmlFor='practitionerMessages' className='font-medium'>
                      Practitioner Messages
                    </Label>
                    <p className='text-sm text-muted-foreground'>When your practitioner messages you</p>
                  </div>
                  <button
                    type='button'
                    onClick={() => handleNotificationChange('practitionerMessages')}
                    className={`
                      relative inline-flex w-12 h-6 rounded-full transition-all duration-300 ease-in-out
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      shadow-inner border-2
                      ${
                        notificationSettings.practitionerMessages
                          ? 'bg-green-500 border-green-400'
                          : 'bg-gray-300 border-gray-300'
                      }
                      cursor-pointer
                    `}
                    aria-pressed={notificationSettings.practitionerMessages}
                    aria-label='Toggle practitioner messages'
                  >
                    <span
                      className={`
                        inline-block w-4 h-4 bg-white rounded-full shadow-md
                        transition-transform duration-300 ease-in-out
                        transform
                        ${notificationSettings.practitionerMessages ? 'translate-x-6' : 'translate-x-0.5'}
                        mt-0.5 ml-0.5
                      `}
                    />
                  </button>
                </div>
                <div className='flex items-center justify-between'>
                  <div>
                    <Label htmlFor='engagementPrompts' className='font-medium'>
                      Engagement Prompts
                    </Label>
                    <p className='text-sm text-muted-foreground'>When your activity is low</p>
                  </div>
                  <button
                    type='button'
                    onClick={() => handleNotificationChange('engagementPrompts')}
                    className={`
                      relative inline-flex w-12 h-6 rounded-full transition-all duration-300 ease-in-out
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      shadow-inner border-2
                      ${
                        notificationSettings.engagementPrompts
                          ? 'bg-green-500 border-green-400'
                          : 'bg-gray-300 border-gray-300'
                      }
                      cursor-pointer
                    `}
                    aria-pressed={notificationSettings.engagementPrompts}
                    aria-label='Toggle engagement prompts'
                  >
                    <span
                      className={`
                        inline-block w-4 h-4 bg-white rounded-full shadow-md
                        transition-transform duration-300 ease-in-out
                        transform
                        ${notificationSettings.engagementPrompts ? 'translate-x-6' : 'translate-x-0.5'}
                        mt-0.5 ml-0.5
                      `}
                    />
                  </button>
                </div>
                <div className='flex items-center justify-between'>
                  <div>
                    <Label htmlFor='marketingEmails' className='font-medium'>
                      Marketing Emails
                    </Label>
                    <p className='text-sm text-muted-foreground'>News and feature updates</p>
                  </div>
                  <button
                    type='button'
                    onClick={() => handleNotificationChange('marketingEmails')}
                    className={`
                      relative inline-flex w-12 h-6 rounded-full transition-all duration-300 ease-in-out
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      shadow-inner border-2
                      ${
                        notificationSettings.marketingEmails
                          ? 'bg-green-500 border-green-400'
                          : 'bg-gray-300 border-gray-300'
                      }
                      cursor-pointer
                    `}
                    aria-pressed={notificationSettings.marketingEmails}
                    aria-label='Toggle marketing emails'
                  >
                    <span
                      className={`
                        inline-block w-4 h-4 bg-white rounded-full shadow-md
                        transition-transform duration-300 ease-in-out
                        transform
                        ${notificationSettings.marketingEmails ? 'translate-x-6' : 'translate-x-0.5'}
                        mt-0.5 ml-0.5
                      `}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'privacy' && (
        <div className='w-full'>
          {/* Privacy Settings Card - Matching other tabs styling */}
          <div
            className='w-full rounded-xl border border-[#BDBDBD] bg-white mb-4'
            style={{ boxShadow: '0 0 0 0 transparent' }}
          >
            <div className='p-4 sm:p-10'>
              {/* Header */}
              <div className='flex items-center gap-3 mb-6'>
                <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center'>
                  <svg className='w-5 h-5 text-white' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div>
                  <h2 className='text-xl font-semibold mb-1' style={{ fontFamily: "'DM Serif Display', serif" }}>
                    Privacy & Progress Sharing
                  </h2>
                  <p className='text-gray-500 text-base'>
                    Control how your progress data is shared with your practitioner
                  </p>
                </div>
              </div>

              {/* Main Toggle Section */}
              <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-8'>
                <div className='flex flex-col lg:flex-row items-start gap-8'>
                  {/* Toggle Control */}
                  <div className='flex-shrink-0'>
                    <div className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm'>
                      <div className='text-center mb-6'>
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto transition-all duration-300 ${
                            trackingEnabled
                              ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-green-500/25'
                              : 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-md'
                          }`}
                        >
                          {trackingEnabled ? (
                            <svg className='w-8 h-8 text-white' fill='currentColor' viewBox='0 0 20 20'>
                              <path
                                fillRule='evenodd'
                                d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                clipRule='evenodd'
                              />
                            </svg>
                          ) : (
                            <svg className='w-8 h-8 text-white' fill='currentColor' viewBox='0 0 20 20'>
                              <path
                                fillRule='evenodd'
                                d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z'
                                clipRule='evenodd'
                              />
                            </svg>
                          )}
                        </div>

                        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                          {trackingEnabled ? 'Sharing Enabled' : 'Privacy Mode'}
                        </h3>
                        <p className='text-gray-600 text-sm mb-6'>
                          {trackingEnabled ? 'Your practitioner can see your progress' : 'Your data is kept private'}
                        </p>
                      </div>

                      {/* Toggle Switch */}
                      <div className='flex flex-col items-center gap-4'>
                        <div className='relative'>
                          <Switch
                            id='trackingEnabled'
                            checked={trackingEnabled}
                            onCheckedChange={handleTrackingToggle}
                            disabled={updateTrackingMutation.isPending}
                          />
                          {updateTrackingMutation.isPending && (
                            <div className='absolute inset-0 flex items-center justify-center bg-white/80 rounded-full'>
                              <div className='w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin'></div>
                            </div>
                          )}
                        </div>

                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                            trackingEnabled
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                              trackingEnabled ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          ></div>
                          {trackingEnabled ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Information Cards */}
                  <div className='flex-1 w-full'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      {/* When Enabled Card */}
                      <div
                        className={`bg-white rounded-xl p-5 border-2 transition-all duration-300 ${
                          trackingEnabled ? 'border-green-200 shadow-md shadow-green-100' : 'border-gray-100 opacity-75'
                        }`}
                      >
                        <div className='flex items-center gap-3 mb-4'>
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                              trackingEnabled ? 'bg-green-100' : 'bg-gray-100'
                            }`}
                          >
                            <svg
                              className={`w-4 h-4 transition-colors duration-300 ${
                                trackingEnabled ? 'text-green-600' : 'text-gray-400'
                              }`}
                              fill='currentColor'
                              viewBox='0 0 20 20'
                            >
                              <path
                                fillRule='evenodd'
                                d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                clipRule='evenodd'
                              />
                            </svg>
                          </div>
                          <span
                            className={`font-medium transition-colors duration-300 ${
                              trackingEnabled ? 'text-green-800' : 'text-gray-500'
                            }`}
                          >
                            When Enabled
                          </span>
                        </div>
                        <ul className='space-y-2'>
                          {[
                            'Task completion rates visible to practitioner',
                            'Journal entries accessible for better understanding',
                            'Progress summaries generated automatically',
                            'Enhanced support based on your engagement',
                          ].map((item, index) => (
                            <li key={index} className='flex items-start gap-2'>
                              <div
                                className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 transition-colors duration-300 ${
                                  trackingEnabled ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                              ></div>
                              <span
                                className={`text-sm transition-colors duration-300 ${
                                  trackingEnabled ? 'text-gray-700' : 'text-gray-500'
                                }`}
                              >
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* When Disabled Card */}
                      <div
                        className={`bg-white rounded-xl p-5 border-2 transition-all duration-300 ${
                          !trackingEnabled ? 'border-gray-300 shadow-md' : 'border-gray-100 opacity-75'
                        }`}
                      >
                        <div className='flex items-center gap-3 mb-4'>
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                              !trackingEnabled ? 'bg-gray-200' : 'bg-gray-100'
                            }`}
                          >
                            <svg
                              className={`w-4 h-4 transition-colors duration-300 ${
                                !trackingEnabled ? 'text-gray-600' : 'text-gray-400'
                              }`}
                              fill='currentColor'
                              viewBox='0 0 20 20'
                            >
                              <path
                                fillRule='evenodd'
                                d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                                clipRule='evenodd'
                              />
                            </svg>
                          </div>
                          <span
                            className={`font-medium transition-colors duration-300 ${
                              !trackingEnabled ? 'text-gray-800' : 'text-gray-500'
                            }`}
                          >
                            When Disabled
                          </span>
                        </div>
                        <ul className='space-y-2'>
                          {[
                            'Complete privacy for all your activities',
                            'Tasks and journals remain fully functional',
                            'No progress data shared with practitioner',
                            'Full app functionality maintained',
                          ].map((item, index) => (
                            <li key={index} className='flex items-start gap-2'>
                              <div
                                className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 transition-colors duration-300 ${
                                  !trackingEnabled ? 'bg-gray-500' : 'bg-gray-300'
                                }`}
                              ></div>
                              <span
                                className={`text-sm transition-colors duration-300 ${
                                  !trackingEnabled ? 'text-gray-700' : 'text-gray-500'
                                }`}
                              >
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Information Section */}
              <div className='bg-gray-50 border border-gray-200 rounded-xl p-6'>
                <div className='flex items-start gap-4'>
                  <div className='w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center flex-shrink-0'>
                    <svg className='w-5 h-5 text-white' fill='currentColor' viewBox='0 0 20 20'>
                      <path
                        fillRule='evenodd'
                        d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-2'>Your Data Security</h3>
                    <div className='space-y-3 text-sm text-gray-700'>
                      <p>
                        Your data is always encrypted and secure. This setting only controls what your current
                        practitioner can see.
                      </p>
                      <div className='flex items-center gap-2 text-xs text-gray-500'>
                        <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                          <path
                            fillRule='evenodd'
                            d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                            clipRule='evenodd'
                          />
                        </svg>
                        <span>You can change this setting at any time</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
