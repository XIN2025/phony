'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/tabs';
import { User, Users } from 'lucide-react';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthDialog({ isOpen, onClose }: AuthDialogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'practitioner' | 'client'>('practitioner');

  const handlePractitionerSignIn = () => {
    router.push('/practitioner/auth');
    onClose();
  };

  const handlePractitionerSignUp = () => {
    router.push('/practitioner/auth/signup');
    onClose();
  };

  const handleClientSignIn = () => {
    router.push('/client/auth');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className='sm:max-w-md fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] bg-white border border-gray-200 shadow-2xl'
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
        }}
      >
        <DialogHeader>
          <DialogTitle className='text-center text-xl font-semibold'>Welcome to Continuum</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'practitioner' | 'client')}
          className='w-full'
        >
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='practitioner' className='flex items-center gap-2'>
              <Users className='h-4 w-4' />
              Practitioner
            </TabsTrigger>
            <TabsTrigger value='client' className='flex items-center gap-2'>
              <User className='h-4 w-4' />
              Client
            </TabsTrigger>
          </TabsList>

          <TabsContent value='practitioner' className='space-y-4 mt-6'>
            <div className='text-center space-y-4'>
              <p className='text-sm text-gray-600'>Access your practice dashboard and manage your clients</p>
              <div className='space-y-3'>
                <Button
                  onClick={handlePractitionerSignIn}
                  className='w-full bg-[#807171] text-white rounded-full py-2 text-base font-semibold hover:bg-neutral-800 transition-all'
                >
                  Sign In
                </Button>
                <Button
                  onClick={handlePractitionerSignUp}
                  variant='outline'
                  className='w-full border-[#807171] text-[#807171] rounded-full py-2 text-base font-semibold hover:bg-[#807171] hover:text-white transition-all'
                >
                  Sign Up
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value='client' className='space-y-4 mt-6'>
            <div className='text-center space-y-4'>
              <p className='text-sm text-gray-600'>Access your personalized plan and track your progress</p>
              <div className='space-y-3'>
                <Button
                  onClick={handleClientSignIn}
                  className='w-full bg-[#807171] text-white rounded-full py-2 text-base font-semibold hover:bg-neutral-800 transition-all'
                >
                  Sign In
                </Button>
                <p className='text-xs text-gray-500'>Client accounts are created by invitation only</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
