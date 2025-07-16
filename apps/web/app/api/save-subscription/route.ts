import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@repo/db';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const subscription = await req.json();
  // Save or update the subscription for this user
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: { keys: subscription.keys, userId },
    create: { endpoint: subscription.endpoint, keys: subscription.keys, userId },
  });
  return NextResponse.json({ message: 'Subscription saved.' }, { status: 201 });
}
