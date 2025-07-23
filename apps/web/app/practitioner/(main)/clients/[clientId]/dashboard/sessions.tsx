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
          className='text-2xl md:text-3xl lg:text-4xl font-semibold'
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          Past Sessions
        </h2>
      </div>
      <div className='overflow-x-auto'>
        <div className='bg-white rounded-2xl shadow-md p-0 min-w-[400px] sm:min-w-0'>
          <Table className='min-w-[600px] sm:min-w-full bg-white rounded-2xl overflow-hidden'>
            <TableHeader>
              <TableRow className='bg-white'>
                <TableHead className='px-3 sm:px-7 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
                  Session Title
                </TableHead>
                <TableHead className='px-3 sm:px-7 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
                  Date
                </TableHead>
                <TableHead className='px-3 sm:px-7 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
                  Duration
                </TableHead>
                <TableHead className='px-3 sm:px-7 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
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
                      className='cursor-pointer hover:bg-gray-50 transition-colors border-b last:border-b-0 border-[#ececec]'
                      onClick={() => router.push(`/practitioner/sessions/${session.id}`)}
                    >
                      <TableCell className='px-3 sm:px-7 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900'>
                        {session.title || 'Untitled Session'}
                      </TableCell>
                      <TableCell className='px-3 sm:px-7 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900'>
                        {new Date(session.recordedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className='px-3 sm:px-7 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900'>
                        {duration}
                      </TableCell>
                      <TableCell className='px-3 sm:px-7 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900'>
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
