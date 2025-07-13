'use client';

import { SidebarToggleButton } from '@/components/practitioner/SidebarToggleButton';
import { useGetCurrentUser, useUpdateProfile } from '@/lib/hooks/use-api';
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

const validatePhoneNumber = (value: string): string => {
  return value.replace(/[^0-9+\-()\s]/g, '');
};

export default function ClientSettingsPage() {
  const { data: user, isLoading } = useGetCurrentUser();
  const updateProfileMutation = useUpdateProfile();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('profile');

  React.useEffect(() => {
    if (user) {
      setFullName(getUserDisplayName(user));
      setEmail(user.email || '');
      setPhone(user.phoneNumber || '');
    }
  }, [user]);

  // Medical History and Notifications from user data
  const [allergies, setAllergies] = useState<string[]>(user?.allergies || []);
  const [medicalHistory, setMedicalHistory] = useState<string[]>(user?.medicalHistory || []);
  const [symptoms, setSymptoms] = useState<string[]>(user?.symptoms || []);
  const [medications, setMedications] = useState<string[]>(user?.medications || []);
  const [notificationSettings, setNotificationSettings] = useState({
    emailReminders: user?.notificationSettings?.emailReminders ?? true,
    practitionerMessages: user?.notificationSettings?.practitionerMessages ?? true,
    engagementPrompts: user?.notificationSettings?.engagementPrompts ?? false,
    marketingEmails: user?.notificationSettings?.marketingEmails ?? false,
  });

  const handleNotificationChange = (key: keyof typeof notificationSettings) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addMedicalItem = (type: 'allergies' | 'medicalHistory' | 'symptoms' | 'medications', value: string) => {
    if (!value.trim()) return;

    switch (type) {
      case 'allergies':
        setAllergies((prev) => [...prev, value.trim()]);
        break;
      case 'medicalHistory':
        setMedicalHistory((prev) => [...prev, value.trim()]);
        break;
      case 'symptoms':
        setSymptoms((prev) => [...prev, value.trim()]);
        break;
      case 'medications':
        setMedications((prev) => [...prev, value.trim()]);
        break;
    }
  };

  const removeMedicalItem = (type: 'allergies' | 'medicalHistory' | 'symptoms' | 'medications', index: number) => {
    switch (type) {
      case 'allergies':
        setAllergies((prev) => prev.filter((_, i) => i !== index));
        break;
      case 'medicalHistory':
        setMedicalHistory((prev) => prev.filter((_, i) => i !== index));
        break;
      case 'symptoms':
        setSymptoms((prev) => prev.filter((_, i) => i !== index));
        break;
      case 'medications':
        setMedications((prev) => prev.filter((_, i) => i !== index));
        break;
    }
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
    if (!user) return;

    const formData = new FormData();

    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('phoneNumber', phone);
    formData.append('allergies', JSON.stringify(allergies));
    formData.append('medicalHistory', JSON.stringify(medicalHistory));
    formData.append('symptoms', JSON.stringify(symptoms));
    formData.append('medications', JSON.stringify(medications));
    formData.append('notificationSettings', JSON.stringify(notificationSettings));

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

  return (
    <div className='py-8 sm:py-12 px-4 sm:px-8 w-full'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-4'>
          <SidebarToggleButton />
          <h1 className='text-3xl font-semibold'>Profile Settings</h1>
        </div>
        <Button
          className='rounded-full px-6 py-2 text-base font-medium bg-black text-white hover:bg-gray-900 shadow-none'
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
        <div className='inline-flex bg-[#F6F6F6] border border-[#D9D9D9] rounded-full p-1'>
          <button
            className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-black text-white shadow-md' : 'bg-transparent text-black'}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${activeTab === 'medical' ? 'bg-black text-white shadow-md' : 'bg-transparent text-black'}`}
            onClick={() => setActiveTab('medical')}
          >
            Medical History
          </button>
          <button
            className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${activeTab === 'notifications' ? 'bg-black text-white shadow-md' : 'bg-transparent text-black'}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
        </div>
      </div>
      {activeTab === 'profile' && (
        <div className='w-full'>
          <div
            className='w-full rounded-xl border border-[#BDBDBD] bg-white mb-4'
            style={{ boxShadow: '0 0 0 0 transparent' }}
          >
            <div className='p-10'>
              <h2 className='text-xl font-semibold mb-1'>Profile Information</h2>
              <p className='text-gray-500 text-base mb-6'>Update your profile details</p>
              <div className='flex flex-row items-center gap-4 mb-8'>
                <div className='relative group'>
                  <button
                    type='button'
                    aria-label='Change profile picture'
                    onClick={handleAvatarClick}
                    className='focus:outline-none rounded-full transition-shadow focus:ring-2 focus:ring-black/30 hover:shadow-lg'
                    style={{ boxShadow: '0 0 0 0 transparent' }}
                  >
                    <Avatar className='h-20 w-20 border-2 border-gray-300'>
                      <AvatarImage src={avatarPreview || getAvatarUrl(user?.avatarUrl, user)} />
                      <AvatarFallback className='text-2xl'>
                        {getInitials({ firstName: user?.firstName, lastName: user?.lastName })}
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
                <div className='flex flex-col items-start gap-1'>
                  <h3 className='text-lg font-semibold'>{getUserDisplayName(user)}</h3>
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
              </div>
              <div className='flex justify-end mt-8'>
                <Button
                  variant='default'
                  className='bg-black text-white rounded-full px-8 py-3 text-base font-medium hover:bg-gray-900 w-auto'
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
          <div className='flex mb-4'>
            <Button
              variant='destructive'
              className='rounded-full px-6 py-2 text-base font-medium bg-[#FFE5E5] text-[#E54848] hover:bg-[#FFD6D6] ml-0'
              style={{ minWidth: '0', boxShadow: 'none' }}
            >
              Delete Account
            </Button>
          </div>
        </div>
      )}
      {activeTab === 'medical' && (
        <div className='w-full'>
          <div
            className='w-full rounded-xl border border-[#BDBDBD] bg-white mb-4'
            style={{ boxShadow: '0 0 0 0 transparent' }}
          >
            <div className='p-10'>
              <h2 className='text-xl font-semibold mb-2'>Medical History</h2>
              <p className='text-gray-500 text-base mb-6'>Update your medical history</p>
              <div className='space-y-6'>
                <div>
                  <Label htmlFor='allergies' className='text-base font-medium'>
                    Known Allergies
                  </Label>
                  <div className='flex gap-2 mt-2'>
                    <Input
                      id='allergies'
                      placeholder='Enter allergies'
                      className='flex-1'
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addMedicalItem('allergies', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <Button
                      type='button'
                      onClick={() => {
                        const input = document.getElementById('allergies') as HTMLInputElement;
                        addMedicalItem('allergies', input.value);
                        input.value = '';
                      }}
                      className='px-4'
                    >
                      Add
                    </Button>
                  </div>
                  <div className='flex flex-wrap gap-2 mt-2'>
                    {allergies.map((a, i) => (
                      <span
                        key={i}
                        className='px-3 py-1 rounded-full bg-gray-100 border border-gray-300 text-sm flex items-center gap-1'
                      >
                        {a}
                        <button
                          onClick={() => removeMedicalItem('allergies', i)}
                          className='text-red-500 hover:text-red-700'
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor='medicalHistory' className='text-base font-medium'>
                    Relevant Medical History
                  </Label>
                  <div className='flex gap-2 mt-2'>
                    <Input
                      id='medicalHistory'
                      placeholder='Enter medical history'
                      className='flex-1'
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addMedicalItem('medicalHistory', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <Button
                      type='button'
                      onClick={() => {
                        const input = document.getElementById('medicalHistory') as HTMLInputElement;
                        addMedicalItem('medicalHistory', input.value);
                        input.value = '';
                      }}
                      className='px-4'
                    >
                      Add
                    </Button>
                  </div>
                  <div className='flex flex-wrap gap-2 mt-2'>
                    {medicalHistory.map((m, i) => (
                      <span
                        key={i}
                        className='px-3 py-1 rounded-full bg-gray-100 border border-gray-300 text-sm flex items-center gap-1'
                      >
                        {m}
                        <button
                          onClick={() => removeMedicalItem('medicalHistory', i)}
                          className='text-red-500 hover:text-red-700'
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor='symptoms' className='text-base font-medium'>
                    Current Symptoms
                  </Label>
                  <div className='flex gap-2 mt-2'>
                    <Input
                      id='symptoms'
                      placeholder='Enter current symptoms'
                      className='flex-1'
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addMedicalItem('symptoms', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <Button
                      type='button'
                      onClick={() => {
                        const input = document.getElementById('symptoms') as HTMLInputElement;
                        addMedicalItem('symptoms', input.value);
                        input.value = '';
                      }}
                      className='px-4'
                    >
                      Add
                    </Button>
                  </div>
                  <div className='flex flex-wrap gap-2 mt-2'>
                    {symptoms.map((s, i) => (
                      <span
                        key={i}
                        className='px-3 py-1 rounded-full bg-gray-100 border border-gray-300 text-sm flex items-center gap-1'
                      >
                        {s}
                        <button
                          onClick={() => removeMedicalItem('symptoms', i)}
                          className='text-red-500 hover:text-red-700'
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor='medications' className='text-base font-medium'>
                    Current Medications
                  </Label>
                  <div className='flex gap-2 mt-2'>
                    <Input
                      id='medications'
                      placeholder='Enter current medications'
                      className='flex-1'
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addMedicalItem('medications', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <Button
                      type='button'
                      onClick={() => {
                        const input = document.getElementById('medications') as HTMLInputElement;
                        addMedicalItem('medications', input.value);
                        input.value = '';
                      }}
                      className='px-4'
                    >
                      Add
                    </Button>
                  </div>
                  <div className='flex flex-wrap gap-2 mt-2'>
                    {medications.map((m, i) => (
                      <span
                        key={i}
                        className='px-3 py-1 rounded-full bg-gray-100 border border-gray-300 text-sm flex items-center gap-1'
                      >
                        {m}
                        <button
                          onClick={() => removeMedicalItem('medications', i)}
                          className='text-red-500 hover:text-red-700'
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'notifications' && (
        <div className='w-full'>
          <div
            className='w-full rounded-xl border border-[#BDBDBD] bg-white mb-4'
            style={{ boxShadow: '0 0 0 0 transparent' }}
          >
            <div className='p-10'>
              <h2 className='text-xl font-semibold mb-2'>Email Notifications</h2>
              <p className='text-gray-500 text-base mb-6'>Manage how you receive notifications</p>
              <div className='space-y-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='font-medium'>Email Reminders</div>
                    <div className='text-gray-500 text-sm'>
                      When your practitioner sends a new Action Plan or makes changes in tasks
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.emailReminders}
                    onCheckedChange={() => handleNotificationChange('emailReminders')}
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='font-medium'>Practitioner Messages</div>
                    <div className='text-gray-500 text-sm'>When your practitioner messages you</div>
                  </div>
                  <Switch
                    checked={notificationSettings.practitionerMessages}
                    onCheckedChange={() => handleNotificationChange('practitionerMessages')}
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='font-medium'>Engagement Prompts</div>
                    <div className='text-gray-500 text-sm'>When your activity is low</div>
                  </div>
                  <Switch
                    checked={notificationSettings.engagementPrompts}
                    onCheckedChange={() => handleNotificationChange('engagementPrompts')}
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='font-medium'>Marketing Emails</div>
                    <div className='text-gray-500 text-sm'>News and feature updates</div>
                  </div>
                  <Switch
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
