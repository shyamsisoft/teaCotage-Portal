import { GET, PATCH } from '@/app/api/v1/admin/users/me/route';
import { POST as changePasswordPost } from '@/app/api/v1/admin/users/me/password/route';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

const mockCookieStore = {
  get: jest.fn(),
};

// Mock DB execution for automated route testing
jest.mock('@/lib/db', () => {
  const mockDb = {
    select: jest.fn().mockReturnThis(),
    selectDistinct: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue([]),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
  };
  return {
    db: mockDb,
    userSessions: {},
    users: {},
    adminAuditLogs: {},
    sites: {},
    roles: {},
    userSiteRoles: {},
  rolePermissions: {},
  permissions: {},
  eq: jest.fn((col, val) => ({ col, val })),
  and: jest.fn((...args) => args),
  gte: jest.fn((col, val) => ({ col, val })),
  lt: jest.fn((col, val) => ({ col, val })),
  gt: jest.fn((col, val) => ({ col, val })),
  ne: jest.fn((col, val) => ({ col, val })),
  isNull: jest.fn((col) => col),
  sql: jest.fn(),
  desc: jest.fn(),
  };
});

// Mock Next.js cookies
const mockDb = db as any;

jest.mock('next/headers', () => ({
  cookies: () => mockCookieStore,
}));

function createMockProfileRequest(body?: any) {
  return {
    json: async () => body || {},
    headers: {
      get: (headerName: string) => {
        if (headerName === 'x-forwarded-for') return '127.0.0.1';
        return null;
      },
    },
  } as any;
}

describe('Automated Integration Test: User Profile & Security API Gateway', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. GET /api/v1/admin/users/me: Should return 401 when unauthenticated', async () => {
    mockCookieStore.get.mockReturnValueOnce(undefined);

    const req = createMockProfileRequest();
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.status).toBe('error');
  });

  it('2. GET /api/v1/admin/users/me: Should return user profile for active session', async () => {
    mockCookieStore.get.mockReturnValueOnce({ value: 'valid-profile-token' });

    mockDb.where
      .mockResolvedValueOnce([
        {
          id: 'usr-001',
          email: 'admin@teacottage.com',
          first_name: 'Admin',
          last_name: 'User',
          status: 'ACTIVE',
          global_role: 'SUPER_ADMIN',
          created_at: '2026-10-08T00:00:00.000Z',
        },
      ]) // User session lookup
      .mockResolvedValueOnce([
        {
          site_id: 'site-01',
          site_slug: 'tea-cottage',
          site_name: 'Tea Cottage Website',
          role_code: 'SUPER_ADMIN',
          role_name: 'Super Administrator',
        },
      ]); // Site roles

    const req = createMockProfileRequest();
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('success');
    expect(json.data.user.email).toBe('admin@teacottage.com');
  });

  it('3. PATCH /api/v1/admin/users/me: Should update first and last name', async () => {
    mockCookieStore.get.mockReturnValueOnce({ value: 'valid-profile-token' });

    mockDb.where
      .mockResolvedValueOnce([{ user_id: 'usr-001' }]) // Session check
      .mockResolvedValueOnce([]); // Update user
      
    mockDb.values.mockResolvedValueOnce([]); // Audit log

    const req = createMockProfileRequest({ firstName: 'UpdatedFirst', lastName: 'UpdatedLast' });
    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('success');
    expect(json.data.firstName).toBe('UpdatedFirst');
  });

  it('4. POST /api/v1/admin/users/me/password: Should reject invalid current password', async () => {
    mockCookieStore.get.mockReturnValueOnce({ value: 'valid-profile-token' });
    const validHash = await hashPassword('CorrectPassword123!');

    mockDb.where.mockResolvedValueOnce([
      {
        session_id: 'sess-01',
        user_id: 'usr-001',
        password_hash: validHash,
      },
    ]);

    const req = createMockProfileRequest({
      currentPassword: 'WrongPassword123!',
      newPassword: 'NewPassword123!@#',
      confirmPassword: 'NewPassword123!@#',
    });

    const res = await changePasswordPost(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toContain('Current password is incorrect');
  });
});
