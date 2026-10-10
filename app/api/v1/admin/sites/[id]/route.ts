import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db, sites, userSessions, users, adminAuditLogs, eq, and, gt } from '@/lib/db';
import { hashToken } from '@/lib/auth';
import { UpdateSiteSettingsSchema } from '@/lib/validations/site-settings';

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

// GET /api/v1/admin/sites/[id]
export async function GET(request: any, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized session' }, { status: 401 });
    }

    const siteId = params.id;
    const siteRows = await db
      .select({
        id: sites.id,
        slug: sites.slug,
        name: sites.name,
        domain: sites.domain,
        isActive: sites.isActive,
        createdAt: sites.createdAt,
        updatedAt: sites.updatedAt,
      })
      .from(sites)
      .where(eq(sites.id, siteId));

    if (siteRows.length === 0) {
      return NextResponse.json({ status: 'error', message: 'Site not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: 'success',
      data: {
        site: siteRows[0],
      },
    });
  } catch (error: any) {
    console.error('API Site GET ID Error:', error);
    return NextResponse.json({ status: 'error', message: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/v1/admin/sites/[id]
export async function PATCH(request: any, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized session' }, { status: 401 });
    }

    const siteId = params.id;
    const body = await request.json();
    const validation = UpdateSiteSettingsSchema.safeParse(body);

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

    const { name, domain, isActive } = validation.data;

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (domain !== undefined) updates.domain = domain;
    if (isActive !== undefined) updates.isActive = isActive;

    if (Object.keys(updates).length > 0) {
      await db.update(sites).set(updates).where(eq(sites.id, siteId));
    }

    // Audit log
    const clientIp = request.headers?.get?.('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers?.get?.('user-agent') || 'Unknown';
    await db.insert(adminAuditLogs).values({
      id: crypto.randomUUID(),
      userId: currentUser.id,
      eventType: 'SITE_UPDATE',
      ipAddress: clientIp,
      userAgent,
      metadata: JSON.stringify({ siteId, ...updates }),
    });

    return NextResponse.json({
      status: 'success',
      message: 'Site settings updated successfully',
      data: { siteId, ...updates },
    });
  } catch (error: any) {
    console.error('API Site PATCH ID Error:', error);
    return NextResponse.json({ status: 'error', message: 'Internal server error' }, { status: 500 });
  }
}
