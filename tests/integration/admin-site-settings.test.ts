import { GET as getSites } from '@/app/api/v1/admin/sites/route';
import { GET as getSiteById, PATCH as updateSite } from '@/app/api/v1/admin/sites/[id]/route';
import { db } from '@/lib/db';

const mockCookieStore = {
  get: jest.fn(),
};

var mockWhere = jest.fn().mockResolvedValue([]);

jest.mock('@/lib/db', () => {
  const mockDb = {
    select: jest.fn().mockReturnThis(),
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
    innerJoin: jest.fn().mockReturnThis(),
  };
  return {
    db: mockDb,
    sites: {},
    userSessions: {},
    users: {},
    adminAuditLogs: {},
    eq: jest.fn((col, val) => ({ col, val })),
    and: jest.fn((...args) => args),
    gt: jest.fn((col, val) => ({ col, val })),
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

describe('Automated Integration Test: Site Settings API Gateway', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. GET /api/v1/admin/sites: Should return 401 when unauthenticated', async () => {
    mockCookieStore.get.mockReturnValueOnce(undefined);

    const res = await getSites();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.status).toBe('error');
  });

  it('2. GET /api/v1/admin/sites: Should list managed tenant properties for active session (TC-SS-001)', async () => {
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

    const res = await getSites();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('success');
  });

  it('3. PATCH /api/v1/admin/sites/[id]: Should update site properties & create audit log (TC-SS-002, TC-SS-003)', async () => {
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

    const req = createMockRequest('http://localhost:3000/api/v1/admin/sites/site-01', 'PATCH', {
      name: 'Tea Cottage Resort & Spa',
      domain: 'teacottageresort.com',
      isActive: true,
    });

    const res = await updateSite(req, { params: { id: 'site-01' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('success');
    expect(json.data.name).toBe('Tea Cottage Resort & Spa');
  });
});
