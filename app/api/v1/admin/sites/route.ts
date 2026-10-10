import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db, sites, userSessions, users, eq, and, gt } from '@/lib/db';
import { hashToken } from '@/lib/auth';

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

// GET /api/v1/admin/sites: List all managed sites
export async function GET() {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized session' }, { status: 401 });
    }

    const allSites = await db
      .select({
        id: sites.id,
        slug: sites.slug,
        name: sites.name,
        domain: sites.domain,
        isActive: sites.isActive,
        createdAt: sites.createdAt,
        updatedAt: sites.updatedAt,
      })
      .from(sites);

    return NextResponse.json({
      status: 'success',
      data: {
        sites: allSites,
        total: allSites.length,
      },
    });
  } catch (error: any) {
    console.error('API Sites GET Error:', error);
    return NextResponse.json({ status: 'error', message: 'Internal server error' }, { status: 500 });
  }
}
