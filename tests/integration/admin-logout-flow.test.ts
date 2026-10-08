import { POST } from '@/app/api/v1/admin/auth/logout/route';
import { executeQuery } from '@/lib/db';

const mockCookieStore = {
  get: jest.fn(),
  set: jest.fn(),
};

// Mock DB execution for automated route testing
jest.mock('@/lib/db', () => ({
  executeQuery: jest.fn(),
  mysqlPool: { execute: jest.fn() },
}));

// Mock Next.js cookies
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
    (executeQuery as jest.Mock)
      .mockResolvedValueOnce([[{ user_id: 'usr_admin_999' }]]) // SELECT user_id
      .mockResolvedValueOnce([{}]) // UPDATE user_sessions is_revoked = 1
      .mockResolvedValueOnce([{}]); // INSERT admin_audit_logs ADMIN_LOGOUT

    const req = createMockLogoutRequest();
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('success');
    expect(json.message).toBe('Logged out successfully');
    expect(executeQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE user_sessions SET is_revoked = 1'),
      expect.any(Array)
    );
    expect(executeQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO admin_audit_logs"),
      expect.arrayContaining(['usr_admin_999', '127.0.0.1'])
    );
  });
});
