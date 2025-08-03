import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@repo/db';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      console.error('[SaveSubscription] Unauthorized request - no session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const subscription = await req.json();

    // Validate subscription data
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      console.error('[SaveSubscription] Invalid subscription data:', subscription);
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
    }

    const savedSubscription = await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        keys: subscription.keys,
        userId,
        updatedAt: new Date(),
      },
      create: {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userId,
      },
    });

    return NextResponse.json(
      {
        message: 'Subscription saved successfully.',
        subscriptionId: savedSubscription.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[SaveSubscription] Error saving subscription:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'Failed to save subscription',
          details: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to save subscription',
      },
      { status: 500 },
    );
  }
}
