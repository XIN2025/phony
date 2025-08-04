'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/tabs';
import { User, Users } from 'lucide-react';
import Image from 'next/image';

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
        className='sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto bg-white border-0 shadow-2xl rounded-2xl overflow-hidden'
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <DialogHeader className='pb-2'>
          <DialogTitle
            className='text-center text-xl sm:text-2xl font-bold text-gray-900'
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            Welcome to Continuum
          </DialogTitle>
        </DialogHeader>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'practitioner' | 'client')}
          className='w-full px-6 pb-6'
        >
          <TabsList className='grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl'>
            <TabsTrigger
              value='practitioner'
              className='flex items-center gap-2 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-600'
            >
              <Users className='h-4 w-4' />
              <span className='hidden sm:inline'>Practitioner</span>
              <span className='sm:hidden'>Pro</span>
            </TabsTrigger>
            <TabsTrigger
              value='client'
              className='flex items-center gap-2 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-600'
            >
              <User className='h-4 w-4' />
              Client
            </TabsTrigger>
          </TabsList>

          <TabsContent value='practitioner' className='space-y-6 mt-6'>
            <div className='text-center space-y-4'>
              <p className='text-sm sm:text-base text-gray-600 leading-relaxed'>
                Access your practice dashboard and manage your clients
              </p>
              <div className='space-y-3'>
                <Button
                  onClick={handlePractitionerSignIn}
                  className='w-full text-white rounded-xl py-3 text-sm sm:text-base font-semibold transition-all duration-500 ease-in-out hover:scale-105'
                  style={{
                    background: 'linear-gradient(to right, #A5B7C8 0%, #E9ADA3 50%, #C87F94 100%)',
                    transition: 'all 0.5s ease-in-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      'linear-gradient(to right, #C87F94 0%, #E9ADA3 50%, #A5B7C8 100%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      'linear-gradient(to right, #A5B7C8 0%, #E9ADA3 50%, #C87F94 100%)';
                  }}
                >
                  Sign In
                </Button>
                <Button
                  onClick={handlePractitionerSignUp}
                  variant='outline'
                  className='w-full border-2 border-gray-300 text-gray-700 rounded-xl py-3 text-sm sm:text-base font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200'
                >
                  Sign Up
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value='client' className='space-y-6 mt-6'>
            <div className='text-center space-y-4'>
              <p className='text-sm sm:text-base text-gray-600 leading-relaxed'>
                Access your personalized plan and track your progress
              </p>
              <div className='space-y-3'>
                <Button
                  onClick={handleClientSignIn}
                  className='w-full text-white rounded-xl py-3 text-sm sm:text-base font-semibold transition-all duration-500 ease-in-out hover:scale-105'
                  style={{
                    background: 'linear-gradient(to right, #A5B7C8 0%, #E9ADA3 50%, #C87F94 100%)',
                    transition: 'all 0.5s ease-in-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      'linear-gradient(to right, #C87F94 0%, #E9ADA3 50%, #A5B7C8 100%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      'linear-gradient(to right, #A5B7C8 0%, #E9ADA3 50%, #C87F94 100%)';
                  }}
                >
                  Sign In
                </Button>
                <div className='bg-gray-50 rounded-lg p-3'>
                  <p className='text-xs sm:text-sm text-gray-500'>Client accounts are created by invitation only</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
