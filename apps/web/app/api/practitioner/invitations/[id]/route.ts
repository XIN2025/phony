import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(
      `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/practitioner/invitations/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.user.token}`,
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Invitation deleted successfully' });
  } catch (error) {
    console.error('Error deleting invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
