import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { useGetClient } from '@/lib/hooks/use-api';
import { getAvatarUrl, getInitials, getFileUrl } from '@/lib/utils';

export default function ProfileTab({ clientId }: { clientId: string }) {
  const [showIntake, setShowIntake] = useState(true);
  const { data: client, isLoading: isClientLoading } = useGetClient(clientId);

  if (isClientLoading || !client) {
    return <div className='flex items-center justify-center min-h-screen'>Loading...</div>;
  }

  const dob = client?.dob || '';
  const occupation = client?.profession || '';

  return (
    <div className='w-full flex flex-col pt-6 px-2 sm:px-0 min-h-screen max-w-full overflow-x-hidden'>
      <div className='w-full flex flex-col gap-4 mx-auto'>
        {/* Heading row */}

        {/* Top section: Two-column grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 px-2 md:px-8 gap-6 max-w-full lg:gap-4 lg:md:px-4'>
          {/* Personal Details */}
          <div className='bg-white rounded-2xl shadow-md p-4 md:p-8 flex flex-col gap-4 min-h-[180px] md:min-h-[260px] lg:p-4'>
            <div className='flex items-center gap-4 mb-4'>
              <Avatar className='h-16 w-16 border-2 border-gray-200'>
                <AvatarImage src={getAvatarUrl(client.avatarUrl, client)} />
                <AvatarFallback className='text-2xl'>
                  {getInitials({ firstName: client.firstName, lastName: client.lastName })}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className='font-semibold text-xl'>
                  {client.firstName} {client.lastName}
                </div>
              </div>
            </div>
            <div className='grid grid-cols-1 gap-2 text-base'>
              <div>
                <span className='font-semibold'>Email ID:</span> <span className='font-normal'>{client.email}</span>
              </div>
              <div>
                <span className='font-semibold'>Phone Number:</span>{' '}
                <span className='font-normal'>{client.phoneNumber || '-'}</span>
              </div>
              <div>
                <span className='font-semibold'>DOB:</span> <span className='font-normal'>{dob}</span>
              </div>
              <div>
                <span className='font-semibold'>Occupation:</span> <span className='font-normal'>{occupation}</span>
              </div>
              <div>
                <span className='font-semibold'>Client Since:</span>{' '}
                <span className='font-normal'>
                  {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'}
                </span>
              </div>
            </div>
          </div>
          {/* Client Information */}
          <div className='bg-white rounded-2xl shadow-md p-8  flex flex-col gap-4 min-h-[260px] lg:p-4'>
            <div className='font-semibold text-xl mb-4'>Client Information</div>
            <div className='grid grid-cols-1 gap-2 text-base'>{/* Removed medications UI block */}</div>
          </div>
        </div>
        {/* Intake Survey Responses */}
        <div className='w-full px-2 md:px-8 max-w-full lg:md:px-4'>
          <div className='flex justify-end mb-2'>
            <button
              className='border border-gray-300 rounded-full px-5 py-1.5 text-sm font-medium bg-white hover:bg-gray-100 transition shadow-sm'
              onClick={() => setShowIntake((v) => !v)}
            >
              {showIntake ? 'Hide Intake Survey Responses' : 'Show Intake Survey Responses'}
            </button>
          </div>
          {showIntake && (
            <div className='bg-white rounded-2xl shadow-md px-2 p-4 md:p-8 lg:p-4'>
              <div className='font-semibold text-xl mb-1'>Intake Survey Responses</div>
              {client.intakeFormSubmission ? (
                <>
                  <div className='text-xs text-gray-500 mb-6'>
                    Submitted on {new Date(client.intakeFormSubmission.submittedAt).toLocaleDateString()}
                  </div>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {client.intakeFormSubmission.form.questions.map((q: any) => {
                      const answer = client.intakeFormSubmission.answers.find((a: any) => a.questionId === q.id);
                      const answerValue = answer?.value;
                      const renderAnswerValue = () => {
                        if (
                          q.type === 'FILE_UPLOAD' &&
                          typeof answerValue === 'string' &&
                          answerValue.startsWith('/uploads/')
                        ) {
                          const fileUrl = getFileUrl(answerValue);
                          const fileExtension = answerValue.split('.').pop()?.toLowerCase();
                          if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(fileExtension || '')) {
                            return (
                              <div className='space-y-2'>
                                <img
                                  src={fileUrl}
                                  alt='Uploaded file'
                                  className='max-w-full max-h-48 rounded-md border'
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                                <a
                                  href={fileUrl}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-blue-600 hover:text-blue-800 underline text-sm hidden'
                                >
                                  View full size
                                </a>
                              </div>
                            );
                          }
                          if (fileExtension === 'pdf') {
                            return (
                              <div className='space-y-2'>
                                <iframe src={fileUrl} className='w-full h-48 border rounded-md' title='PDF Preview' />
                                <a
                                  href={fileUrl}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-blue-600 hover:text-blue-800 underline text-sm'
                                >
                                  Download PDF
                                </a>
                              </div>
                            );
                          }
                          return (
                            <a
                              href={fileUrl}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-blue-600 hover:text-blue-800 underline'
                            >
                              Download file
                            </a>
                          );
                        }
                        return answerValue || '-';
                      };
                      return (
                        <div key={q.id} className='mb-2'>
                          <div className='font-medium text-base mb-1'>{q.text}</div>
                          <div className='bg-[#F6F6F6] rounded-xl px-4 py-3 text-base'>{renderAnswerValue()}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className='text-gray-500 text-base'>No intake survey responses found.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
