import { GET } from '@/app/api/v1/admin/navigation/me/route';
import { db } from '@/lib/db';

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

function createMockNavRequest() {
  return {
    headers: {
      get: (headerName: string) => {
        if (headerName === 'x-forwarded-for') return '127.0.0.1';
        return null;
      },
    },
  } as any;
}

describe('Automated Integration Test: GET /api/v1/admin/navigation/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. Should return 401 Unauthorized when session cookie is missing', async () => {
    mockCookieStore.get.mockReturnValueOnce(undefined);

    const req = createMockNavRequest();
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.status).toBe('error');
    expect(json.message).toContain('Unauthorized');
  });

  it('2. Should return authorized navigation tree for authenticated session', async () => {
    mockCookieStore.get.mockReturnValueOnce({ value: 'valid-session-123' });

    mockDb.where
      .mockResolvedValueOnce([
        {
          id: 'usr-admin-01',
          email: 'admin@teacottage.com',
          first_name: 'Admin',
          last_name: 'User',
          global_role: 'SUPER_ADMIN',
        },
      ]) // User session lookup
      .mockResolvedValueOnce([
        {
          site_id: '00000000-0000-0000-0000-000000000001',
          site_slug: 'tea-cottage',
          site_name: 'Tea Cottage Website',
          role_code: 'SUPER_ADMIN',
        },
      ]) // User site roles
      .mockResolvedValueOnce([
        { code: 'content:pages:preview' }, { code: 'media:upload' },
      ]); // User permissions

    const req = createMockNavRequest();
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('success');
    expect(json.data.user.email).toBe('admin@teacottage.com');
    expect(Array.isArray(json.data.navigation)).toBe(true);
    expect(json.data.navigation.length).toBeGreaterThan(0);
  });
});
