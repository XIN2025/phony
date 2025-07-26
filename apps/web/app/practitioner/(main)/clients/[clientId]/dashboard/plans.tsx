import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import { Card } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { useRouter } from 'next/navigation';
import { useGetSessionsByClient } from '@/lib/hooks/use-api';

function getAvgFeedback(plan: any) {
  const allCompletions = plan.actionItems.flatMap((item: any) => item.completions || []);
  if (allCompletions.length === 0) return 'Nil';
  const completionsWithRating = allCompletions.filter((c: any) => typeof c.rating === 'number');
  if (completionsWithRating.length === 0) return 'Nil';
  const totalRating = completionsWithRating.reduce((sum: number, c: any) => sum + (c.rating ?? 0), 0);
  const avgRating = totalRating / completionsWithRating.length;
  if (avgRating >= 4) return 'Happy';
  if (avgRating >= 2.5) return 'Neutral';
  return 'Sad';
}

export default function PlansTab({ clientId }: { clientId: string }) {
  const router = useRouter();
  const { data: sessions = [] } = useGetSessionsByClient(clientId);
  const [planSearch, setPlanSearch] = useState('');

  const plans = useMemo(() => {
    return sessions
      .filter((s) => s.plan)
      .map((s) => ({
        sessionId: s.id,
        sessionTitle: s.title,
        recordedAt: s.recordedAt,
        plan: s.plan,
      }));
  }, [sessions]);

  const filteredPlans = useMemo(() => {
    if (!planSearch.trim()) return plans;
    return plans.filter((p) => (p.sessionTitle || '').toLowerCase().includes(planSearch.trim().toLowerCase()));
  }, [plans, planSearch]);

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-row items-center justify-between gap-2 sm:gap-4 mb-4'>
        <h2
          className='text-2xl lg:text-[24px] xl:text-[28px] font-semibold'
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          {' '}
          Plans
        </h2>
        <input
          type='text'
          placeholder='Search Plan'
          value={planSearch}
          onChange={(e) => setPlanSearch(e.target.value)}
          className='border rounded-full px-4 py-2 w-60 text-sm outline-none focus:ring-2 focus:ring-black/10'
          style={{ minWidth: 180 }}
        />
      </div>
      <div className='overflow-x-auto'>
        <div className='bg-white rounded-2xl shadow-md p-0'>
          <Table className='min-w-[700px] w-full text-[12px] sm:text-[14px] lg:text-[16px] xl:text-[14px]'>
            <colgroup>
              <col className='w-[24%] min-w-[90px]' />
              <col className='w-[28%] min-w-[90px]' />
              <col className='w-[28%] min-w-[90px]' />
              <col className='w-[20%] min-w-[80px]' />
            </colgroup>
            <TableHeader>
              <TableRow className='border-b border-gray-200/60 bg-gray-50/50'>
                <TableHead className='py-3 px-2 sm:px-4 lg:px-6 text-left font-semibold text-gray-700 text-[12px] sm:text-[14px] lg:text-[16px] truncate'>
                  Date
                </TableHead>
                <TableHead className='py-3 px-2 sm:px-4 lg:px-6 text-left font-semibold text-gray-700 text-[12px] sm:text-[14px] lg:text-[16px]'>
                  Session Title
                </TableHead>
                <TableHead className='py-3 px-2 sm:px-4 lg:px-6 text-left font-semibold text-gray-700 text-[12px] sm:text-[14px] lg:text-[16px] truncate'>
                  Tasks
                </TableHead>
                <TableHead className='py-3 px-2 sm:px-4 lg:px-6 text-center font-semibold text-gray-700 text-[12px] sm:text-[14px] lg:text-[16px] truncate'>
                  Avg Task Feedback
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className='text-center text-gray-400 py-8'>
                    No plans found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlans.map(({ sessionId, sessionTitle, recordedAt, plan }) => {
                  if (!plan) return null;
                  const completed = plan.actionItems.filter(
                    (t: any) => t.completions && t.completions.length > 0,
                  ).length;
                  const total = plan.actionItems.length;
                  const avgFeedback = getAvgFeedback(plan);

                  let badgeClass = 'bg-gray-200 text-gray-700';
                  let badgeIcon = null;
                  if (avgFeedback === 'Happy') {
                    badgeClass = 'bg-green-100 text-green-800';
                    badgeIcon = <span className='mr-1'>😊</span>;
                  } else if (avgFeedback === 'Neutral') {
                    badgeClass = 'bg-yellow-100 text-yellow-800';
                    badgeIcon = <span className='mr-1'>😐</span>;
                  } else if (avgFeedback === 'Sad') {
                    badgeClass = 'bg-red-100 text-red-800';
                    badgeIcon = <span className='mr-1'>🙁</span>;
                  }

                  return (
                    <TableRow
                      key={sessionId}
                      className='border-b border-gray-200/40 last:border-b-0 hover:bg-gray-50/50 transition-colors h-[26px]'
                      onClick={() => router.push(`/practitioner/clients/${clientId}/plans/${plan.id}`)}
                    >
                      <TableCell className='py-1.5 px-2 sm:px-4 lg:px-6 text-gray-800 text-[12px] sm:text-[14px] lg:text-[16px] xl:text-[14px] truncate'>
                        {recordedAt
                          ? new Date(recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : '-'}
                      </TableCell>
                      <TableCell className='py-1.5 px-2 sm:px-4 lg:px-6 text-gray-800 text-[12px] sm:text-[14px] lg:text-[16px] xl:text-[14px]'>
                        {sessionTitle}
                      </TableCell>
                      <TableCell className='py-1.5 px-2 sm:px-4 lg:px-6 text-gray-800 text-[12px] sm:text-[14px] lg:text-[16px] xl:text-[14px]'>
                        {`${completed}/${total}`}
                      </TableCell>
                      <TableCell className='py-1.5 px-2 sm:px-4 lg:px-6 text-center'>
                        <span
                          className={`inline-flex items-center rounded-full px-5 py-1.5 text-sm font-semibold ${badgeClass}`}
                          style={{ minWidth: 80, justifyContent: 'center' }}
                        >
                          {badgeIcon}
                          {avgFeedback}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
