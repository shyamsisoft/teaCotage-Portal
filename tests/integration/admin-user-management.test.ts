import { GET, POST } from '@/app/api/v1/admin/users/route';
import { GET as getById, PATCH } from '@/app/api/v1/admin/users/[id]/route';
import { db } from '@/lib/db';

const mockCookieStore = {
  get: jest.fn(),
};

// Use var for jest hoisted scope
var mockWhere = jest.fn().mockResolvedValue([]);

jest.mock('@/lib/db', () => {
  const mockDb = {
    select: jest.fn().mockReturnThis(),
    selectDistinct: jest.fn().mockReturnThis(),
    from: jest.fn(() => {
      const promise = Promise.resolve([]);
      (promise as any).innerJoin = jest.fn(() => promise);
      (promise as any).where = mockWhere;
      return promise;
    }),
    where: mockWhere,
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([]) }),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue([]),
    delete: jest.fn().mockReturnThis(),
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
    like: jest.fn((col, val) => ({ col, val })),
    sql: jest.fn(),
    desc: jest.fn(),
  };
});

jest.mock('next/headers', () => ({
  cookies: () => mockCookieStore,
}));

function createMockRequest(url: string, method = 'GET', body?: any) {
  return {
    url,
    method,
    json: async () => body || {},
    headers: {
      get: (headerName: string) => {
        if (headerName === 'x-forwarded-for') return '127.0.0.1';
        return null;
      },
    },
  } as any;
}

describe('Automated Integration Test: User Management API Gateway', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. GET /api/v1/admin/users: Should return 401 when unauthenticated', async () => {
    mockCookieStore.get.mockReturnValueOnce(undefined);

    const req = createMockRequest('http://localhost:3000/api/v1/admin/users');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.status).toBe('error');
  });

  it('2. GET /api/v1/admin/users: Should list staff user accounts for active session (TC-UM-001)', async () => {
    mockCookieStore.get.mockReturnValueOnce({ value: 'valid-session-token' });

    // 1. Session lookup
    mockWhere.mockResolvedValueOnce([
      {
        id: 'usr-001',
        email: 'admin@teacottage.com',
        firstName: 'Super',
        lastName: 'Admin',
        status: 'ACTIVE',
        globalRole: 'SUPER_ADMIN',
      },
    ]);

    const req = createMockRequest('http://localhost:3000/api/v1/admin/users');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('success');
  });

  it('3. POST /api/v1/admin/users: Should return 400 when validation fails (TC-UM-002)', async () => {
    mockCookieStore.get.mockReturnValueOnce({ value: 'valid-session-token' });

    mockWhere.mockResolvedValueOnce([
      {
        id: 'usr-001',
        email: 'admin@teacottage.com',
        firstName: 'Super',
        lastName: 'Admin',
        status: 'ACTIVE',
        globalRole: 'SUPER_ADMIN',
      },
    ]);

    const req = createMockRequest('http://localhost:3000/api/v1/admin/users', 'POST', {
      email: 'invalid-email',
      firstName: '',
      lastName: '',
      password: 'weak',
      globalRole: 'INVALID',
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.status).toBe('error');
  });

  it('4. POST /api/v1/admin/users: Should create staff user account (TC-UM-002)', async () => {
    mockCookieStore.get.mockReturnValueOnce({ value: 'valid-session-token' });

    mockWhere
      .mockResolvedValueOnce([
        {
          id: 'admin-001',
          email: 'admin@teacottage.com',
          firstName: 'Super',
          lastName: 'Admin',
          status: 'ACTIVE',
          globalRole: 'SUPER_ADMIN',
        },
      ]) // Session check
      .mockResolvedValueOnce([]); // Email uniqueness check

    const req = createMockRequest('http://localhost:3000/api/v1/admin/users', 'POST', {
      email: 'editor@teacottage.com',
      firstName: 'Jane',
      lastName: 'Editor',
      password: 'StrongPassword123!',
      globalRole: 'CONTENT_EDITOR',
      siteRoles: [],
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.status).toBe('success');
    expect(json.data.user.email).toBe('editor@teacottage.com');
  });

  it('5. PATCH /api/v1/admin/users/[id]: Should update status to SUSPENDED (TC-UM-003)', async () => {
    mockCookieStore.get.mockReturnValueOnce({ value: 'valid-session-token' });

    mockWhere.mockResolvedValueOnce([
      {
        id: 'admin-001',
        email: 'admin@teacottage.com',
        firstName: 'Super',
        lastName: 'Admin',
        status: 'ACTIVE',
        globalRole: 'SUPER_ADMIN',
      },
    ]);

    const req = createMockRequest('http://localhost:3000/api/v1/admin/users/target-user-1', 'PATCH', {
      status: 'SUSPENDED',
    });

    const res = await PATCH(req, { params: { id: 'target-user-1' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('success');
    expect(json.data.status).toBe('SUSPENDED');
  });
});
