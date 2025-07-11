'use client';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { FileText, CheckCircle, Clock, Menu } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import { useSidebar } from '@/context/SidebarContext';
import { SidebarToggleButton } from '@/components/practitioner/SidebarToggleButton';

const ClientFormsPage = () => {
  const { data: session } = useSession();
  const { setSidebarOpen } = useSidebar();

  return (
    <div className='flex flex-col w-full max-w-full overflow-x-hidden pt-4 sm:pt-6 px-4 sm:px-6 md:px-8 min-w-0'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 w-full gap-3'>
        <div className='flex items-center gap-2 min-w-0'>
          <SidebarToggleButton />
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-0 truncate'>Forms</h1>
        </div>
        <div className='text-sm sm:text-base text-gray-600'>Complete and manage your forms</div>
      </div>

      <div className='w-full min-w-0'>
        <Card className='bg-white/60 backdrop-blur-sm shadow-lg rounded-2xl border border-white/50 min-w-0'>
          <CardHeader className='pb-3 sm:pb-4'>
            <CardTitle className='flex items-center gap-2 text-base sm:text-lg lg:text-xl text-gray-800'>
              <FileText className='h-4 w-4 sm:h-5 sm:w-5' />
              Forms Center
            </CardTitle>
            <CardDescription className='text-xs sm:text-sm lg:text-base text-gray-600'>
              View and complete forms assigned by your practitioner
            </CardDescription>
          </CardHeader>
          <CardContent className='p-3 sm:p-4 lg:p-6'>
            <div className='space-y-3 sm:space-y-4'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-gray-200/60 rounded-xl bg-transparent gap-3 sm:gap-0'>
                <div className='flex items-center gap-2 sm:gap-3 min-w-0 flex-1'>
                  <FileText className='h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0' />
                  <div className='min-w-0 flex-1'>
                    <h3 className='font-semibold text-sm sm:text-base truncate text-gray-800'>Intake Form</h3>
                    <p className='text-xs sm:text-sm text-gray-600 truncate'>Initial assessment form</p>
                  </div>
                </div>
                <div className='flex items-center gap-2 flex-shrink-0'>
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

              <div className='text-center py-4 sm:py-6 lg:py-8'>
                <FileText className='h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-gray-400 mx-auto mb-3 sm:mb-4' />
                <h3 className='text-base sm:text-lg lg:text-xl font-semibold mb-2 text-gray-800'>
                  More Forms Coming Soon
                </h3>
                <p className='text-gray-600 text-xs sm:text-sm lg:text-base max-w-md mx-auto'>
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
