import { NavigationItemNode } from '@/types/navigation';

export const DEFAULT_NAVIGATION_TREE: NavigationItemNode[] = [
  {
    id: 'nav-001',
    code: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    path: '/admin/dashboard',
    displayOrder: 1,
  },
  {
    id: 'nav-002',
    code: 'content',
    label: 'Content Engine',
    icon: 'FileText',
    permissionCode: 'content:pages:preview',
    displayOrder: 2,
    children: [
      {
        id: 'nav-003',
        code: 'content_pages',
        label: 'Pages',
        icon: 'File',
        path: '/admin/content/pages',
        permissionCode: 'content:pages:preview',
        displayOrder: 1,
      },
      {
        id: 'nav-004',
        code: 'content_catalog',
        label: 'Catalog Items',
        icon: 'Coffee',
        path: '/admin/content/catalog',
        permissionCode: 'content:pages:preview',
        displayOrder: 2,
      },
      {
        id: 'nav-005',
        code: 'content_blog',
        label: 'Blog Articles',
        icon: 'Newspaper',
        path: '/admin/content/blog',
        permissionCode: 'content:pages:preview',
        displayOrder: 3,
      },
    ],
  },
  {
    id: 'nav-006',
    code: 'media',
    label: 'Media Library',
    icon: 'Image',
    path: '/admin/media',
    permissionCode: 'media:upload',
    displayOrder: 3,
  },
  {
    id: 'nav-007',
    code: 'settings',
    label: 'Site Settings',
    icon: 'Settings',
    path: '/admin/settings',
    permissionCode: 'site:settings:update',
    displayOrder: 4,
  },
  {
    id: 'nav-008',
    code: 'users',
    label: 'User Management',
    icon: 'Users',
    path: '/admin/users',
    permissionCode: 'site:users:invite',
    displayOrder: 5,
  },
  {
    id: 'nav-009',
    code: 'audit_logs',
    label: 'Security Audit',
    icon: 'ShieldCheck',
    path: '/admin/audit-logs',
    permissionCode: 'admin:users:manage',
    displayOrder: 6,
  },
  {
    id: 'nav-010',
    code: 'profile',
    label: 'My Profile',
    icon: 'User',
    path: '/admin/profile',
    displayOrder: 7,
  },
];

/**
 * Filter navigation items based on user global role and permissions
 */
export function filterAuthorizedNavigation(
  tree: NavigationItemNode[],
  userRole: string,
  userPermissions: string[]
): NavigationItemNode[] {
  // Super Admin receives unrestricted access to all nodes
  if (userRole === 'SUPER_ADMIN') {
    return tree;
  }

  return tree.reduce<NavigationItemNode[]>((acc, node) => {
    // Filter children if present
    const filteredChildren = node.children
      ? filterAuthorizedNavigation(node.children, userRole, userPermissions)
      : undefined;

    // Check node permission
    const hasPermission = !node.permissionCode || userPermissions.includes(node.permissionCode);

    // Node is visible if user has permission AND (it has no children OR at least 1 child is visible)
    if (hasPermission && (!node.children || (filteredChildren && filteredChildren.length > 0))) {
      acc.push({
        ...node,
        children: filteredChildren,
      });
    }

    return acc;
  }, []);
}
