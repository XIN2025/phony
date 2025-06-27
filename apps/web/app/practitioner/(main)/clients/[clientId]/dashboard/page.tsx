'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@repo/ui/components/tabs';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@repo/ui/components/checkbox';
import { MessageCircle } from 'lucide-react';

const mockClient = {
  name: 'Sophie Bennett',
  since: 'Jan 1, 2025',
  avatarUrl: '',
};
const mockStats = {
  completion: 85,
  pending: 4,
};
const mockGoals = {
  daily: [
    {
      title: 'Spend Time Outdoors',
      target: '30 Mins',
      frequency: '2/day',
      feedback: 'This appeared to feel calm and collected.',
      achieved: '49 mins',
    },
  ],
  consistent: [
    {
      title: 'Sleep Routine',
      target: '8 hrs',
      frequency: '1/day',
      feedback: '😴 Sleeping is still very troublesome',
      achieved: '4 hrs',
    },
  ],
};

export default function ClientDashboardPage({ params }: { params: Promise<{ clientId: string }> }) {
  const router = useRouter();
  const [clientId, setClientId] = React.useState<string>('');

  React.useEffect(() => {
    params.then((resolvedParams) => {
      setClientId(resolvedParams.clientId);
    });
  }, [params]);

  if (!clientId) {
    return <div>Loading...</div>;
  }

  return (
    <div className='flex flex-col min-h-screen bg-background'>
      {/* Header */}
      <div className='flex flex-col gap-0 border-b bg-background px-0 sm:px-8 pt-6 pb-4'>
        <div className='w-full flex items-center'>
          <button
            type='button'
            aria-label='Back'
            onClick={() => router.push('/practitioner/clients')}
            className='text-muted-foreground hover:text-foreground focus:outline-none ml-2 sm:ml-0'
            style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft className='h-7 w-7' />
          </button>
        </div>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-0 mt-2'>
          <div>
            <h1 className='text-xl sm:text-2xl font-bold leading-tight'>{mockClient.name}</h1>
            <p className='text-sm text-muted-foreground mt-1'>Client since {mockClient.since}</p>
          </div>
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0'>
            <Button
              variant='outline'
              className='rounded-full px-4 sm:px-6 py-2 text-sm font-medium border border-border'
            >
              View Profile
            </Button>
            <Button className='rounded-full px-4 sm:px-6 py-2 text-sm font-medium border border-border bg-foreground text-background hover:bg-foreground/90'>
              Take Progress Snapshot
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Centered and Compact */}
      <div className='flex-1 w-full flex py-4 sm:py-8 bg-background'>
        <div className='w-full px-4 sm:px-8 lg:px-16 flex flex-col gap-6 sm:gap-8'>
          {/* Tabs: Mobile-friendly */}
          <div className='w-full'>
            <Tabs defaultValue='dashboard' className='w-full'>
              <TabsList className='flex gap-1 bg-transparent p-0 justify-start w-full sm:w-fit mb-6 overflow-x-auto'>
                <TabsTrigger
                  value='dashboard'
                  className='rounded-full px-4 sm:px-7 py-2 text-sm sm:text-base font-semibold border border-border data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=inactive]:bg-background data-[state=inactive]:text-foreground whitespace-nowrap flex-shrink-0'
                >
                  Dashboard
                </TabsTrigger>
                <TabsTrigger
                  value='sessions'
                  className='rounded-full px-4 sm:px-7 py-2 text-sm sm:text-base font-semibold border border-border data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=inactive]:bg-background data-[state=inactive]:text-foreground whitespace-nowrap flex-shrink-0'
                >
                  Sessions
                </TabsTrigger>
                <TabsTrigger
                  value='plans'
                  className='rounded-full px-4 sm:px-7 py-2 text-sm sm:text-base font-semibold border border-border data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=inactive]:bg-background data-[state=inactive]:text-foreground whitespace-nowrap flex-shrink-0'
                >
                  Plans
                </TabsTrigger>
                <TabsTrigger
                  value='journal'
                  className='rounded-full px-4 sm:px-7 py-2 text-sm sm:text-base font-semibold border border-border data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=inactive]:bg-background data-[state=inactive]:text-foreground whitespace-nowrap flex-shrink-0'
                >
                  Journal
                </TabsTrigger>
              </TabsList>

              {/* Dashboard Tab Content */}
              <TabsContent value='dashboard' className='mt-0'>
                {/* Tasks Section: Remove outer Card, only stat cards remain as cards */}
                <div className='flex flex-col gap-4 w-full mb-6 sm:mb-8'>
                  <div className='flex flex-col md:flex-row md:items-center md:justify-between w-full gap-3 md:gap-0'>
                    <h2 className='text-lg sm:text-xl font-semibold mb-0'>Tasks</h2>
                    <div className='flex flex-wrap gap-2 justify-start md:justify-end'>
                      <Button
                        size='sm'
                        variant='outline'
                        className='rounded-full px-3 sm:px-5 py-1.5 text-xs sm:text-sm font-medium border border-border'
                      >
                        Select Date
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        className='rounded-full px-3 sm:px-5 py-1.5 text-xs sm:text-sm font-medium border border-border'
                      >
                        All Tasks
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        className='rounded-full px-3 sm:px-5 py-1.5 text-xs sm:text-sm font-medium border border-border'
                      >
                        Pending
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        className='rounded-full px-3 sm:px-5 py-1.5 text-xs sm:text-sm font-medium border border-border'
                      >
                        Completed
                      </Button>
                    </div>
                  </div>
                  <div className='flex flex-col sm:flex-row gap-4 w-full'>
                    <Card className='flex-1 min-w-[180px] border border-gray-700 rounded-2xl shadow-none bg-background'>
                      <CardHeader className='pb-2'>
                        <CardTitle className='text-sm sm:text-base font-semibold'>Avg Daily Tasks Completion</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='text-2xl sm:text-3xl font-extrabold'>{mockStats.completion}%</div>
                      </CardContent>
                    </Card>
                    <Card className='flex-1 min-w-[180px] border border-gray-700 rounded-2xl shadow-none bg-background'>
                      <CardHeader className='pb-2'>
                        <CardTitle className='text-sm sm:text-base font-semibold'>Tasks Pending</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='text-2xl sm:text-3xl font-extrabold'>{mockStats.pending}</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                {/* Goals Section: Centered, not full width */}
                <Card className='w-full border border-gray-700 rounded-2xl shadow-none bg-background'>
                  <CardContent className='p-4 sm:p-6 lg:p-8'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 w-full'>
                      <div>
                        <div className='font-semibold text-base sm:text-lg mb-4 sm:mb-5'>Daily Targeted Goals</div>
                        <div className='space-y-4 sm:space-y-5'>
                          {mockGoals.daily.map((goal, i) => (
                            <Card key={i} className='border border-border rounded-xl bg-background shadow-none'>
                              <CardContent className='p-4 sm:p-5 flex gap-3 sm:gap-4 items-start'>
                                <Checkbox className='mt-1 flex-shrink-0' />
                                <div className='flex-1 min-w-0'>
                                  <div className='font-semibold mb-1 text-sm sm:text-base'>{goal.title}</div>
                                  <div className='flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs text-muted-foreground mb-1'>
                                    <span>
                                      Target: <span className='text-foreground font-medium'>{goal.target}</span>
                                    </span>
                                    <span>
                                      Frequency: <span className='text-foreground font-medium'>{goal.frequency}</span>
                                    </span>
                                  </div>
                                  <div className='flex items-start gap-2 text-xs mt-2'>
                                    <MessageCircle className='h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5' />
                                    <span className='text-foreground'>{goal.feedback}</span>
                                  </div>
                                  <div className='text-xs mt-1'>
                                    Achieved: <span className='font-medium text-foreground'>{goal.achieved}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className='font-semibold text-base sm:text-lg mb-4 sm:mb-5'>Consistent Goals</div>
                        <div className='space-y-4 sm:space-y-5'>
                          {mockGoals.consistent.map((goal, i) => (
                            <Card key={i} className='border border-border rounded-xl bg-background shadow-none'>
                              <CardContent className='p-4 sm:p-5 flex gap-3 sm:gap-4 items-start'>
                                <Checkbox className='mt-1 flex-shrink-0' />
                                <div className='flex-1 min-w-0'>
                                  <div className='font-semibold mb-1 text-sm sm:text-base'>{goal.title}</div>
                                  <div className='flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs text-muted-foreground mb-1'>
                                    <span>
                                      Target: <span className='text-foreground font-medium'>{goal.target}</span>
                                    </span>
                                    <span>
                                      Frequency: <span className='text-foreground font-medium'>{goal.frequency}</span>
                                    </span>
                                  </div>
                                  <div className='flex items-start gap-2 text-xs mt-2'>
                                    <MessageCircle className='h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5' />
                                    <span className='text-foreground'>{goal.feedback}</span>
                                  </div>
                                  <div className='text-xs mt-1'>
                                    Achieved: <span className='font-medium text-foreground'>{goal.achieved}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              {/* Placeholder for other tabs */}
              <TabsContent value='sessions' className='mt-6 sm:mt-10'>
                <div className='p-4 sm:p-8 text-muted-foreground text-center'>
                  <h3 className='text-lg font-semibold mb-2'>Sessions</h3>
                  <p>Session content coming soon.</p>
                </div>
              </TabsContent>
              <TabsContent value='plans' className='mt-6 sm:mt-10'>
                <div className='p-4 sm:p-8 text-muted-foreground text-center'>
                  <h3 className='text-lg font-semibold mb-2'>Plans</h3>
                  <p>Plans content coming soon.</p>
                </div>
              </TabsContent>
              <TabsContent value='journal' className='mt-6 sm:mt-10'>
                <div className='p-4 sm:p-8 text-muted-foreground text-center'>
                  <h3 className='text-lg font-semibold mb-2'>Journal</h3>
                  <p>Journal content coming soon.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
