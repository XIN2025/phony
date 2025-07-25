import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import { Card } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Skeleton } from '@repo/ui/components/skeleton';
import { useRouter } from 'next/navigation';
import { useGetSessionsByClient } from '@/lib/hooks/use-api';

export default function SessionsTab({ clientId }: { clientId: string }) {
  const router = useRouter();
  const { data: sessions = [], isLoading } = useGetSessionsByClient(clientId);

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-row items-center justify-between gap-2 sm:gap-4 mb-4'>
        <h2
          className='text-2xl lg:text-[24px] xl:text-[28px] font-semibold'
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          Past Sessions
        </h2>
      </div>
      <div className='overflow-x-auto'>
        <div className='bg-white rounded-2xl shadow-md p-0 min-w-[400px] sm:min-w-0'>
          <Table className='min-w-[700px] w-full text-[12px] sm:text-[14px] lg:text-[16px] xl:text-[14px]'>
            <colgroup>
              <col className='w-[32%] min-w-[120px]' />
              <col className='w-[22%] min-w-[90px]' />
              <col className='w-[26%] min-w-[90px]' />
              <col className='w-[20%] min-w-[80px]' />
            </colgroup>
            <TableHeader>
              <TableRow className='border-b border-gray-200/60 bg-gray-50/50'>
                <TableHead className='py-3 px-2 sm:px-4 lg:px-6 text-left font-semibold text-gray-700 text-[12px] sm:text-[14px] lg:text-[16px] truncate'>
                  Session Title
                </TableHead>
                <TableHead className='py-3 px-2 sm:px-4 lg:px-6 text-left font-semibold text-gray-700 text-[12px] sm:text-[14px] lg:text-[16px]'>
                  Date
                </TableHead>
                <TableHead className='py-3 px-2 sm:px-4 lg:px-6 text-left font-semibold text-gray-700 text-[12px] sm:text-[14px] lg:text-[16px] truncate'>
                  Duration
                </TableHead>
                <TableHead className='py-3 px-2 sm:px-4 lg:px-6 text-center font-semibold text-gray-700 text-[12px] sm:text-[14px] lg:text-[16px] truncate'>
                  Summary
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className='text-center text-muted-foreground py-8'>
                    <Skeleton className='h-8 w-full' />
                  </TableCell>
                </TableRow>
              ) : sessions.length > 0 ? (
                sessions.map((session) => {
                  let duration = '—';
                  if (
                    typeof session.durationSeconds === 'number' &&
                    !isNaN(session.durationSeconds) &&
                    session.durationSeconds > 0
                  ) {
                    const mins = Math.floor(session.durationSeconds / 60);
                    const secs = session.durationSeconds % 60;
                    duration = `${mins}m ${secs.toString().padStart(2, '0')}s`;
                  }
                  const summary = session.summaryTitle || session.title || 'No summary available.';
                  return (
                    <TableRow
                      key={session.id}
                      className='border-b border-gray-200/40 last:border-b-0 hover:bg-gray-50/50 transition-colors h-[26px]'
                      onClick={() => router.push(`/practitioner/sessions/${session.id}`)}
                    >
                      <TableCell className='py-1.5 px-2 sm:px-4 lg:px-6 text-gray-800 text-[12px] sm:text-[14px] lg:text-[16px] xl:text-[14px] truncate'>
                        {session.title || 'Untitled Session'}
                      </TableCell>
                      <TableCell className='py-1.5 px-2 sm:px-4 lg:px-6 text-gray-800 text-[12px] sm:text-[14px] lg:text-[16px] xl:text-[14px]'>
                        {new Date(session.recordedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className='py-1.5 px-2 sm:px-4 lg:px-6 text-gray-800 text-[12px] sm:text-[14px] lg:text-[16px] xl:text-[14px]'>
                        {duration}
                      </TableCell>
                      <TableCell className='py-1.5 px-2 sm:px-4 lg:px-6 text-center text-gray-800 text-[12px] sm:text-[14px] lg:text-[16px] xl:text-[14px]'>
                        {summary}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className='text-center text-muted-foreground'>
                    No sessions recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
