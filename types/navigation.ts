export interface NavigationItemNode {
  id: string;
  code: string;
  label: string;
  icon?: string;
  path?: string;
  permissionCode?: string;
  displayOrder: number;
  children?: NavigationItemNode[];
}

export interface NavSiteOption {
  id: string;
  slug: string;
  name: string;
  domain?: string;
  roleCode: string;
}

export interface UserNavProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  globalRole: string;
  activeSite: NavSiteOption;
  assignedSites: NavSiteOption[];
  permissions: string[];
}
