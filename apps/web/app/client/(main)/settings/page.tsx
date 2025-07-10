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
import { UserProfileCard } from '@/components/UserProfileCard';

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
      setPhone(''); // Remove reference to user.phoneNumber for now
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
    <div className='flex flex-col h-screen bg-background text-foreground min-w-0'>
      <header className='flex flex-col gap-0 border-b bg-background px-3 sm:px-4 lg:px-6 xl:px-8 pt-3 sm:pt-4 lg:pt-6 pb-2 sm:pb-3 lg:pb-4'>
        <div className='flex items-center justify-between gap-3 sm:gap-4 min-w-0'>
          <h1 className='text-lg sm:text-xl lg:text-2xl font-bold tracking-tight truncate'>Profile Settings</h1>
          <Button
            className='bg-foreground text-background hover:bg-foreground/90 rounded-md text-sm sm:text-base px-3 sm:px-4 py-2'
            onClick={handleSaveChanges}
          >
            Save Changes
          </Button>
        </div>
      </header>
      <main className='flex-1 overflow-y-auto p-3 sm:p-4 lg:px-6 xl:px-8 min-w-0'>
        <Tabs defaultValue='profile' className='w-full'>
          <TabsList className='bg-muted p-1 rounded-lg inline-flex items-center w-full sm:w-auto'>
            <TabsTrigger
              value='profile'
              className='px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1 sm:flex-none'
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value='medical'
              className='px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1 sm:flex-none'
            >
              Medical History
            </TabsTrigger>
            <TabsTrigger
              value='notifications'
              className='px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1 sm:flex-none'
            >
              Notifications
            </TabsTrigger>
          </TabsList>
          <TabsContent value='profile' className='mt-4 sm:mt-6'>
            {user && (
              <div className='flex justify-center'>
                <div className='max-w-3xl w-full min-w-0'>
                  <UserProfileCard userId={user.id} mode='client' />
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value='medical' className='mt-4 sm:mt-6'>
            <Card className='border border-border rounded-xl sm:rounded-2xl shadow-none min-w-0'>
              <CardContent className='p-4 sm:p-6 lg:p-8'>
                <h2 className='text-base sm:text-lg font-semibold'>Medical History</h2>
                <p className='text-muted-foreground text-xs sm:text-sm mt-1 mb-4 sm:mb-6'>
                  Update your medical history
                </p>
                <div className='space-y-4 sm:space-y-6'>
                  <div>
                    <Label className='text-sm sm:text-base'>Known Allergies</Label>
                    <Input placeholder='Enter allergies' className='mb-2 text-sm sm:text-base' />
                    <div className='flex flex-wrap gap-2 mt-2'>
                      {allergies.map((a, i) => (
                        <span key={i} className='px-2 sm:px-3 py-1 rounded-full border text-xs'>
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className='text-sm sm:text-base'>Relevant Medical History</Label>
                    <Input placeholder='Enter medical history' className='mb-2 text-sm sm:text-base' />
                    <div className='flex flex-wrap gap-2 mt-2'>
                      {medicalHistory.map((m, i) => (
                        <span key={i} className='px-2 sm:px-3 py-1 rounded-full border text-xs'>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className='text-sm sm:text-base'>Current Symptoms</Label>
                    <Input placeholder='Enter current symptoms' className='mb-2 text-sm sm:text-base' />
                    <div className='flex flex-wrap gap-2 mt-2'>
                      {symptoms.map((s, i) => (
                        <span key={i} className='px-2 sm:px-3 py-1 rounded-full border text-xs'>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className='text-sm sm:text-base'>Current Medications</Label>
                    <Input placeholder='Enter current medications' className='mb-2 text-sm sm:text-base' />
                    <div className='flex flex-wrap gap-2 mt-2'>
                      {medications.map((m, i) => (
                        <span key={i} className='px-2 sm:px-3 py-1 rounded-full border text-xs'>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value='notifications' className='mt-4 sm:mt-6'>
            <Card className='border border-border rounded-xl sm:rounded-2xl shadow-none min-w-0'>
              <CardContent className='p-4 sm:p-6 lg:p-8'>
                <h2 className='text-base sm:text-lg font-semibold'>Email Notifications</h2>
                <p className='text-muted-foreground text-xs sm:text-sm mt-1 mb-4 sm:mb-6'>
                  Manage how you receive notifications
                </p>
                <div className='space-y-4 sm:space-y-6'>
                  <div className='flex items-center justify-between gap-3'>
                    <div className='min-w-0 flex-1'>
                      <Label htmlFor='emailReminders' className='font-medium text-sm sm:text-base'>
                        Email Reminders
                      </Label>
                      <p className='text-xs sm:text-sm text-muted-foreground'>
                        When your practitioner sends a new Action Plan or makes changes in tasks
                      </p>
                    </div>
                    <Switch
                      id='emailReminders'
                      checked={notificationSettings.emailReminders}
                      onCheckedChange={() => handleNotificationChange('emailReminders')}
                    />
                  </div>
                  <div className='flex items-center justify-between gap-3'>
                    <div className='min-w-0 flex-1'>
                      <Label htmlFor='practitionerMessages' className='font-medium text-sm sm:text-base'>
                        Practitioner Messages
                      </Label>
                      <p className='text-xs sm:text-sm text-muted-foreground'>When your practitioner messages you</p>
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
