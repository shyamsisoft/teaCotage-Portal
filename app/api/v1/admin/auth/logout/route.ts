import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { executeQuery } from '@/lib/db';
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

      // 2. Fetch session and active user ID
      let userId: string | null = null;
      try {
        const [rows]: any = await executeQuery(
          `SELECT user_id FROM user_sessions WHERE session_token_hash = ? AND is_revoked = 0`,
          [tokenHash]
        );
        if (Array.isArray(rows) && rows.length > 0) {
          userId = rows[0].user_id;
        }
      } catch (dbErr) {
        console.error('Database query error during logout session lookup:', dbErr);
      }

      // 3. Mark session as revoked in database
      try {
        await executeQuery(
          `UPDATE user_sessions SET is_revoked = 1 WHERE session_token_hash = ?`,
          [tokenHash]
        );
      } catch (updateErr) {
        console.error('Database update error during logout session revocation:', updateErr);
      }

      // 4. Record Security Audit Log
      const clientIp = request.headers?.get?.('x-forwarded-for') || '127.0.0.1';
      const userAgent = request.headers?.get?.('user-agent') || 'Unknown';
      const auditId = crypto.randomUUID();

      try {
        await executeQuery(
          `INSERT INTO admin_audit_logs (id, user_id, event_type, ip_address, user_agent, metadata) 
           VALUES (?, ?, 'ADMIN_LOGOUT', ?, ?, ?)`,
          [auditId, userId, clientIp, userAgent, JSON.stringify({ timestamp: new Date().toISOString() })]
        );
      } catch (auditErr) {
        console.error('Database audit error during logout:', auditErr);
      }
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
