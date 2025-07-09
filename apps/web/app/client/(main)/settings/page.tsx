'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/tabs';
import { Switch } from '@repo/ui/components/switch';
import { Trash2, Edit, Loader2, CheckCircle } from 'lucide-react';
import { useGetCurrentUser } from '@/lib/hooks/use-api';
import { getInitials, getAvatarUrl, getUserDisplayName } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import React, { useRef, useState } from 'react';

export default function ClientSettingsPage() {
  const { data: user, isLoading } = useGetCurrentUser();
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

  // Mocked data for Medical History and Notifications
  const [allergies, setAllergies] = useState(['Mindset', 'Growth', 'Positivity']);
  const [medicalHistory, setMedicalHistory] = useState(['OCD', 'Anxiety']);
  const [symptoms, setSymptoms] = useState(['Panic Attacks', 'Restlessness', 'Difficulty Concentrating']);
  const [medications, setMedications] = useState(['Benzodiazepines', 'Xanax', 'Klonopin']);
  const [notificationSettings, setNotificationSettings] = useState({
    emailReminders: true,
    practitionerMessages: true,
    engagementPrompts: false,
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

  const handleSaveChanges = () => {
    // TODO: Implement save logic
  };

  return (
    <div className='flex flex-col h-screen bg-background text-foreground'>
      <header className='flex flex-col gap-0 border-b bg-background px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4'>
        <div className='flex items-center justify-between gap-4'>
          <h1 className='text-xl font-bold tracking-tight sm:text-2xl'>Profile Settings</h1>
          <Button
            className='bg-foreground text-background hover:bg-foreground/90 rounded-md'
            onClick={handleSaveChanges}
          >
            Save Changes
          </Button>
        </div>
      </header>
      <main className='flex-1 overflow-y-auto p-4 sm:p-6 lg:px-8'>
        <Tabs defaultValue='profile' className='w-full'>
          <TabsList className='bg-muted p-1 rounded-lg inline-flex items-center'>
            <TabsTrigger
              value='profile'
              className='px-4 py-1.5 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm'
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value='medical'
              className='px-4 py-1.5 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm'
            >
              Medical History
            </TabsTrigger>
            <TabsTrigger
              value='notifications'
              className='px-4 py-1.5 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm'
            >
              Notifications
            </TabsTrigger>
          </TabsList>
          <TabsContent value='profile' className='mt-6'>
            <Card className='border border-border rounded-2xl shadow-none'>
              <CardContent className='p-6 sm:p-8'>
                <div className='max-w-4xl'>
                  <h2 className='text-lg font-semibold'>Profile Information</h2>
                  <p className='text-muted-foreground text-sm mt-1 mb-6'>Update your profile details</p>
                  {isLoading ? (
                    <div className='space-y-6'>
                      <div className='flex items-center space-x-4'>
                        <div className='h-20 w-20 rounded-full bg-muted animate-pulse' />
                        <div className='space-y-2'>
                          <div className='h-6 w-40 bg-muted rounded animate-pulse' />
                          <div className='h-4 w-52 bg-muted rounded animate-pulse' />
                        </div>
                      </div>
                    </div>
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
                            <Input id='email' type='email' value={email} disabled />
                          </div>
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='phone'>Phone Number</Label>
                          <Input id='phone' value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                      </div>
                      <div className='mt-8 pt-6 border-t'>
                        <Button
                          variant='default'
                          className='bg-foreground text-background hover:bg-foreground/90'
                          onClick={() => signOut({ callbackUrl: '/client/auth' })}
                        >
                          Logout
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className='text-red-500 text-center py-10'>Failed to load user profile.</div>
                  )}
                </div>
              </CardContent>
            </Card>
            <div className='mt-6 flex max-w-4xl'>
              <Button variant='destructive' className='bg-red-500/10 text-red-500 hover:bg-red-500/20'>
                <Trash2 className='h-4 w-4 mr-2' />
                Delete Account
              </Button>
            </div>
          </TabsContent>
          <TabsContent value='medical' className='mt-6'>
            <Card className='border border-border rounded-2xl shadow-none'>
              <CardContent className='p-6 sm:p-8'>
                <h2 className='text-lg font-semibold'>Medical History</h2>
                <p className='text-muted-foreground text-sm mt-1 mb-6'>Update your medical history</p>
                <div className='space-y-6'>
                  <div>
                    <Label>Known Allergies</Label>
                    <Input placeholder='Enter allergies' className='mb-2' />
                    <div className='flex flex-wrap gap-2 mt-2'>
                      {allergies.map((a, i) => (
                        <span key={i} className='px-3 py-1 rounded-full border text-xs'>
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Relevant Medical History</Label>
                    <Input placeholder='Enter medical history' className='mb-2' />
                    <div className='flex flex-wrap gap-2 mt-2'>
                      {medicalHistory.map((m, i) => (
                        <span key={i} className='px-3 py-1 rounded-full border text-xs'>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Current Symptoms</Label>
                    <Input placeholder='Enter current symptoms' className='mb-2' />
                    <div className='flex flex-wrap gap-2 mt-2'>
                      {symptoms.map((s, i) => (
                        <span key={i} className='px-3 py-1 rounded-full border text-xs'>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Current Medications</Label>
                    <Input placeholder='Enter current medications' className='mb-2' />
                    <div className='flex flex-wrap gap-2 mt-2'>
                      {medications.map((m, i) => (
                        <span key={i} className='px-3 py-1 rounded-full border text-xs'>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value='notifications' className='mt-6'>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
