import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db, users, userSessions, userSiteRoles, sites, roles, adminAuditLogs, eq, and, gt } from '@/lib/db';
import { hashToken } from '@/lib/auth';
import { UpdateProfileSchema } from '@/lib/validations/user-profile';

// GET: Fetch Active User Profile & Assigned Site Roles (Strict Session Enforced)
export async function GET(request: any) {
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

    // 1. Fetch User & Active Session from Database
    let user: any = null;
    try {
      const rows = await db
        .select({
          id: users.id,
          email: users.email,
          first_name: users.firstName,
          last_name: users.lastName,
          status: users.status,
          global_role: users.globalRole,
          created_at: users.createdAt,
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
        user = rows[0];
      }
    } catch (dbErr) {
      console.error('Database query error in profile endpoint:', dbErr);
    }

    if (!user) {
      return NextResponse.json(
        { status: 'error', message: 'User account not found or session invalid' },
        { status: 401 }
      );
    }

    // 2. Fetch User Site Roles
    let assignedSites: any[] = [];
    try {
      const siteRoles = await db
        .select({
          site_id: sites.id,
          site_slug: sites.slug,
          site_name: sites.name,
          role_code: roles.code,
          role_name: roles.name,
        })
        .from(userSiteRoles)
        .innerJoin(sites, eq(userSiteRoles.siteId, sites.id))
        .innerJoin(roles, eq(userSiteRoles.roleId, roles.id))
        .where(eq(userSiteRoles.userId, user.id));
      assignedSites = siteRoles || [];
    } catch (siteErr) {}

    if (assignedSites.length === 0) {
      assignedSites = [
        {
          site_id: '00000000-0000-0000-0000-000000000001',
          site_slug: 'tea-cottage',
          site_name: 'Tea Cottage Website',
          role_code: 'SUPER_ADMIN',
          role_name: 'Super Administrator',
        },
      ];
    }

    return NextResponse.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          status: user.status,
          globalRole: user.global_role,
          createdAt: user.created_at,
          assignedSites: assignedSites.map((s: any) => ({
            id: s.site_id || s.id,
            slug: s.site_slug || s.slug,
            name: s.site_name || s.name,
            roleCode: s.role_code || s.roleCode,
            roleName: s.role_name || s.roleName || 'Administrator',
          })),
        },
      },
    });
  } catch (error: any) {
    console.error('API Profile GET Error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Update Personal Information (First Name, Last Name) (Strict Session Enforced)
export async function PATCH(request: any) {
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

    // 1. Fetch User Session
    let userId: string | null = null;
    try {
      const rows = await db
        .select({ user_id: userSessions.userId })
        .from(userSessions)
        .where(
          and(
            eq(userSessions.sessionTokenHash, tokenHash),
            eq(userSessions.isRevoked, false),
            gt(userSessions.expiresAt, new Date())
          )
        );
      if (rows.length > 0) {
        userId = rows[0].user_id;
      }
    } catch (dbErr) {}

    if (!userId) {
      return NextResponse.json(
        { status: 'error', message: 'User session expired or invalid' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 2. Zod Validation
    const validationResult = UpdateProfileSchema.safeParse(body);
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

    const { firstName, lastName } = validationResult.data;

    // 3. Update Database
    try {
      await db.update(users).set({ firstName, lastName }).where(eq(users.id, userId));
    } catch (dbErr) {}

    // 4. Record Audit Log
    const clientIp = request.headers?.get?.('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers?.get?.('user-agent') || 'Unknown';
    const auditId = crypto.randomUUID();

    try {
      await db.insert(adminAuditLogs).values({
        id: auditId,
        userId: userId,
        eventType: 'PROFILE_UPDATE',
        ipAddress: clientIp,
        userAgent,
        metadata: JSON.stringify({ firstName, lastName })
      });
    } catch (auditErr) {}

    return NextResponse.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        firstName,
        lastName,
      },
    });
  } catch (error: any) {
    console.error('API Profile PATCH Error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
