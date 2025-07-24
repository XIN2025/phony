'use client';
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Upload, User } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useSendOtp, usePractitionerSignup, useVerifyOtp, useVerifyOtpOnly } from '@/lib/hooks/use-api';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@repo/ui/components/input-otp';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select';
import { SignupStepper } from '@/components/SignupStepper';
import { Card, CardContent } from '@repo/ui/components/card';

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

const professions = [
  'Therapist',
  'Counselor',
  'Psychologist',
  'Social Worker',
  'Psychotherapist',
  'Counsellor',
  'Health Coach',
  'Life Coach',
];

// Component for the bottom section with stepper and button
function SignupBottomSection({
  step,
  isSendingOTP,
  isSigningUp,
  onSubmit,
  onBack,
}: {
  step: number;
  isSendingOTP: boolean;
  isSigningUp: boolean;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <div className='px-4 pt-0 pb-6'>
      <div className='w-full space-y-4'>
        {/* Stepper - spans full width */}
        <SignupStepper totalSteps={4} currentStep={step} />

        <div className='flex flex-row justify-between gap-3 w-full'>
          {step > 1 ? (
            <Button
              type='button'
              className='h-12 w-[48%] sm:w-auto px-8 text-base font-medium rounded-full border border-black bg-transparent text-black shadow-none transition-colors duration-200'
              onClick={onBack}
            >
              Back
            </Button>
          ) : (
            <div className='w-[48%] sm:w-auto'></div>
          )}

          <Button
            type='submit'
            className='h-12 w-[48%] bg-[#807171] sm:w-auto px-8 text-base font-medium rounded-full text-white '
            disabled={isSendingOTP || isSigningUp}
            onClick={onSubmit}
          >
            {isSendingOTP && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {isSigningUp && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {step === 4 ? 'Create Account' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PractitionerSignUpPage() {
  const [step, setStep] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(0);
  const [profileData, setProfileData] = React.useState<{
    firstName: string;
    lastName: string;
    profession: string;
    profileImage?: File;
    idProof?: File;
  } | null>(null);
  const [profileImagePreview, setProfileImagePreview] = React.useState<string>('');
  const [idProofFile, setIdProofFile] = React.useState<File | null>(null);
  const [idProofFileName, setIdProofFileName] = React.useState<string>('');
  const router = useRouter();
  const { status } = useSession();
  const [profileImage, setProfileImage] = React.useState<File | null>(null);
  const timerCleanupRef = React.useRef<(() => void) | null>(null);
  const [showLegalModal, setShowLegalModal] = React.useState<null | 'terms' | 'privacy'>(null);

  React.useEffect(() => {
    if (status === 'authenticated') {
      router.push('/practitioner');
    }
  }, [status, router]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerCleanupRef.current) {
        timerCleanupRef.current();
      }
    };
  }, []);

  const { mutate: handleSendOTP, isPending: isSendingOTP } = useSendOtp();
  const { mutate: handleSignup, isPending: isSigningUp } = usePractitionerSignup();
  const { mutateAsync: verifyOtp, isPending: isVerifyingOtp } = useVerifyOtp();
  const { mutateAsync: verifyOtpOnly, isPending: isVerifyingOtpOnly } = useVerifyOtpOnly();

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
    // Clear any existing timer
    if (timerCleanupRef.current) {
      timerCleanupRef.current();
    }

    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          timerCleanupRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Store cleanup function for proper memory management
    timerCleanupRef.current = () => clearInterval(interval);
  };

  const completeSignUp = async () => {
    setIsLoading(true);
    const values = form.getValues();
    try {
      const formData = new FormData();
      formData.append('email', values.email!.trim().toLowerCase());
      formData.append('otp', values.otp!.trim());
      formData.append('role', 'PRACTITIONER');
      formData.append('firstName', profileData?.firstName || values.firstName!.trim());
      formData.append('lastName', profileData?.lastName || values.lastName?.trim() || '');
      formData.append('profession', profileData?.profession || values.profession!);
      if (profileData?.profileImage || profileImage) {
        formData.append('profileImage', profileData?.profileImage || profileImage!);
      }
      if (profileData?.idProof || idProofFile) {
        formData.append('idProof', profileData?.idProof || idProofFile!);
      }
      handleSignup(formData, {
        onSuccess: async (response) => {
          toast.success('Account created successfully!');

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
              toast.error(error.message ?? 'Failed to send verification code.');
            },
          },
        );
        break;
      case 2:
        if (!values.otp?.trim() || values.otp.trim().length !== 6) {
          toast.error('Please enter the 6-digit OTP.');
          return;
        }
        // Verify OTP before proceeding
        try {
          await verifyOtpOnly({ email: values.email.trim().toLowerCase(), otp: values.otp.trim() });
          setStep(3);
        } catch (error: any) {
          toast.error(error?.message || 'Invalid OTP. Please try again.');
        }
        break;
      case 3:
        if (!values.firstName?.trim()) {
          toast.error('First name is required.');
          return;
        }
        setProfileData({
          firstName: values.firstName.trim(),
          lastName: values.lastName?.trim() ?? '',
          profession: values.profession?.trim() ?? '',
          profileImage: values.profileImage,
          idProof: values.idProof,
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

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
      form.setValue('profileImage', file);
    }
  };

  const handleIdProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdProofFile(file);
      setIdProofFileName(file.name);
      form.setValue('idProof', file);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const getStepText = () => {
    switch (step) {
      case 1:
        return {
          title: 'Create Account',
          description: "We'll send you a code on this email to verify your account.",
        };
      case 2:
        return {
          title: 'Enter OTP',
          description: `Please enter the code we sent to ${form.getValues('email')}`,
        };
      case 3:
        return {
          title: 'Your Profile',
          description: '',
        };
      case 4:
        return {
          title: '',
          description: '',
        };
      default:
        return {
          title: 'Create Account',
          description: '',
        };
    }
  };

  const renderLegalModal = () => {
    if (!showLegalModal) return null;
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
        <Card className='w-full max-w-sm'>
          <CardContent className='flex flex-col items-center justify-center space-y-4 p-6'>
            <h2 className='text-xl font-semibold mb-2'>
              {showLegalModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
            </h2>
            <p className='text-muted-foreground text-center'>
              Coming soon. The {showLegalModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'} will be available
              here soon.
            </p>
            <Button className='mt-4 w-full' onClick={() => setShowLegalModal(null)}>
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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
                <FormItem className=''>
                  <FormLabel className='text-sm font-medium text-gray-700' style={{ color: '#8C8B8B' }}>
                    Email ID
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Your Email ID'
                      {...field}
                      className='w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-zinc-50'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
        );
      case 2:
        return (
          <motion.div key='step2' className='space-y-4'>
            <FormField
              control={form.control}
              name='otp'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputOTP {...field} maxLength={6}>
                      <InputOTPGroup className='w-full justify-center gap-1 sm:gap-2'>
                        {[...Array(6)].map((_, i) => (
                          <InputOTPSlot key={i} index={i} className='h-12 w-10 sm:w-12 text-lg' />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex flex-row justify-between items-center text-sm pt-2 w-full'>
              <Button
                type='button'
                variant='link'
                className='p-0 h-auto text-left sm:text-center'
                onClick={() => setStep(1)}
              >
                Change Email
              </Button>
              {resendTimer > 0 ? (
                <span className='text-muted-foreground text-right'>Resend code in {resendTimer}s</span>
              ) : (
                <Button
                  type='button'
                  variant='link'
                  className='p-0 h-auto text-right'
                  onClick={() =>
                    handleSendOTP(
                      { email: form.getValues('email') },
                      {
                        onSuccess: () => {
                          toast.success('Verification code resent successfully.');
                          startResendTimer();
                        },
                        onError: (error: Error) => {
                          toast.error(error.message ?? 'Failed to resend verification code.');
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
          </motion.div>
        );
      case 3:
        return (
          <motion.div key='step3' className='space-y-6'>
            <div className='text-center'>
              <div className='flex flex-col items-center justify-center mb-4'>
                <label htmlFor='profile-photo-upload' className='cursor-pointer'>
                  {profileImagePreview ? (
                    <Avatar className='h-16 w-16 sm:h-20 sm:w-20'>
                      <AvatarImage src={profileImagePreview} alt='Profile Photo' />
                      <AvatarFallback>
                        <User />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar className='h-16 w-16 sm:h-20 sm:w-20 border border-dashed'>
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
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium text-gray-700' style={{ color: '#8C8B8B' }}>
                      First Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Your first name'
                        {...field}
                        className='h-10 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-zinc-50'
                      />
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
                    <FormLabel className='text-sm font-medium text-gray-700' style={{ color: '#8C8B8B' }}>
                      Last Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Your last name'
                        {...field}
                        className='h-10 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-zinc-50'
                      />
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
                <FormItem className='w-full'>
                  <FormLabel className='text-sm font-medium text-gray-700' style={{ color: '#8C8B8B' }}>
                    Profession
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className='h-11 text-base w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-zinc-50'>
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
          </motion.div>
        );
      case 4:
        return (
          <motion.div key='step4' className='space-y-6'>
            <div className='mb-4'>
              <label htmlFor='id-proof-upload' className='block text-sm font-medium mb-2' style={{ color: '#8C8B8B' }}>
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
                {idProofFileName && <span className='text-xs text-green-600 mt-2'>Selected: {idProofFileName}</span>}
              </div>
            </div>
            <FormField
              control={form.control}
              name='terms'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-1 space-y-0'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className='mt-0.5'
                      style={{ borderColor: 'black' }}
                    />
                  </FormControl>
                  <div className='space-y-1 leading-none flex-1'>
                    <FormLabel className='text-xs sm:text-sm font-normal leading-relaxed cursor-pointer'>
                      <span className='whitespace-normal'>
                        I agree to Continuum's{' '}
                        <button
                          type='button'
                          className='text-primary hover:underline bg-transparent border-0 p-0 m-0 inline text-xs sm:text-sm'
                          style={{ background: 'none' }}
                          onClick={() => setShowLegalModal('terms')}
                        >
                          Terms of Service
                        </button>{' '}
                        and{' '}
                        <button
                          type='button'
                          className='text-primary hover:underline bg-transparent border-0 p-0 m-0 inline text-xs sm:text-sm'
                          style={{ background: 'none' }}
                          onClick={() => setShowLegalModal('privacy')}
                        >
                          Privacy Policy
                        </button>
                      </span>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
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
    <div className='min-h-screen flex flex-col lg:flex-row auth-gradient'>
      {/* Left side - Image section */}
      <div className='hidden lg:flex lg:w-3/5 relative overflow-hidden'>
        <div
          className='absolute inset-0 bg-cover bg-center bg-no-repeat'
          style={{ backgroundImage: 'url(/auth.jpg)' }}
        ></div>
        <div className='absolute inset-0 bg-black/20'></div>

        {/* Logo in bottom left */}
        <div className='absolute bottom-6 left-6'>
          <div className='w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center'>
            <span className='text-white text-sm font-bold'>N</span>
          </div>
        </div>
      </div>

      {/* Right side - Form section */}
      <div className='flex-1 lg:w-2/5 flex flex-col min-h-screen auth-gradient'>
        {/* Main content area */}
        <div className='flex-1 flex flex-col justify-start items-center px-4 sm:px-6 lg:px-8 pt-4 sm:pt-12 lg:pt-16 pb-2 sm:pb-0 auth-gradient'>
          <div
            className={`w-full max-w-md ${step === 2 ? 'space-y-4 sm:space-y-6' : step === 3 ? 'space-y-4 sm:space-y-8 pt-2 pb-2 sm:pt-0 sm:pb-6' : 'space-y-6 sm:space-y-8'}`}
          >
            {/* Header content */}
            <div className='w-full flex flex-col items-center mt-4 justify-center text-center'>
              <h1
                className='font-bold tracking-tight text-[#8d8080] w-full text-center text-2xl sm:text-4xl'
                style={{ fontFamily: "'DM Serif Display', serif", fontSize: '40px', textAlign: 'center' }}
              >
                Welcome to Continuum
              </h1>
              <p
                className='text-gray-700 leading-relaxed px-4 sm:px-7 w-full text-center text-sm sm:text-lg'
                style={{ fontSize: '20px', textAlign: 'center' }}
              >
                Make the time between sessions count — along with the sessions themselves
              </p>
              <div className='mt-4 sm:mt-6 lg:mt-8 w-full flex flex-col items-center'>
                <h2
                  className='tracking-tighter text-gray-800 mb-2 w-full text-center text-lg sm:text-xl'
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '28px', textAlign: 'center' }}
                >
                  {getStepText().title}
                </h2>
                <p className='text-xs sm:text-sm text-gray-600 w-full text-center' style={{ textAlign: 'center' }}>
                  {getStepText().description}
                </p>
              </div>
            </div>

            {/* Form Section */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleStepSubmit)} className='w-full space-y-4 sm:space-y-6'>
                <AnimatePresence mode='wait'>{renderStep()}</AnimatePresence>
              </form>
            </Form>

            {/* Sign in link */}
            <div className='text-center text-xs sm:text-sm md:-mt-3  pb-4 sm:pb-0'>
              Already have an account?{' '}
              <Link href='/practitioner/auth' className='font-medium text-primary hover:underline'>
                Sign in
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom section with stepper and button - contained within right panel */}
        <SignupBottomSection
          step={step}
          isSendingOTP={isSendingOTP}
          isSigningUp={isSigningUp}
          onSubmit={form.handleSubmit(handleStepSubmit)}
          onBack={handleBack}
        />
      </div>

      {renderLegalModal()}
    </div>
  );
}
