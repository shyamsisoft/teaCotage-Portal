import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db, userSessions, adminAuditLogs, eq, and } from '@/lib/db';
import { hashToken } from '@/lib/auth';

export async function POST(request: any) {
  try {
    let sessionToken: string | undefined;

    // 1. Retrieve session token from cookies
    try {
      const cookieStore = cookies();
      sessionToken = cookieStore.get('cms_admin_session')?.value;
    } catch (cookieError) {
      // Handle headless or mocked test environments
    }

    if (sessionToken) {
      const tokenHash = hashToken(sessionToken);
      let userId: string | null = null;
      const clientIp = request.headers?.get?.('x-forwarded-for') || '127.0.0.1';
      const userAgent = request.headers?.get?.('user-agent') || 'Unknown';
      const auditId = crypto.randomUUID();

      try {
        const rows = await db
          .select({ userId: userSessions.userId })
          .from(userSessions)
          .where(and(eq(userSessions.sessionTokenHash, tokenHash), eq(userSessions.isRevoked, false)));
        if (rows.length > 0) {
          userId = rows[0].userId;
        }
      } catch (err) {
        console.error(err);
      }

      await Promise.all([
        db
          .update(userSessions)
          .set({ isRevoked: true })
          .where(eq(userSessions.sessionTokenHash, tokenHash))
          .catch(() => {}),
        db
          .insert(adminAuditLogs)
          .values({
            id: auditId,
            userId: userId,
            eventType: 'ADMIN_LOGOUT',
            ipAddress: clientIp,
            userAgent: userAgent,
            metadata: JSON.stringify({ timestamp: new Date().toISOString() }),
          })
          .catch(() => {}),
      ]);
    }

    // 5. Invalidate cookie via Next.js headers cookie store
    try {
      const cookieStore = cookies();
      cookieStore.set('cms_admin_session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        expires: new Date(0),
      });
    } catch (cookieError) {
      // Ignore in headless test environments
    }

    return NextResponse.json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    console.error('API Auth Logout Error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
