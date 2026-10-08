import { LoginSchema } from '@/lib/validations/auth';
import { hashToken, generateSessionToken } from '@/lib/auth';

describe('Unit Tests: Auth Schema Validation & Crypto Token Utilities', () => {
  it('should validate correct login input schema', () => {
    const validData = {
      email: 'admin@teacottage.com',
      password: 'SecurePassword123!',
    };

    const result = LoginSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('admin@teacottage.com');
    }
  });

  it('should reject invalid email inputs', () => {
    const invalidData = {
      email: 'not-an-email',
      password: 'Password123!',
    };

    const result = LoginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should generate cryptographically random 64-character hex session tokens', () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  it('should produce consistent SHA-256 token hashes', () => {
    const rawToken = 'test-session-token-12345';
    const hash1 = hashToken(rawToken);
    const hash2 = hashToken(rawToken);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });
});
