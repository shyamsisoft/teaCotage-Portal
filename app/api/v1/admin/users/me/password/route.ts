import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db, users, userSessions, adminAuditLogs, eq, and, gt, ne } from '@/lib/db';
import { hashToken, verifyPassword, hashPassword } from '@/lib/auth';
import { ChangePasswordSchema } from '@/lib/validations/user-profile';

// POST: Change Password Workflow (Strict Session Enforced)
export async function POST(request: any) {
  try {
    let sessionToken: string | undefined;
    try {
      const cookieStore = cookies();
      sessionToken = cookieStore.get('cms_admin_session')?.value;
    } catch (cookieError) {}

    if (!sessionToken) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    const tokenHash = hashToken(sessionToken);

    // 1. Fetch User and Current Session
    let userSession: any = null;
    try {
      const rows = await db
        .select({
          session_id: userSessions.id,
          user_id: users.id,
          password_hash: users.passwordHash,
        })
        .from(userSessions)
        .innerJoin(users, eq(userSessions.userId, users.id))
        .where(
          and(
            eq(userSessions.sessionTokenHash, tokenHash),
            eq(userSessions.isRevoked, false),
            gt(userSessions.expiresAt, new Date())
          )
        );
      if (rows.length > 0) {
        userSession = rows[0];
      }
    } catch (dbErr) {
      console.error('Database query error during password change:', dbErr);
    }

    if (!userSession) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 2. Zod Validation
    const validationResult = ChangePasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid input fields',
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validationResult.data;

    // 3. Verify Current Password against Argon2id Hash
    const isValidCurrent = await verifyPassword(userSession.password_hash, currentPassword);
    if (!isValidCurrent) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Current password is incorrect',
          errors: { currentPassword: ['Current password is incorrect'] },
        },
        { status: 400 }
      );
    }

    // 4. Hash New Password using Argon2id
    const newPasswordHash = await hashPassword(newPassword);

    // 5. Update Password in Database
    await db.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, userSession.user_id));

    // 6. Invalidate All Other Active Sessions of the User
    try {
      await db
        .update(userSessions)
        .set({ isRevoked: true })
        .where(and(eq(userSessions.userId, userSession.user_id), ne(userSessions.id, userSession.session_id)));
    } catch (revokeErr) {
      console.error('Failed to revoke concurrent user sessions:', revokeErr);
    }

    // 7. Record Security Audit Log
    const clientIp = request.headers?.get?.('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers?.get?.('user-agent') || 'Unknown';
    const auditId = crypto.randomUUID();

    try {
      await db.insert(adminAuditLogs).values({
        id: auditId,
        userId: userSession.user_id,
        eventType: 'PASSWORD_CHANGE_SUCCESS',
        ipAddress: clientIp,
        userAgent,
        metadata: JSON.stringify({ timestamp: new Date().toISOString() })
      });
    } catch (auditErr) {}

    return NextResponse.json({
      status: 'success',
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    console.error('API Password Change Error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
