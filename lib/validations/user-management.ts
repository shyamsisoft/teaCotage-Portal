import { z } from 'zod';

export const UserQuerySchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a digit')
    .regex(/[@$!%*?&]/, 'Password must contain a special character (@$!%*?&)'),
  globalRole: z.enum(['SUPER_ADMIN', 'SITE_ADMIN', 'CONTENT_EDITOR', 'VIEWER']),
  siteRoles: z
    .array(
      z.object({
        siteId: z.string(),
        roleId: z.string(),
      })
    )
    .optional()
    .default([]),
});

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  globalRole: z.enum(['SUPER_ADMIN', 'SITE_ADMIN', 'CONTENT_EDITOR', 'VIEWER']).optional(),
  siteRoles: z
    .array(
      z.object({
        siteId: z.string(),
        roleId: z.string(),
      })
    )
    .optional(),
});
