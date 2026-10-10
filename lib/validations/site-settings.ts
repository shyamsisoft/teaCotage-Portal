import { z } from 'zod';

export const UpdateSiteSettingsSchema = z.object({
  name: z.string().min(1, 'Site name is required').max(255).optional(),
  domain: z.string().max(255).optional().nullable(),
  isActive: z.boolean().optional(),
});
