import { getActiveSiteContext } from '@/lib/site-context';

describe('Development Integration Tests: Site Context & Route Resolver', () => {
  it('should extract active site ID from request headers', () => {
    const mockReq: any = {
      headers: {
        get: (name: string) => (name === 'x-site-id' ? 'site_tea_cottage_99' : null),
      },
      cookies: {
        get: () => undefined,
      },
    };

    const siteId = getActiveSiteContext(mockReq);
    expect(siteId).toBe('site_tea_cottage_99');
  });

  it('should fallback to default Tea Cottage site ID when no site header is provided', () => {
    const mockReq: any = {
      headers: {
        get: () => null,
      },
      cookies: {
        get: () => undefined,
      },
    };

    const siteId = getActiveSiteContext(mockReq);
    expect(siteId).toBe('00000000-0000-0000-0000-000000000001');
  });
});
