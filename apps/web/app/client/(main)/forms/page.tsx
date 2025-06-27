'use client';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { FileText, CheckCircle, Clock } from 'lucide-react';

const ClientFormsPage = () => {
  const { data: session } = useSession();

  return (
    <div className='container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-4xl'>
      <div className='mb-6 sm:mb-8'>
        <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white'>Forms</h1>
        <p className='text-gray-600 dark:text-gray-400 mt-2'>Complete and manage your forms</p>
      </div>

      <div className='grid grid-cols-1 gap-6'>
        <Card>
          <CardHeader className='pb-3 sm:pb-4'>
            <CardTitle className='flex items-center gap-2 text-lg sm:text-xl'>
              <FileText className='h-5 w-5' />
              Forms Center
            </CardTitle>
            <CardDescription className='text-sm sm:text-base'>
              View and complete forms assigned by your practitioner
            </CardDescription>
          </CardHeader>
          <CardContent className='p-4 sm:p-6'>
            <div className='space-y-4'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3 sm:gap-0'>
                <div className='flex items-center gap-3'>
                  <FileText className='h-5 w-5 text-muted-foreground flex-shrink-0' />
                  <div className='min-w-0 flex-1'>
                    <h3 className='font-semibold text-sm sm:text-base'>Intake Form</h3>
                    <p className='text-xs sm:text-sm text-muted-foreground'>Initial assessment form</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  {session?.user?.clientStatus === 'INTAKE_COMPLETED' ? (
                    <>
                      <CheckCircle className='h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0' />
                      <span className='text-xs sm:text-sm text-green-600 font-medium'>Completed</span>
                    </>
                  ) : session?.user?.clientStatus === 'NEEDS_INTAKE' ? (
                    <>
                      <Clock className='h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0' />
                      <span className='text-xs sm:text-sm text-orange-600 font-medium'>Pending</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className='h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0' />
                      <span className='text-xs sm:text-sm text-gray-500 font-medium'>Not Required</span>
                    </>
                  )}
                </div>
              </div>

              <div className='text-center py-6 sm:py-8'>
                <FileText className='h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4' />
                <h3 className='text-lg sm:text-xl font-semibold mb-2'>More Forms Coming Soon</h3>
                <p className='text-muted-foreground text-sm sm:text-base max-w-md mx-auto'>
                  Additional forms and assessments will be available here as your care plan progresses.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientFormsPage;
