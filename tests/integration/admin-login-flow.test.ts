import { POST } from '@/app/api/v1/admin/auth/login/route';
import { executeQuery } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// Mock DB execution for automated route testing
jest.mock('@/lib/db', () => ({
  executeQuery: jest.fn(),
  mysqlPool: { execute: jest.fn() },
}));

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: () => ({
    set: jest.fn(),
  }),
}));

function createMockRequest(body: any) {
  return {
    json: async () => body,
    headers: {
      get: (headerName: string) => {
        if (headerName === 'x-forwarded-for') return '127.0.0.1';
        if (headerName === 'user-agent') return 'Jest Automated Test';
        return null;
      },
    },
  } as any;
}

describe('Automated Integration Test: Admin Login Click & Error Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. Automated Check: Should return 400 Bad Request for invalid email formatting', async () => {
    const req = createMockRequest({ email: 'invalid-email-format', password: '123' });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.status).toBe('error');
    expect(json.errors).toHaveProperty('email');
  });

  it('2. Automated Check: Should return 401 Unauthorized for non-existent email', async () => {
    (executeQuery as jest.Mock).mockResolvedValueOnce([[]]); // DB returns empty array

    const req = createMockRequest({ email: 'nonexistent@teacottage.com', password: 'ValidPassword123!' });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.message).toBe('Invalid email or password');
  });

  it('3. Automated Check: Should return 423 Locked when account is temporarily locked', async () => {
    const futureDate = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    (executeQuery as jest.Mock).mockResolvedValueOnce([
      [
        {
          id: 'u_123',
          email: 'locked@teacottage.com',
          password_hash: 'hashed',
          status: 'ACTIVE',
          failed_login_attempts: 5,
          locked_until: futureDate,
        },
      ],
    ]);

    const req = createMockRequest({ email: 'locked@teacottage.com', password: 'ValidPassword123!' });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(423);
    expect(json.message).toContain('temporarily locked');
  });

  it('4. Automated Check: Should return 200 OK and issue session for valid credentials', async () => {
    const validHash = await hashPassword('ValidPassword123!');
    
    (executeQuery as jest.Mock)
      .mockResolvedValueOnce([
        [
          {
            id: 'u_admin_01',
            email: 'admin@teacottage.com',
            password_hash: validHash,
            first_name: 'Admin',
            last_name: 'User',
            status: 'ACTIVE',
            global_role: 'SUPER_ADMIN',
            failed_login_attempts: 0,
            locked_until: null,
          },
        ],
      ])
      .mockResolvedValueOnce([{}]) // reset attempts
      .mockResolvedValueOnce([{}]) // insert session
      .mockResolvedValueOnce([{}]) // insert audit log
      .mockResolvedValueOnce([
        [
          {
            site_id: 'site_tc',
            site_slug: 'tea-cottage',
            site_name: 'Tea Cottage Website',
            role_code: 'SITE_ADMIN',
          },
        ],
      ]);

    const req = createMockRequest({ email: 'admin@teacottage.com', password: 'ValidPassword123!' });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('success');
    expect(json.data.user.email).toBe('admin@teacottage.com');
  });
});
