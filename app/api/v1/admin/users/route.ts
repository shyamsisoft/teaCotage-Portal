import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db, users, userSessions, userSiteRoles, sites, roles, adminAuditLogs, eq, and, gt, like, sql } from '@/lib/db';
import { hashToken, hashPassword } from '@/lib/auth';
import { CreateUserSchema, UserQuerySchema } from '@/lib/validations/user-management';

// Helper: Verify active session & check permissions
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

// GET: List users with search & filters
export async function GET(request: any) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const role = searchParams.get('role') || undefined;
    const status = searchParams.get('status') || undefined;

    // Fetch users
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        status: users.status,
        globalRole: users.globalRole,
        createdAt: users.createdAt,
      })
      .from(users);

    let filtered = Array.isArray(allUsers) ? allUsers : [];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q)
      );
    }

    if (role) {
      filtered = filtered.filter((u) => u.globalRole === role);
    }

    if (status) {
      filtered = filtered.filter((u) => u.status === status);
    }

    // Fetch site roles for all returned users
    const userIds = filtered.map((u) => u.id);
    let siteRoleMap: Record<string, any[]> = {};

    if (userIds.length > 0) {
      try {
        const siteRoleRows = await db
          .select({
            userId: userSiteRoles.userId,
            siteId: sites.id,
            siteSlug: sites.slug,
            siteName: sites.name,
            roleId: roles.id,
            roleCode: roles.code,
            roleName: roles.name,
          })
          .from(userSiteRoles)
          .innerJoin(sites, eq(userSiteRoles.siteId, sites.id))
          .innerJoin(roles, eq(userSiteRoles.roleId, roles.id));

        for (const row of siteRoleRows) {
          if (!siteRoleMap[row.userId]) siteRoleMap[row.userId] = [];
          siteRoleMap[row.userId].push({
            siteId: row.siteId,
            siteSlug: row.siteSlug,
            siteName: row.siteName,
            roleId: row.roleId,
            roleCode: row.roleCode,
            roleName: row.roleName,
          });
        }
      } catch (err) {}
    }

    const data = filtered.map((u) => ({
      ...u,
      assignedSites: siteRoleMap[u.id] || [],
    }));

    return NextResponse.json({
      status: 'success',
      data: {
        users: data,
        total: data.length,
      },
    });
  } catch (error: any) {
    console.error('API Users GET Error:', error);
    return NextResponse.json({ status: 'error', message: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new user
export async function POST(request: any) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized session' }, { status: 401 });
    }

    const body = await request.json();
    const validation = CreateUserSchema.safeParse(body);

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

    const { email, firstName, lastName, password, globalRole, siteRoles } = validation.data;

    // Check email uniqueness
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return NextResponse.json(
        { status: 'error', message: 'Email address is already in use' },
        { status: 400 }
      );
    }

    const newUserId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    // Insert user
    await db.insert(users).values({
      id: newUserId,
      email,
      passwordHash,
      firstName,
      lastName,
      status: 'ACTIVE',
      globalRole,
    });

    // Insert site roles
    if (siteRoles && siteRoles.length > 0) {
      for (const sr of siteRoles) {
        await db.insert(userSiteRoles).values({
          userId: newUserId,
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
      eventType: 'USER_CREATE',
      ipAddress: clientIp,
      userAgent,
      metadata: JSON.stringify({ createdUserId: newUserId, email, globalRole }),
    });

    return NextResponse.json(
      {
        status: 'success',
        message: 'User account created successfully',
        data: {
          user: {
            id: newUserId,
            email,
            firstName,
            lastName,
            status: 'ACTIVE',
            globalRole,
          },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API Users POST Error:', error);
    return NextResponse.json({ status: 'error', message: 'Internal server error' }, { status: 500 });
  }
}
