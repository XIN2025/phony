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
import { useMutation } from '@tanstack/react-query';
import { AuthService } from '@/services';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@repo/ui/components/input-otp';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select';
import { Logo } from '@repo/ui/components/logo';
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
      // Create the account with all required fields
      await AuthService.signupPractitioner({
        email: values.email!.trim().toLowerCase(),
        otp: values.otp!.trim(),
        role: 'PRACTITIONER',
        firstName: profileData?.firstName || values.firstName!.trim(),
        lastName: profileData?.lastName || values.lastName!.trim(),
        profession: profileData?.profession || values.profession!,
      });

      toast.success('Account created successfully! Please log in.');
      router.push('/practitioner/auth');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Sign up failed.');
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
        handleSendOTP({ email: values.email.trim().toLowerCase() });
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
          <motion.div key='step3' className='space-y-6'>
            <div className='flex justify-center'>
              <div className='relative'>
                <Avatar className='h-24 w-24'>
                  <AvatarImage src={profileImagePreview || '#'} alt='Profile' />
                  <AvatarFallback>
                    <User className='h-12 w-12 text-muted-foreground' />
                  </AvatarFallback>
                </Avatar>
                <input
                  type='file'
                  accept='image/*'
                  ref={profileImageRef}
                  className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      form.setValue('profileImage', file);
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setProfileImagePreview(e.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {profileImagePreview && (
                  <Button
                    type='button'
                    size='sm'
                    variant='destructive'
                    className='absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full'
                    onClick={() => {
                      setProfileImagePreview('');
                      form.setValue('profileImage', null);
                      if (profileImageRef.current) {
                        profileImageRef.current.value = '';
                      }
                    }}
                  >
                    <X className='w-3 h-3' />
                  </Button>
                )}
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
                      <Input placeholder='Enter your first name' {...field} />
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
                      <Input placeholder='Enter your last name' {...field} />
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
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='-- Select --' />
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleStepSubmit)}>
          <AnimatePresence mode='wait'>{renderStep()}</AnimatePresence>
        </form>
      </Form>
      <div className='mt-6 text-center text-sm'>
        Already have an account?{' '}
        <Link href='/practitioner/auth' className='font-medium text-primary hover:underline'>
          Login
        </Link>
      </div>
    </>
  );
}
