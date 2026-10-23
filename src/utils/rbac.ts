import { 
  AdminUser, 
  AdminRole, 
  PermissionModule, 
  PermissionAction, 
  RolePermissions,
  SUPER_ADMIN_ROLE_ID,
  DEFAULT_ADMIN_ROLES 
} from '../types/rbac';
import { AdminTab } from './routing';

/**
 * Check if an admin user is a Super Admin (full system access)
 */
export function isSuperAdminUser(user: AdminUser | null | undefined, _roles: AdminRole[] = []): boolean {
  if (!user || user.status === 'inactive') return false;
  
  // 1. Direct legacy 'admin' role
  if (user.role === 'admin') return true;

  // 2. Assigned Super Admin role ID
  if (Array.isArray(user.roleIds) && user.roleIds.includes(SUPER_ADMIN_ROLE_ID)) {
    return true;
  }

  // 3. Username fallback for root super admin
  if (user.username?.toLowerCase() === 'a.hesham' || user.id === 'usr_super_admin_hesham') {
    return true;
  }

  return false;
}

/**
 * Check if the given user is the last active Super Admin in the system
 * (Prevents lockout: the last Super Admin can never be deleted, deactivated or demoted)
 */
export function isLastSuperAdmin(
  targetUser: AdminUser, 
  allUsers: AdminUser[], 
  roles: AdminRole[] = DEFAULT_ADMIN_ROLES
): boolean {
  // Ahmad Hesham root account is permanently fixed and protected
  if (targetUser.username?.toLowerCase() === 'a.hesham' || targetUser.id === 'usr_super_admin_hesham') {
    return true;
  }

  if (!isSuperAdminUser(targetUser, roles)) return false;

  const activeSuperAdmins = allUsers.filter(u => 
    u.status === 'active' && isSuperAdminUser(u, roles)
  );

  return activeSuperAdmins.length <= 1 && activeSuperAdmins.some(u => u.id === targetUser.id);
}

/**
 * Core permission check for any module and action
 */
export function hasPermission(
  user: AdminUser | null | undefined,
  roles: AdminRole[],
  module: PermissionModule,
  action: PermissionAction = 'view'
): boolean {
  if (!user || user.status === 'inactive') return false;

  // Super Admin always has full unconditional permissions
  if (isSuperAdminUser(user, roles)) {
    return true;
  }

  // Check custom assigned roles
  const userRoleIds = user.roleIds || [];
  if (userRoleIds.length === 0) {
    // Legacy controller fallback: can view most tabs, but cannot edit settings or users
    if (user.role === 'admin') return true;
    if (user.role === 'controller') {
      if (module === 'users_roles' || module === 'system_settings') {
        return false;
      }
      return action === 'view';
    }
    return false;
  }

  // Iterate over assigned roles and union their permissions
  for (const rId of userRoleIds) {
    const role = roles.find(r => r.id === rId);
    if (!role) continue;

    if (role.id === SUPER_ADMIN_ROLE_ID) {
      return true;
    }

    const modPerms = role.permissions?.[module];
    if (modPerms && modPerms[action] === true) {
      return true;
    }
  }

  return false;
}

/**
 * Map an AdminTab screen to its governing PermissionModule
 */
export function getTabModule(tab: AdminTab): PermissionModule {
  switch (tab) {
    case 'hotels':
    case 'offers':
      return 'hotels';
    case 'districts':
    case 'about':
      return 'branches';
    case 'rooms-inventory':
    case 'online-control':
    case 'calendar-grid':
    case 'rooms-list':
    case 'meals-list':
    case 'packages-list':
    case 'periods-pricing':
      return 'availability_pricing';
    case 'bookings':
      return 'bookings_log';
    case 'booking-rules':
    case 'booking-settings':
      return 'booking_settings';
    case 'home-sections':
    case 'slides':
    case 'intro-video':
    case 'story-teaser':
    case 'services':
    case 'buttons':
    case 'contacts':
    case 'messages':
    case 'reviews':
      return 'site_content';
    case 'users':
      return 'users_roles';
    case 'settings':
    case 'audit-log':
      return 'system_settings';
    default:
      return 'system_settings';
  }
}

/**
 * Determine whether user can view/access an AdminTab
 */
export function canAccessTab(
  user: AdminUser | null | undefined,
  roles: AdminRole[],
  tab: AdminTab
): boolean {
  if (!user) return false;
  if (isSuperAdminUser(user, roles)) return true;

  const module = getTabModule(tab);
  return hasPermission(user, roles, module, 'view');
}

/**
 * Compute the effective merged permissions of a user
 */
export function getEffectivePermissions(
  user: AdminUser | null | undefined,
  roles: AdminRole[]
): RolePermissions {
  const result: RolePermissions = {};
  if (!user || user.status === 'inactive') return result;

  const modules: PermissionModule[] = [
    'hotels', 'branches', 'availability_pricing', 'booking_settings', 
    'bookings_log', 'invoices_policies', 'site_content', 'users_roles', 'system_settings'
  ];
  const actions: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'export'];

  for (const m of modules) {
    result[m] = {};
    for (const a of actions) {
      result[m]![a] = hasPermission(user, roles, m, a);
    }
  }

  return result;
}
