import { POST } from '@/app/api/v1/admin/auth/logout/route';
import { db } from '@/lib/db';

const mockCookieStore = {
  get: jest.fn(),
  set: jest.fn(),
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

function createMockLogoutRequest() {
  return {
    headers: {
      get: (headerName: string) => {
        if (headerName === 'x-forwarded-for') return '127.0.0.1';
        if (headerName === 'user-agent') return 'Jest Logout Test';
        return null;
      },
    },
  } as any;
}

describe('Automated Integration Test: Admin Logout & Session Revocation Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. Automated Check: Should successfully process logout when no session cookie exists', async () => {
    mockCookieStore.get.mockReturnValueOnce(undefined);

    const req = createMockLogoutRequest();
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('success');
    expect(json.message).toBe('Logged out successfully');
  });

  it('2. Automated Check: Should revoke session in database and record audit log when session cookie is provided', async () => {
    mockCookieStore.get.mockReturnValueOnce({ value: 'valid-session-token-123' });
    
    // DB returns active session record
    mockDb.where
      .mockResolvedValueOnce([{ user_id: 'usr_admin_999' }]) // SELECT user_id
      .mockResolvedValueOnce([]); // UPDATE user_sessions is_revoked = 1
      
    mockDb.values.mockResolvedValueOnce([]); // INSERT admin_audit_logs ADMIN_LOGOUT

    const req = createMockLogoutRequest();
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('success');
    expect(json.message).toBe('Logged out successfully');
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.insert).toHaveBeenCalled();
  });
});
