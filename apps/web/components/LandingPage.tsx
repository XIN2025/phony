'use client';

import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Users } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className='min-h-screen bg-gradient-to-br from-background/50 to-muted/30 flex items-center justify-center p-4'>
      <motion.div
        className='w-full max-w-4xl mx-auto'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className='text-center mb-12'>
          <motion.h1
            className='text-4xl font-bold mb-4'
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Welcome to Continuum
          </motion.h1>
          <motion.p
            className='text-xl text-muted-foreground'
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Choose your role to get started
          </motion.p>
        </div>

        {/* Role Selection Cards */}
        <div className='grid md:grid-cols-2 gap-8 max-w-2xl mx-auto'>
          {/* Practitioner Card */}
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card className='h-full hover:shadow-lg transition-shadow'>
              <CardHeader className='text-center pb-4'>
                <div className='mx-auto mb-4 p-3 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center'>
                  <Users className='w-8 h-8 text-primary' />
                </div>
                <CardTitle className='text-2xl'>Practitioner</CardTitle>
                <CardDescription>Healthcare professionals, therapists, and counselors</CardDescription>
              </CardHeader>
              <CardContent className='text-center space-y-3'>
                <Button className='w-full' variant='default' onClick={() => router.push('/practitioner/auth')}>
                  Sign In
                </Button>
                <Button className='w-full' variant='outline' onClick={() => router.push('/practitioner/auth/signup')}>
                  Sign Up
                </Button>
                <p className='text-sm text-muted-foreground mt-3'>
                  Manage clients, record sessions, and create treatment plans
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Client Card */}
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <Card className='h-full hover:shadow-lg transition-shadow'>
              <CardHeader className='text-center pb-4'>
                <div className='mx-auto mb-4 p-3 bg-secondary/10 rounded-full w-16 h-16 flex items-center justify-center'>
                  <User className='w-8 h-8 text-secondary' />
                </div>
                <CardTitle className='text-2xl'>Client</CardTitle>
                <CardDescription>Patients and therapy clients</CardDescription>
              </CardHeader>
              <CardContent className='text-center'>
                <Button className='w-full' variant='secondary' onClick={() => router.push('/client/auth')}>
                  Sign In as Client
                </Button>
                <p className='text-sm text-muted-foreground mt-3'>
                  Access your treatment plans and communicate with your practitioner
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          className='text-center mt-12 text-sm text-muted-foreground'
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
