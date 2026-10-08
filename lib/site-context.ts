import { NextRequest } from 'next/server';

export interface SiteContext {
  siteId: string;
  siteSlug: string;
}

export function getActiveSiteContext(req: NextRequest): string | null {
  // 1. Check custom Header (set by Admin Portal Frontend or API client)
  const headerSiteId = req.headers.get('x-site-id');
  if (headerSiteId) return headerSiteId;

  // 2. Check Site Context Cookie
  const cookieSiteId = req.cookies.get('cms_active_site_id')?.value;
  if (cookieSiteId) return cookieSiteId;

  // 3. Fallback to default site (Tea Cottage)
  return '00000000-0000-0000-0000-000000000001';
}
