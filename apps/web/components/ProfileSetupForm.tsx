'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, X, User } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { getInitials } from '@/lib/utils';

const profileSetupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  profession: z.string().optional(),
});

type ProfileSetupForm = z.infer<typeof profileSetupSchema>;

interface ProfileSetupFormProps {
  onSubmit: (data: ProfileSetupForm & { profileImage?: File }) => void;
  isPending?: boolean;
  defaultValues?: Partial<ProfileSetupForm>;
  showProfession?: boolean;
  professions?: string[];
  title?: string;
  subtitle?: string;
  submitText?: string;
  hideTitle?: boolean;
}

export function ProfileSetupForm({
  onSubmit,
  isPending = false,
  defaultValues = {},
  showProfession = false,
  professions = [],
  title = 'Complete Your Profile',
  subtitle = "Let's get to know you better",
  submitText = 'Complete Setup',
  hideTitle = false,
}: ProfileSetupFormProps) {
  const [profileImage, setProfileImage] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string>('');
  const [isFormInitialized, setIsFormInitialized] = React.useState(false);

  const form = useForm<ProfileSetupForm>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      profession: '',
    },
  });

  React.useEffect(() => {
    if (!isFormInitialized && defaultValues) {
      form.reset({
        firstName: defaultValues.firstName || '',
        lastName: defaultValues.lastName || '',
        profession: defaultValues.profession || '',
      });
      setIsFormInitialized(true);
    }
  }, [defaultValues, form, isFormInitialized]);

  const handleImageUpload = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeImage = React.useCallback(() => {
    setProfileImage(null);
    setImagePreview('');
  }, []);

  const handleSubmit = React.useCallback(
    (data: ProfileSetupForm) => {
      onSubmit({ ...data, profileImage: profileImage || undefined });
    },
    [onSubmit, profileImage],
  );

  const firstName = form.watch('firstName');
  const lastName = form.watch('lastName');
  // Memoize the initials to prevent unnecessary re-renders
  const initials = React.useMemo(() => {
    return getInitials(`${firstName || ''} ${lastName || ''}`);
  }, [firstName, lastName]);

  return (
    <div className='space-y-6'>
      {!hideTitle && (
        <div className='text-center space-y-4'>
          <h1 className='text-2xl font-bold tracking-tight'>{title}</h1>
          <p className='text-muted-foreground'>{subtitle}</p>
        </div>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          <div className='flex justify-center'>
            <div className='relative'>
              <Avatar className='h-24 w-24'>
                <AvatarImage src={imagePreview || '#'} alt='Profile' />
                <AvatarFallback>{initials || <User className='h-12 w-12 text-muted-foreground' />}</AvatarFallback>
              </Avatar>
              <input
                type='file'
                accept='image/*'
                onChange={handleImageUpload}
                className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                disabled={isPending}
              />
              {imagePreview && (
                <Button
                  type='button'
                  size='sm'
                  variant='destructive'
                  className='absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full'
                  onClick={removeImage}
                  disabled={isPending}
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
                    <Input placeholder='Enter your first name' {...field} disabled={isPending} />
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
                    <Input placeholder='Enter your last name' {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {showProfession && (
            <FormField
              control={form.control}
              name='profession'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profession</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={isPending}>
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
          )}

          <Button type='submit' className='w-full' disabled={isPending}>
            {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {submitText}
          </Button>
        </form>
      </Form>
    </div>
  );
}
