'use client';
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Upload, User, CheckIcon } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { AuthService } from '@/services';
import { getInitials } from '@/lib/utils';
import { ProfileSetupForm } from '@/components/ProfileSetupForm';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@repo/ui/components/input-otp';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select';
import { Logo } from '@repo/ui/components/logo';
const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  otp: z.string().min(6, 'Your one-time password must be 6 characters.').optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  profession: z.string().min(2, 'Profession is required').optional(),
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
  const router = useRouter();
  const { status } = useSession();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (status === 'authenticated') {
      router.push('/practitioner');
    }
  }, [status, router]);
  const { mutate: handleSendOTP, isPending: isSendingOTP } = useMutation({
    mutationFn: (data: { email: string }) => AuthService.sendOtp(data),
    onSuccess: () => {
      toast.success('Verification code sent successfully.');
      startResendTimer();
      setStep(2);
    },
    onError: (error: any) => {
      toast.error(error.message ?? 'Failed to send OTP. Please try again.');
    },
  });
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
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
      await AuthService.signupPractitioner({
        email: values.email!.trim().toLowerCase(),
        otp: values.otp!.trim(),
        role: 'PRACTITIONER',
        firstName: profileData?.firstName || values.firstName!.trim(),
        lastName: profileData?.lastName || values.lastName!.trim(),
        profession: profileData?.profession || values.profession!,
      });
      await signIn('credentials', {
        email: values.email!.trim().toLowerCase(),
        otp: values.otp!.trim(),
        role: 'PRACTITIONER',
        redirect: false,
      });
      toast.success('Account created successfully!');
      router.push('/practitioner');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Sign up failed.');
    } finally {
      setIsLoading(false);
    }
  };
  const onSubmit = async (values: SignUpFormValues) => {
    if (isLoading) return;
    switch (step) {
      case 1:
        handleSendOTP({ email: values.email.trim().toLowerCase() });
        break;
      case 2:
        if (values.otp?.length === 6) {
          setStep(3);
        } else {
          toast.error('Please enter the 6-digit OTP.');
        }
        break;
      case 4:
        if (!values.terms) {
          form.setError('terms', {
            type: 'manual',
            message: 'You must agree to the terms and conditions.',
          });
          return;
        }
        await completeSignUp();
        break;
      default:
        break;
    }
  };
  const handleProfileSubmit = (data: {
    firstName: string;
    lastName: string;
    profession?: string;
    profileImage?: File;
  }) => {
    setProfileData({
      firstName: data.firstName,
      lastName: data.lastName,
      profession: data.profession || '',
      profileImage: data.profileImage,
    });
    form.setValue('firstName', data.firstName);
    form.setValue('lastName', data.lastName);
    form.setValue('profession', data.profession || '');
    setStep(4);
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
                Change email address
              </Button>
              {resendTimer > 0 ? (
                <span className='text-muted-foreground'>Resend verification code in {resendTimer}s</span>
              ) : (
                <Button
                  type='button'
                  variant='link'
                  className='p-0'
                  onClick={() => handleSendOTP({ email: form.getValues('email') })}
                  disabled={isSendingOTP}
                >
                  Resend verification code
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
          <motion.div key='step3'>
            <ProfileSetupForm
              onSubmit={handleProfileSubmit}
              showProfession={true}
              professions={professions}
              submitText='Next'
              hideTitle={true}
              defaultValues={{
                firstName: form.getValues('firstName') || '',
                lastName: form.getValues('lastName') || '',
                profession: form.getValues('profession') || '',
              }}
            />
          </motion.div>
        );
      case 4:
        return (
          <motion.div key='step4' className='space-y-6'>
            <FormItem>
              <div className='flex justify-between items-center'>
                <FormLabel>Professional Verification</FormLabel>
                <Button
                  type='button'
                  variant='link'
                  size='sm'
                  onClick={completeSignUp}
                  className='text-muted-foreground'
                >
                  Skip for now
                </Button>
              </div>
              <FormControl>
                <div className='flex items-center justify-center w-full'>
                  <label
                    htmlFor='dropzone-file'
                    className='flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted'
                  >
                    <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                      {idProofFileName ? (
                        <>
                          <CheckIcon className='w-8 h-8 mb-2 text-green-500' />
                          <p className='mb-2 text-sm text-center text-muted-foreground'>{idProofFileName}</p>
                          <Button
                            type='button'
                            variant='link'
                            size='sm'
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIdProofFileName(null);
                              form.resetField('idProof');
                            }}
                          >
                            Remove
                          </Button>
                        </>
                      ) : (
                        <>
                          <Upload className='w-8 h-8 mb-2 text-muted-foreground' />
                          <p className='mb-2 text-sm text-muted-foreground'>
                            Upload a government-issued ID for verification
                          </p>
                          <Button
                            type='button'
                            size='sm'
                            onClick={(e) => {
                              e.preventDefault();
                              fileInputRef.current?.click();
                            }}
                          >
                            Select Document
                          </Button>
                        </>
                      )}
                    </div>
                    <Input
                      id='dropzone-file'
                      ref={fileInputRef}
                      type='file'
                      className='hidden'
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setIdProofFileName(file.name);
                          form.setValue('idProof', file);
                        }
                      }}
                    />
                  </label>
                </div>
              </FormControl>
            </FormItem>
            <FormField
              control={form.control}
              name='terms'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          form.clearErrors('terms');
                        }
                      }}
                    />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel>I agree to Continuum's Terms of Service and Privacy Policy</FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <Button type='submit' className='w-full' disabled={isLoading || !form.watch('terms')}>
              {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Complete Registration
            </Button>
          </motion.div>
        );
      default:
        return null;
    }
  };
  return (
    <>
      <div className='mb-8 text-center'>
        <Logo className='mx-auto h-8 w-8 sm:h-10 sm:w-10' />
      </div>
      <div className='flex flex-col space-y-2 text-left mb-8'>
        <h1 className='text-2xl font-bold tracking-tight'>
          {step <= 2 ? 'Create Your Practitioner Account' : 'Complete Your Profile'}
        </h1>
        <p className='text-muted-foreground'>
          {step === 1 && 'Enter your email address to begin the registration process.'}
          {step === 2 && `We've sent a verification code to ${form.getValues('email')}`}
          {step === 3 && 'Please provide your professional information to complete your profile.'}
          {step === 4 && 'Upload your professional credentials and accept our terms.'}
        </p>
      </div>
      {step === 3 ? (
        <AnimatePresence mode='wait'>{renderStep()}</AnimatePresence>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <AnimatePresence mode='wait'>{renderStep()}</AnimatePresence>
          </form>
        </Form>
      )}
      <div className='mt-6 text-center text-sm'>
        Already have an account?{' '}
        <Link href='/practitioner/auth' className='font-medium text-primary hover:underline'>
          Login
        </Link>
      </div>
    </>
  );
}
