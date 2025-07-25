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
        <h2 className='text-2xl md:text-3xl  font-semibold' style={{ fontFamily: "'DM Serif Display', serif" }}>
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
          <Table className='min-w-full bg-white rounded-2xl overflow-hidden'>
            <TableHeader>
              <TableRow className='bg-white'>
                <TableHead className='px-7 py-4 text-left text-sm font-bold text-gray-800 border-b border-[#e5e5e5] lg:px-4 lg:py-2'>
                  Date
                </TableHead>
                <TableHead className='px-7 py-4 text-left text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
                  Session Title
                </TableHead>
                <TableHead className='px-7 py-4 text-left text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
                  Tasks
                </TableHead>
                <TableHead className='px-0 py-4 text-left text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
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
                  } else if (avgFeedback === 'Nil') {
                    badgeClass = 'bg-gray-200 text-gray-700';
                    badgeIcon = null;
                  }
                  return (
                    <TableRow
                      key={plan.id}
                      className='hover:bg-gray-50 transition-colors border-b last:border-b-0 border-[#ececec] cursor-pointer'
                      onClick={() => router.push(`/practitioner/clients/${clientId}/plans/${plan.id}`)}
                    >
                      <TableCell className='px-7 py-5 whitespace-nowrap text-sm text-gray-900 lg:px-4 lg:py-2'>
                        {recordedAt
                          ? new Date(recordedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: '2-digit',
                            })
                          : '--'}
                      </TableCell>
                      <TableCell className='px-7 py-5 whitespace-nowrap text-sm text-gray-900'>
                        {sessionTitle || 'Untitled Session'}
                      </TableCell>
                      <TableCell className='px-7 py-5 whitespace-nowrap text-sm text-gray-900'>{total}</TableCell>
                      <TableCell className='px-4 py-5 whitespace-nowrap lg:px-2 lg:py-1'>
                        <span
                          className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold ${badgeClass}`}
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
