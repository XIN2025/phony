'use client';
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Upload, User, CheckIcon, X } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useSendOtp, usePractitionerSignup } from '@/lib/hooks/use-api';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@repo/ui/components/input-otp';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select';

const signUpSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address.'),
  otp: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profession: z.string().optional(),
  profileImage: z.any().optional(),
  idProof: z.any().optional(),
  terms: z.boolean().optional(),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

const professions = ['Therapist', 'Counselor', 'Psychologist', 'Social Worker'];

export default function PractitionerSignUpPage() {
  const [step, setStep] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(0);
  const [profileData, setProfileData] = React.useState<{
    firstName: string;
    lastName: string;
    profession: string;
    profileImage?: File;
  } | null>(null);
  const [idProofFileName, setIdProofFileName] = React.useState<string | null>(null);
  const [profileImagePreview, setProfileImagePreview] = React.useState<string>('');
  const router = useRouter();
  const { status } = useSession();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const profileImageRef = React.useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = React.useState<File | null>(null);
  const [idProof, setIdProof] = React.useState<File | null>(null);

  React.useEffect(() => {
    if (status === 'authenticated') {
      router.push('/practitioner');
    }
  }, [status, router]);

  const { mutate: handleSendOTP, isPending: isSendingOTP } = useSendOtp();
  const { mutate: handleSignup, isPending: isSigningUp } = usePractitionerSignup();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      otp: '',
      firstName: '',
      lastName: '',
      profession: '',
      profileImage: null,
      terms: false,
    },
    mode: 'onBlur',
  });

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  };

  const completeSignUp = async () => {
    setIsLoading(true);
    const values = form.getValues();
    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('email', values.email!.trim().toLowerCase());
      formData.append('otp', values.otp!.trim());
      formData.append('role', 'PRACTITIONER');
      formData.append('firstName', profileData?.firstName || values.firstName!.trim());
      formData.append('lastName', profileData?.lastName || values.lastName!.trim());
      formData.append('profession', profileData?.profession || values.profession!);
      if (profileData?.profileImage || profileImage) {
        formData.append('profileImage', profileData?.profileImage || profileImage!);
      }
      handleSignup(formData, {
        onSuccess: async (response) => {
          toast.success('Account created successfully!');
          // Use the token from signup response for direct authentication
          const result = await signIn('credentials', {
            email: values.email!.trim().toLowerCase(),
            token: response.token,
            role: 'PRACTITIONER',
            redirect: false,
          });

          if (result?.error) {
            toast.error('Account created but login failed. Please log in manually.');
            router.push('/practitioner/auth');
          } else {
            router.push('/practitioner');
          }
        },
        onError: (error: Error) => {
          toast.error(error.message || 'Sign up failed.');
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepSubmit = async (values: SignUpFormValues) => {
    if (isLoading) return;

    switch (step) {
      case 1:
        if (!values.email?.trim()) {
          toast.error('Please enter a valid email address.');
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
          toast.error('Please enter a valid email address.');
          return;
        }
        handleSendOTP(
          { email: values.email.trim().toLowerCase() },
          {
            onSuccess: () => {
              toast.success('Verification code sent successfully.');
              startResendTimer();
              setStep(2);
            },
            onError: (error: Error) => {
              toast.error(error.message ?? 'Failed to send OTP. Please try again.');
            },
          },
        );
        break;
      case 2:
        if (!values.otp?.trim() || values.otp.trim().length !== 6) {
          toast.error('Please enter the 6-digit OTP.');
          return;
        }
        setStep(3);
        break;
      case 3:
        if (!values.firstName?.trim()) {
          toast.error('First name is required.');
          return;
        }
        if (!values.lastName?.trim()) {
          toast.error('Last name is required.');
          return;
        }
        if (!values.profession?.trim()) {
          toast.error('Profession is required.');
          return;
        }
        setProfileData({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          profession: values.profession.trim(),
          profileImage: values.profileImage,
        });
        setStep(4);
        break;
      case 4:
        if (!values.terms) {
          toast.error('You must agree to the terms and conditions.');
          return;
        }
        await completeSignUp();
        break;
      default:
        break;
    }
  };

  // Profile image upload handler
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
      form.setValue('profileImage', file);
    }
  };

  // ID proof upload handler
  const handleIdProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdProof(file);
      form.setValue('idProof', file);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div key='step1' className='space-y-6'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email ID</FormLabel>
                  <FormControl>
                    <Input placeholder='Your Email ID' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit' className='w-full' disabled={isSendingOTP}>
              {isSendingOTP && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Next
            </Button>
          </motion.div>
        );
      case 2:
        return (
          <motion.div key='step2' className='space-y-6'>
            <FormField
              control={form.control}
              name='otp'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputOTP {...field} maxLength={6}>
                      <InputOTPGroup className='w-full justify-center gap-2'>
                        {[...Array(6)].map((_, i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex justify-between text-sm'>
              <Button type='button' variant='link' className='p-0' onClick={() => setStep(1)}>
                Change Email
              </Button>
              {resendTimer > 0 ? (
                <span className='text-muted-foreground'>Resend code in {resendTimer}s</span>
              ) : (
                <Button
                  type='button'
                  variant='link'
                  className='p-0'
                  onClick={() =>
                    handleSendOTP(
                      { email: form.getValues('email') },
                      {
                        onSuccess: () => {
                          toast.success('Verification code resent successfully.');
                          startResendTimer();
                        },
                        onError: (error: Error) => {
                          toast.error(error.message ?? 'Failed to resend OTP. Please try again.');
                        },
                      },
                    )
                  }
                  disabled={isSendingOTP}
                >
                  Resend code
                </Button>
              )}
            </div>
            <Button type='submit' className='w-full'>
              Next
            </Button>
          </motion.div>
        );
      case 3:
        return (
          <motion.div key='step3' className='space-y-6'>
            <div className='text-center'>
              <h2 className='text-xl font-semibold mb-2'>Welcome</h2>
              <div className='flex flex-col items-center justify-center mb-4'>
                <label htmlFor='profile-photo-upload' className='cursor-pointer'>
                  {profileImagePreview ? (
                    <Avatar className='h-20 w-20'>
                      <AvatarImage src={profileImagePreview} alt='Profile Photo' />
                      <AvatarFallback>
                        <User />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar className='h-20 w-20 border border-dashed'>
                      <AvatarFallback>
                        <User />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <input
                    id='profile-photo-upload'
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={handleProfileImageChange}
                  />
                  <span className='block text-xs text-muted-foreground mt-2'>Profile Photo</span>
                </label>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Your first name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='lastName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Your last name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='profession'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profession</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select your profession' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {professions.map((profession) => (
                        <SelectItem key={profession} value={profession}>
                          {profession}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit' className='w-full'>
              Next
            </Button>
          </motion.div>
        );
      case 4:
        return (
          <motion.div key='step4' className='space-y-6'>
            <div className='text-center'>
              <h2 className='text-xl font-semibold mb-2'>Welcome</h2>
            </div>
            <div className='mb-4'>
              <label htmlFor='id-proof-upload' className='block text-sm font-medium mb-2'>
                Licensing/Identification Document
              </label>
              <div className='flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-lg p-4'>
                <Upload className='h-8 w-8 text-muted-foreground mb-2' />
                <span className='text-xs text-muted-foreground mb-2'>
                  Upload a scan/photo of your licensing/identification document.
                </span>
                <input
                  id='id-proof-upload'
                  type='file'
                  accept='.pdf,image/*'
                  className='hidden'
                  onChange={handleIdProofChange}
                />
                <label htmlFor='id-proof-upload' className='btn btn-outline cursor-pointer'>
                  Choose File
                </label>
                {idProof && <span className='text-xs mt-2'>{idProof.name}</span>}
              </div>
            </div>
            <FormField
              control={form.control}
              name='terms'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel className='text-sm font-normal'>
                      I agree to Continuum's{' '}
                      <Link href='/terms' className='text-primary hover:underline'>
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href='/privacy' className='text-primary hover:underline'>
                        Privacy Policy
                      </Link>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <Button type='submit' className='w-full' disabled={isSigningUp}>
              Create Account
            </Button>
          </motion.div>
        );
      default:
        return null;
    }
  };

  if (status === 'loading') {
    return (
      <div className='flex items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <>
      <div className='flex flex-col space-y-2 text-center'>
        <h1 className='text-2xl font-bold tracking-tight'>Create Practitioner Account</h1>
        <p className='text-muted-foreground'>Join our platform to help clients on their journey.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleStepSubmit)} className='w-full'>
          <AnimatePresence mode='wait'>{renderStep()}</AnimatePresence>
        </form>
      </Form>
      <div className='text-center text-sm'>
        Already have an account?{' '}
        <Link href='/practitioner/auth' className='font-medium text-primary hover:underline'>
          Sign in
        </Link>
      </div>
    </>
  );
}
