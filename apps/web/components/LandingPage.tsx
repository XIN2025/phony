'use client';

import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Users } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className='min-h-screen bg-gradient-to-br from-background/50 to-muted/30 flex items-center justify-center p-4 sm:p-6 lg:p-8'>
      <motion.div
        className='w-full max-w-4xl mx-auto'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className='text-center mb-8 sm:mb-12'>
          <motion.h1
            className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4'
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Welcome to Continuum
          </motion.h1>
          <motion.p
            className='text-base sm:text-lg md:text-xl text-muted-foreground px-4'
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Choose your role to get started
          </motion.p>
        </div>

        {/* Role Selection Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-2xl mx-auto px-4 sm:px-0'>
          {/* Practitioner Card */}
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card className='h-full hover:shadow-lg transition-shadow'>
              <CardHeader className='text-center pb-4'>
                <div className='mx-auto mb-4 p-2 sm:p-3 bg-primary/10 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center'>
                  <Users className='w-6 h-6 sm:w-8 sm:h-8 text-primary' />
                </div>
                <CardTitle className='text-xl sm:text-2xl'>Practitioner</CardTitle>
                <CardDescription className='text-sm sm:text-base'>
                  Healthcare professionals, therapists, and counselors
                </CardDescription>
              </CardHeader>
              <CardContent className='text-center space-y-3 px-4 sm:px-6'>
                <Button className='w-full' variant='default' onClick={() => router.push('/practitioner/auth')}>
                  Sign In
                </Button>
                <Button className='w-full' variant='outline' onClick={() => router.push('/practitioner/auth/signup')}>
                  Sign Up
                </Button>
                <p className='text-xs sm:text-sm text-muted-foreground mt-3'>
                  Manage clients, record sessions, and create treatment plans
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Client Card */}
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <Card className='h-full hover:shadow-lg transition-shadow'>
              <CardHeader className='text-center pb-4'>
                <div className='mx-auto mb-4 p-2 sm:p-3 bg-secondary/10 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center'>
                  <User className='w-6 h-6 sm:w-8 sm:h-8 text-secondary' />
                </div>
                <CardTitle className='text-xl sm:text-2xl'>Client</CardTitle>
                <CardDescription className='text-sm sm:text-base'>Patients and therapy clients</CardDescription>
              </CardHeader>
              <CardContent className='text-center px-4 sm:px-6'>
                <Button className='w-full' variant='secondary' onClick={() => router.push('/client/auth')}>
                  Sign In as Client
                </Button>
                <p className='text-xs sm:text-sm text-muted-foreground mt-3'>
                  Access your treatment plans and communicate with your practitioner
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          className='text-center mt-8 sm:mt-12 text-xs sm:text-sm text-muted-foreground px-4'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p>Secure, HIPAA-compliant platform for healthcare professionals and their clients</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
