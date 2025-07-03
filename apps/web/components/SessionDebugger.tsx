'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SessionDebugger() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log('[SessionDebugger] Session update:', {
      status,
      hasSession: !!session,
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
            firstName: session.user.firstName,
            lastName: session.user.lastName,
          }
        : null,
      expires: session?.expires,
    });
  }, [session, status]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        maxWidth: '300px',
        zIndex: 9999,
      }}
    >
      <div>
        <strong>Session Status:</strong> {status}
      </div>
      <div>
        <strong>Has Session:</strong> {session ? 'Yes' : 'No'}
      </div>
      {session?.user && (
        <>
          <div>
            <strong>User ID:</strong> {session.user.id}
          </div>
          <div>
            <strong>Email:</strong> {session.user.email}
          </div>
          <div>
            <strong>Role:</strong> {session.user.role}
          </div>
          <div>
            <strong>Name:</strong> {session.user.firstName} {session.user.lastName}
          </div>
        </>
      )}
      {session?.expires && (
        <div>
          <strong>Expires:</strong> {new Date(session.expires).toLocaleString()}
        </div>
      )}
    </div>
  );
}
