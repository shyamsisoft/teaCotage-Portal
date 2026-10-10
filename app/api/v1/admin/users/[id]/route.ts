import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db, users, userSessions, userSiteRoles, sites, roles, adminAuditLogs, eq, and, gt } from '@/lib/db';
import { hashToken } from '@/lib/auth';
import { UpdateUserSchema } from '@/lib/validations/user-management';

async function getSessionUser() {
  let sessionToken: string | undefined;
  try {
    const cookieStore = cookies();
    sessionToken = cookieStore.get('cms_admin_session')?.value;
  } catch (err) {}

  if (!sessionToken) return null;

  const tokenHash = hashToken(sessionToken);

  try {
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        status: users.status,
        globalRole: users.globalRole,
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

    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    return null;
  }
}

// GET /api/v1/admin/users/[id]
export async function GET(request: any, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized session' }, { status: 401 });
    }

    const userId = params.id;
    const userRows = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        status: users.status,
        globalRole: users.globalRole,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (userRows.length === 0) {
      return NextResponse.json({ status: 'error', message: 'User not found' }, { status: 404 });
    }

    const user = userRows[0];

    // Fetch site roles
    const siteRoles = await db
      .select({
        siteId: sites.id,
        siteSlug: sites.slug,
        siteName: sites.name,
        roleId: roles.id,
        roleCode: roles.code,
        roleName: roles.name,
      })
      .from(userSiteRoles)
      .innerJoin(sites, eq(userSiteRoles.siteId, sites.id))
      .innerJoin(roles, eq(userSiteRoles.roleId, roles.id))
      .where(eq(userSiteRoles.userId, userId));

    return NextResponse.json({
      status: 'success',
      data: {
        user: {
          ...user,
          assignedSites: siteRoles,
        },
      },
    });
  } catch (error: any) {
    console.error('API User GET ID Error:', error);
    return NextResponse.json({ status: 'error', message: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/v1/admin/users/[id]
export async function PATCH(request: any, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized session' }, { status: 401 });
    }

    const userId = params.id;
    const body = await request.json();
    const validation = UpdateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Validation failed',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { firstName, lastName, status, globalRole, siteRoles } = validation.data;

    const updates: Record<string, any> = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (status !== undefined) updates.status = status;
    if (globalRole !== undefined) updates.globalRole = globalRole;

    if (Object.keys(updates).length > 0) {
      await db.update(users).set(updates).where(eq(users.id, userId));
    }

    if (siteRoles !== undefined) {
      // Delete existing site roles
      await db.delete(userSiteRoles).where(eq(userSiteRoles.userId, userId));
      // Insert updated site roles
      for (const sr of siteRoles) {
        await db.insert(userSiteRoles).values({
          userId,
          siteId: sr.siteId,
          roleId: sr.roleId,
        });
      }
    }

    // Audit log
    const clientIp = request.headers?.get?.('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers?.get?.('user-agent') || 'Unknown';
    await db.insert(adminAuditLogs).values({
      id: crypto.randomUUID(),
      userId: currentUser.id,
      eventType: 'USER_UPDATE',
      ipAddress: clientIp,
      userAgent,
      metadata: JSON.stringify({ targetUserId: userId, ...updates }),
    });

    return NextResponse.json({
      status: 'success',
      message: 'User account updated successfully',
      data: { userId, ...updates },
    });
  } catch (error: any) {
    console.error('API User PATCH ID Error:', error);
    return NextResponse.json({ status: 'error', message: 'Internal server error' }, { status: 500 });
  }
}
