'use client';

import React, { useState } from 'react';
import { Button } from '@repo/ui/components/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthLayout, AuthHeader } from '@repo/ui/components/auth-layout';
import { useEffect } from 'react';

export default function ResponseSentPage() {
  const router = useRouter();
  // Only need a single effect for the 2-second success screen and redirect
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const justSubmitted = localStorage.getItem('intakeJustSubmitted');
    if (justSubmitted === 'true') {
      console.log('[ResponseSentPage] Showing success screen for 2 seconds');
      const timer = setTimeout(() => {
        localStorage.removeItem('intakeJustSubmitted');
        console.log('[ResponseSentPage] Redirecting to /client after 2 seconds');
        router.replace('/client');
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      // If user lands here without submitting intake, redirect immediately
      console.log('[ResponseSentPage] No intakeJustSubmitted flag, redirecting to /client immediately');
      router.replace('/client');
    }
  }, [router]);

  // Only show the success UI, no buttons or extra logic
  return (
    <div className='min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#F8F3F1] via-[#F8F3F1] to-[#E6EAEE]'>
      <div className='flex flex-col items-center justify-center'>
        <div className='flex items-center justify-center w-32 h-32 rounded-full bg-[#C2B6B0]/30 mb-3'>
          <div className='flex items-center justify-center w-20 h-20 rounded-full bg-[#807171]'>
            <svg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <circle cx='20' cy='20' r='18' stroke='white' strokeWidth='2' fill='none' />
              <path
                d='M13 20L18 25L27 16'
                stroke='white'
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </div>
        </div>
        <div className='text-[#807171] text-lg font-medium '>Response Sent</div>
        <div
          className='text-2xl sm:text-3xl font-serif font-semibold'
          style={{ fontFamily: 'DM Serif Display, serif', color: '#807171' }}
        >
          Welcome to Continuum!
        </div>
      </div>
    </div>
  );
}
