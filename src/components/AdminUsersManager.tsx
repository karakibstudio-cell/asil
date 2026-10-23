import React, { useState, useMemo } from 'react';
import { AdminUser, UserRole } from '../types';
import { 
  AdminRole, 
  RolePermissions, 
  PermissionModule, 
  PermissionAction, 
  PERMISSION_MODULES, 
  ALL_PERMISSION_ACTIONS, 
  SUPER_ADMIN_ROLE_ID, 
  DEFAULT_ADMIN_ROLES 
} from '../types/rbac';
import { 
  isSuperAdminUser, 
  isLastSuperAdmin, 
  hasPermission 
} from '../utils/rbac';
import { 
  Users, 
  ShieldCheck, 
  Shield, 
  Plus, 
  Edit3, 
  Trash2, 
  Key, 
  Mail, 
  Check, 
  X, 
  AlertTriangle,
  UserCheck,
  UserX,
  Lock,
  Eye,
  EyeOff,
  Search,
  Filter,
  CheckSquare,
  Square,
  CheckCircle2,
  Info
} from 'lucide-react';
import { 
  saveAdminUserToDb, 
  deleteAdminUserFromDb,
  saveAdminRoleToDb,
  deleteAdminRoleFromDb
} from '../services/firebase';

interface AdminUsersManagerProps {
  users: AdminUser[];
  roles?: AdminRole[];
  currentUserId?: string;
  currentUser?: AdminUser | null;
  currentUserRole?: UserRole;
  onRefreshUsers: () => Promise<void>;
  onRefreshRoles?: () => Promise<void>;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRecordAudit?: (entry: {
    module: PermissionModule;
    action: string;
    details: string;
    oldValue?: any;
    newValue?: any;
    recordId?: string;
    recordTitle?: string;
  }) => Promise<void>;
}

export const AdminUsersManager: React.FC<AdminUsersManagerProps> = ({
  users,
  roles = DEFAULT_ADMIN_ROLES,
  currentUserId,
  currentUser,
  currentUserRole = 'admin',
  onRefreshUsers,
  onRefreshRoles,
  onShowToast,
  onRecordAudit
}) => {
  // Navigation Tabs: 'users' or 'roles'
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'roles'>('users');

  // Search and Filter states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleSearchQuery, setRoleSearchQuery] = useState('');

  // -------------------------------------------------------------
  // USER MODAL STATES
  // -------------------------------------------------------------
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userSaving, setUserSaving] = useState(false);

  const [userForm, setUserForm] = useState<AdminUser>({
    id: '',
    name: '',
    username: '',
    email: '',
    role: 'controller',
    roleIds: [],
    password: '',
    status: 'active',
    notes: '',
    createdAt: Date.now()
  });

  const [deleteUserModal, setDeleteUserModal] = useState<{
    isOpen: boolean;
    user: AdminUser | null;
  }>({
    isOpen: false,
    user: null
  });

  // -------------------------------------------------------------
  // ROLE MODAL STATES
  // -------------------------------------------------------------
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleSaving, setRoleSaving] = useState(false);

  const emptyPermissions: RolePermissions = useMemo(() => {
    const perm: RolePermissions = {};
    PERMISSION_MODULES.forEach(m => {
      perm[m.id] = { view: false, create: false, edit: false, delete: false, export: false };
    });
    return perm;
  }, []);

  const [roleForm, setRoleForm] = useState<AdminRole>({
    id: '',
    name: '',
    nameEn: '',
    description: '',
    isSystem: false,
    permissions: emptyPermissions,
    createdAt: Date.now()
  });

  const [deleteRoleModal, setDeleteRoleModal] = useState<{
    isOpen: boolean;
    role: AdminRole | null;
  }>({
    isOpen: false,
    role: null
  });

  // Check if current user is Super Admin or has specific permissions
  const isCurrentSuperAdmin = isSuperAdminUser(currentUser, roles);
  const canCreateUser = isCurrentSuperAdmin || hasPermission(currentUser, roles, 'users_roles', 'create');
  const canEditUser = isCurrentSuperAdmin || hasPermission(currentUser, roles, 'users_roles', 'edit');
  const canDeleteUser = isCurrentSuperAdmin || hasPermission(currentUser, roles, 'users_roles', 'delete');
  const canManageRoles = isCurrentSuperAdmin || hasPermission(currentUser, roles, 'users_roles', 'edit');

  // -------------------------------------------------------------
  // USERS LOGIC
  // -------------------------------------------------------------
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchSearch = 
        user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (user.notes && user.notes.toLowerCase().includes(userSearchQuery.toLowerCase()));

      const matchStatus = 
        userStatusFilter === 'all' ? true : user.status === userStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [users, userSearchQuery, userStatusFilter]);

  const handleOpenAddUserModal = () => {
    setEditingUserId(null);
    setShowPassword(true);
    setUserForm({
      id: 'usr_' + Date.now(),
      name: '',
      username: '',
      email: '',
      role: 'controller',
      roleIds: [],
      password: '',
      status: 'active',
      notes: '',
      createdAt: Date.now()
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUserModal = (user: AdminUser) => {
    setEditingUserId(user.id);
    setShowPassword(false);
    setUserForm({ 
      ...user,
      email: user.email?.endsWith('@prestige.local') ? '' : (user.email || ''),
      roleIds: user.roleIds || (user.role === 'admin' || user.username?.toLowerCase() === 'a.hesham' ? [SUPER_ADMIN_ROLE_ID] : [])
    });
    setIsUserModalOpen(true);
  };

  const handleToggleUserRole = (roleId: string) => {
    const currentRoleIds = userForm.roleIds || [];
    const isTargetLastSuper = editingUserId && isLastSuperAdmin(userForm, users, roles);
    const isTargetRootHesham = editingUserId && (userForm.username?.toLowerCase() === 'a.hesham' || editingUserId === 'usr_super_admin_hesham');

    // Prevent deselecting Super Admin if this is the last active Super Admin or Ahmad Hesham root account
    if (roleId === SUPER_ADMIN_ROLE_ID && currentRoleIds.includes(SUPER_ADMIN_ROLE_ID) && (isTargetLastSuper || isTargetRootHesham)) {
      onShowToast('لا يمكن إلغاء صلاحية المدير العام عن حساب المدير العام الرئيسي الثابت لمنع قفل النظام', 'error');
      return;
    }

    if (currentRoleIds.includes(roleId)) {
      setUserForm(prev => ({
        ...prev,
        roleIds: (prev.roleIds || []).filter(id => id !== roleId)
      }));
    } else {
      setUserForm(prev => ({
        ...prev,
        roleIds: [...(prev.roleIds || []), roleId]
      }));
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim()) {
      onShowToast('يرجى إدخال اسم المستخدم / الاسم الكامل', 'error');
      return;
    }
    if (!userForm.username?.trim()) {
      onShowToast('يرجى إدخال اسم المستخدم لتسجيل الدخول (Username)', 'error');
      return;
    }
    if (!editingUserId && !userForm.password?.trim()) {
      onShowToast('يرجى كتابة كلمة مرور للمستخدم الجديد', 'error');
      return;
    }

    const assignedRoleIds = userForm.roleIds || [];
    if (assignedRoleIds.length === 0) {
      onShowToast('يرجى تحديد دور واحد على الأقل للمستخدم', 'error');
      return;
    }

    const cleanUsername = userForm.username.trim();
    const isRootHesham = cleanUsername.toLowerCase() === 'a.hesham' || editingUserId === 'usr_super_admin_hesham';

    // Check last super admin guard
    const isSuperRoleSelected = assignedRoleIds.includes(SUPER_ADMIN_ROLE_ID) || isRootHesham;
    if (editingUserId) {
      const existingUser = users.find(u => u.id === editingUserId);
      if (isRootHesham || (existingUser && isLastSuperAdmin(existingUser, users, roles))) {
        if (!isSuperRoleSelected) {
          onShowToast('لا يمكن إزالة رتبة المدير العام عن حساب المدير العام الرئيسي في النظام', 'error');
          return;
        }
        if (userForm.status === 'inactive') {
          onShowToast('لا يمكن تعطيل حساب المدير العام الرئيسي في النظام', 'error');
          return;
        }
      }
    }

    const legacyRole: UserRole = isSuperRoleSelected ? 'admin' : 'controller';

    // Safe email fallback (email is optional)
    const cleanEmail = userForm.email?.trim();
    const safeEmail = cleanEmail && !cleanEmail.endsWith('@prestige.local')
      ? cleanEmail
      : `${cleanUsername.toLowerCase()}@prestige.local`;

    setUserSaving(true);
    try {
      const finalUser: AdminUser = {
        ...userForm,
        username: cleanUsername,
        email: safeEmail,
        role: legacyRole,
        roleIds: assignedRoleIds,
        password: userForm.password ? userForm.password.trim() : (editingUserId ? users.find(u => u.id === editingUserId)?.password : '123456')
      };

      const oldUser = editingUserId ? users.find(u => u.id === editingUserId) : null;
      await saveAdminUserToDb(finalUser);

      // Close modal and show success toast immediately
      setIsUserModalOpen(false);
      onShowToast(editingUserId ? 'تم تحديث بيانات المستخدم بنجاح' : 'تم إنشاء المستخدم وتعيين أدواره بنجاح', 'success');

      // Refresh users list in background
      if (onRefreshUsers) {
        onRefreshUsers().catch(console.error);
      }

      // Record audit in background without blocking
      if (onRecordAudit) {
        onRecordAudit({
          module: 'users_roles',
          action: editingUserId ? 'تعديل مستخدم' : 'إنشاء مستخدم',
          details: `${editingUserId ? 'تعديل بيانات المستخدم' : 'إنشاء مستخدم جديد'}: ${finalUser.name} (${finalUser.username})`,
          oldValue: oldUser ? { name: oldUser.name, username: oldUser.username, roles: oldUser.roleIds, status: oldUser.status } : null,
          newValue: { name: finalUser.name, username: finalUser.username, roles: finalUser.roleIds, status: finalUser.status },
          recordId: finalUser.id,
          recordTitle: finalUser.name
        }).catch(console.error);
      }
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'حدث خطأ أثناء حفظ بيانات المستخدم', 'error');
    } finally {
      setUserSaving(false);
    }
  };

  const handleToggleUserStatus = async (user: AdminUser) => {
    if (user.username?.toLowerCase() === 'a.hesham' || user.id === 'usr_super_admin_hesham') {
      onShowToast('لا يمكن تعطيل حساب المدير العام الرئيسي الثابت (أحمد هشام)', 'error');
      return;
    }
    if (isLastSuperAdmin(user, users, roles) && user.status === 'active') {
      onShowToast('لا يمكن تعطيل حساب المدير العام الأخير في النظام لمنع قفل لوحة التحكم', 'error');
      return;
    }

    try {
      const updated: AdminUser = {
        ...user,
        status: user.status === 'active' ? 'inactive' : 'active'
      };
      await saveAdminUserToDb(updated);
      await onRefreshUsers();

      if (onRecordAudit) {
        await onRecordAudit({
          module: 'users_roles',
          action: 'تغيير حالة مستخدم',
          details: `تغيير حالة المستخدم ${user.name} إلى ${updated.status === 'active' ? 'نشط' : 'معطل'}`,
          oldValue: { status: user.status },
          newValue: { status: updated.status },
          recordId: user.id,
          recordTitle: user.name
        });
      }

      onShowToast(updated.status === 'active' ? 'تم تفعيل حساب المستخدم' : 'تم تعطيل حساب المستخدم مؤقتاً', 'info');
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'حدث خطأ أثناء تغيير حالة الحساب', 'error');
    }
  };

  const confirmDeleteUser = (user: AdminUser) => {
    if (user.username?.toLowerCase() === 'a.hesham' || user.id === 'usr_super_admin_hesham') {
      onShowToast('لا يمكن حذف حساب المدير العام الرئيسي الثابت (أحمد هشام) مطلقاً', 'error');
      return;
    }
    if (isLastSuperAdmin(user, users, roles)) {
      onShowToast('لا يمكن حذف حساب المدير العام الأخير في النظام لمنع قفل لوحة التحكم', 'error');
      return;
    }
    if (users.length <= 1) {
      onShowToast('لا يمكن حذف المستخدم الوحيد في النظام', 'error');
      return;
    }
    setDeleteUserModal({
      isOpen: true,
      user
    });
  };

  const handleExecuteDeleteUser = async () => {
    if (!deleteUserModal.user) return;
    try {
      const userToDelete = deleteUserModal.user;
      await deleteAdminUserFromDb(userToDelete.id);
      await onRefreshUsers();

      if (onRecordAudit) {
        await onRecordAudit({
          module: 'users_roles',
          action: 'حذف مستخدم',
          details: `حذف حساب المستخدم: ${userToDelete.name} (${userToDelete.username})`,
          oldValue: { name: userToDelete.name, email: userToDelete.email, username: userToDelete.username },
          recordId: userToDelete.id,
          recordTitle: userToDelete.name
        });
      }

      onShowToast(`تم حذف المستخدم "${userToDelete.name}" بنجاح`, 'success');
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'حدث خطأ أثناء حذف المستخدم', 'error');
    } finally {
      setDeleteUserModal({ isOpen: false, user: null });
    }
  };

  // -------------------------------------------------------------
  // ROLES & PERMISSIONS LOGIC
  // -------------------------------------------------------------
  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      return (
        role.name.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
        (role.nameEn && role.nameEn.toLowerCase().includes(roleSearchQuery.toLowerCase())) ||
        role.description.toLowerCase().includes(roleSearchQuery.toLowerCase())
      );
    });
  }, [roles, roleSearchQuery]);

  const handleOpenAddRoleModal = () => {
    setEditingRoleId(null);
    setRoleForm({
      id: 'role_' + Date.now(),
      name: '',
      nameEn: '',
      description: '',
      isSystem: false,
      permissions: JSON.parse(JSON.stringify(emptyPermissions)),
      createdAt: Date.now()
    });
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRoleModal = (role: AdminRole) => {
    if (role.id === SUPER_ADMIN_ROLE_ID || role.isSystem) {
      onShowToast('دور المدير العام (Super Admin) ثابت ولا يمكن تعديله لضمان عدم فقدان الصلاحيات', 'info');
      return;
    }
    setEditingRoleId(role.id);
    setRoleForm({
      ...role,
      permissions: JSON.parse(JSON.stringify(role.permissions || emptyPermissions))
    });
    setIsRoleModalOpen(true);
  };

  const handleTogglePermission = (module: PermissionModule, action: PermissionAction) => {
    setRoleForm(prev => {
      const currentMod = prev.permissions[module] || {};
      const updatedMod = {
        ...currentMod,
        [action]: !currentMod[action]
      };
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [module]: updatedMod
        }
      };
    });
  };

  const handleToggleAllForModule = (module: PermissionModule) => {
    setRoleForm(prev => {
      const currentMod = prev.permissions[module] || {};
      const allChecked = ALL_PERMISSION_ACTIONS.every(act => currentMod[act.id] === true);
      const nextMod: any = {};
      ALL_PERMISSION_ACTIONS.forEach(act => {
        nextMod[act.id] = !allChecked;
      });
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [module]: nextMod
        }
      };
    });
  };

  const handleToggleAllPermissionsMaster = () => {
    setRoleForm(prev => {
      // Check if all are already checked
      let allChecked = true;
      for (const mod of PERMISSION_MODULES) {
        const modPerms = prev.permissions[mod.id] || {};
        for (const act of ALL_PERMISSION_ACTIONS) {
          if (!modPerms[act.id]) {
            allChecked = false;
            break;
          }
        }
        if (!allChecked) break;
      }

      const nextPermissions: RolePermissions = {};
      PERMISSION_MODULES.forEach(mod => {
        nextPermissions[mod.id] = {};
        ALL_PERMISSION_ACTIONS.forEach(act => {
          nextPermissions[mod.id]![act.id] = !allChecked;
        });
      });

      return {
        ...prev,
        permissions: nextPermissions
      };
    });
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      onShowToast('يرجى إدخال اسم الدور (Role Name)', 'error');
      return;
    }
    if (!roleForm.description.trim()) {
      onShowToast('يرجى إدخال وصف موجز لصلاحيات هذا الدور', 'error');
      return;
    }

    setRoleSaving(true);
    try {
      const oldRole = editingRoleId ? roles.find(r => r.id === editingRoleId) : null;
      await saveAdminRoleToDb(roleForm);

      setIsRoleModalOpen(false);
      onShowToast(editingRoleId ? 'تم تحديث الدور وصلاحياته بنجاح' : 'تم إنشاء الدور الجديد بنجاح', 'success');

      if (onRefreshRoles) {
        onRefreshRoles().catch(console.error);
      }

      if (onRecordAudit) {
        onRecordAudit({
          module: 'users_roles',
          action: editingRoleId ? 'تعديل دور مخصص' : 'إنشاء دور جديد',
          details: `${editingRoleId ? 'تعديل الدور' : 'إنشاء دور جديد'}: ${roleForm.name}`,
          oldValue: oldRole ? { name: oldRole.name, permissions: oldRole.permissions } : null,
          newValue: { name: roleForm.name, permissions: roleForm.permissions },
          recordId: roleForm.id,
          recordTitle: roleForm.name
        }).catch(console.error);
      }
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'حدث خطأ أثناء حفظ الدور', 'error');
    } finally {
      setRoleSaving(false);
    }
  };

  const confirmDeleteRole = (role: AdminRole) => {
    if (role.id === SUPER_ADMIN_ROLE_ID || role.isSystem) {
      onShowToast('لا يمكن حذف دور المدير العام (Super Admin) الثابت نهائياً', 'error');
      return;
    }
    setDeleteRoleModal({
      isOpen: true,
      role
    });
  };

  const handleExecuteDeleteRole = async () => {
    if (!deleteRoleModal.role) return;
    try {
      const roleToDelete = deleteRoleModal.role;
      await deleteAdminRoleFromDb(roleToDelete.id);
      if (onRefreshRoles) await onRefreshRoles();

      if (onRecordAudit) {
        await onRecordAudit({
          module: 'users_roles',
          action: 'حذف دور مخصص',
          details: `حذف الدور المخصص: ${roleToDelete.name}`,
          oldValue: { name: roleToDelete.name, id: roleToDelete.id },
          recordId: roleToDelete.id,
          recordTitle: roleToDelete.name
        });
      }

      onShowToast(`تم حذف الدور "${roleToDelete.name}" بنجاح`, 'success');
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'حدث خطأ أثناء حذف الدور', 'error');
    } finally {
      setDeleteRoleModal({ isOpen: false, role: null });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
      {/* Main Header & Sub-Tabs Navigation */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-cairo font-bold text-stone-900">نظام المستخدمين والأدوار والصلاحيات (RBAC)</h2>
          </div>
          <p className="text-xs text-stone-500">
            إدارة متقدمة لحسابات المشرفين، الأدوار المخصصة، ومصفوفة الصلاحيات لكل شاشة وإجراء
          </p>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeSubTab === 'users'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users className="w-4 h-4 text-[#C9A24B]" />
            <span>المستخدمين</span>
            <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-xs">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('roles')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeSubTab === 'roles'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#C9A24B]" />
            <span>الأدوار والصلاحيات</span>
            <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-xs">
              {roles.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: USERS MANAGEMENT                                                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'users' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Controls: Search, Filter, Add */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="بحث باسم المستخدم أو البريد..."
                  className="w-full pr-10 pl-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setUserStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    userStatusFilter === 'all' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  الكل ({users.length})
                </button>
                <button
                  onClick={() => setUserStatusFilter('active')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    userStatusFilter === 'active' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  النشطين ({users.filter(u => u.status === 'active').length})
                </button>
                <button
                  onClick={() => setUserStatusFilter('inactive')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    userStatusFilter === 'inactive' ? 'bg-white text-stone-600 font-bold shadow-xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  المعطلين ({users.filter(u => u.status === 'inactive').length})
                </button>
              </div>
            </div>

            {canCreateUser && (
              <button
                onClick={handleOpenAddUserModal}
                id="admin-add-user-btn"
                className="px-5 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ إضافة مستخدم جديد</span>
              </button>
            )}
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto border border-stone-200 rounded-2xl">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
                <tr>
                  <th className="py-3.5 pr-4">المستخدم</th>
                  <th className="py-3.5 px-3">اسم الدخول</th>
                  <th className="py-3.5 px-3">البريد الإلكتروني</th>
                  <th className="py-3.5 px-3">الأدوار المخصصة</th>
                  <th className="py-3.5 px-3 text-center">الحالة</th>
                  <th className="py-3.5 px-3">تاريخ الإنشاء</th>
                  <th className="py-3.5 pl-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400">
                      لا يوجد مستخدمين مطابقين لمعايير البحث
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, idx) => {
                    const userIsSuper = isSuperAdminUser(user, roles);
                    const isRootHesham = user.username?.toLowerCase() === 'a.hesham' || user.id === 'usr_super_admin_hesham';
                    const userRoleObjects = (user.roleIds || [])
                      .map(id => roles.find(r => r.id === id))
                      .filter(Boolean) as AdminRole[];

                    return (
                      <tr key={user.id || `admin-user-${idx}`} className="hover:bg-stone-50 transition-colors">
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              userIsSuper
                                ? 'bg-amber-100 text-[#98752B] border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {userIsSuper ? <ShieldCheck className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                            </div>
                            <div>
                              <strong className="text-stone-900 font-bold block text-sm flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {isRootHesham && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                                    رئيسي ثابت
                                  </span>
                                )}
                              </strong>
                              {user.notes ? (
                                <span className="text-[11px] text-stone-500 line-clamp-1">
                                  {user.notes}
                                </span>
                              ) : (
                                <span className="text-[10px] text-stone-400">
                                  ID: {user.id}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-3 font-mono text-xs font-bold text-[#B38A34] dir-ltr text-right">
                          {user.username || (user.email ? user.email.split('@')[0] : 'user')}
                        </td>

                        <td className="py-4 px-3 font-mono text-xs text-stone-600 dir-ltr text-right">
                          {user.email && !user.email.endsWith('@prestige.local') ? (
                            user.email
                          ) : (
                            <span className="text-stone-400 font-sans text-[11px] italic bg-stone-100 px-2 py-0.5 rounded-md">
                              تلقائي (اختياري)
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-3">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {userIsSuper && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-[#98752B] border border-amber-200">
                                <ShieldCheck className="w-3 h-3" />
                                <span>المدير العام (Super Admin)</span>
                              </span>
                            )}
                            {userRoleObjects
                              .filter(r => r.id !== SUPER_ADMIN_ROLE_ID)
                              .map(r => (
                                <span 
                                  key={r.id} 
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200"
                                >
                                  {r.name}
                                </span>
                              ))}
                            {!userIsSuper && userRoleObjects.length === 0 && (
                              <span className="text-xs text-amber-600">بدون دور محدد</span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-3 text-center">
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            disabled={isRootHesham}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                              user.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                            } ${isRootHesham ? 'cursor-default opacity-90' : 'cursor-pointer'}`}
                            title={isRootHesham ? 'حساب المدير العام الرئيسي الثابت (دائماً نشط)' : 'اضغط لتغيير حالة الحساب'}
                          >
                            {user.status === 'active' ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                            <span>{user.status === 'active' ? 'نشط' : 'معطل'}</span>
                          </button>
                        </td>

                        <td className="py-4 px-3 text-stone-500 text-xs">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-SA') : '-'}
                        </td>

                        <td className="py-4 pl-4 text-left">
                          <div className="flex items-center justify-end gap-2">
                            {canEditUser && (
                              <button
                                onClick={() => handleOpenEditUserModal(user)}
                                className="p-2 rounded-xl bg-stone-100 hover:bg-[#C9A24B] hover:text-white text-stone-700 transition-colors"
                                title="تعديل المستخدم والأدوار"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            {canDeleteUser && !isRootHesham && (
                              <button
                                onClick={() => confirmDeleteUser(user)}
                                className="p-2 rounded-xl bg-stone-100 hover:bg-red-500 hover:text-white text-stone-700 transition-colors"
                                title="حذف المستخدم"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ROLES & PERMISSIONS MATRIX                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'roles' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={roleSearchQuery}
                onChange={(e) => setRoleSearchQuery(e.target.value)}
                placeholder="بحث في الأدوار..."
                className="w-full pr-10 pl-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
              />
            </div>

            {canManageRoles && (
              <button
                onClick={handleOpenAddRoleModal}
                className="px-5 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ إنشاء دور مخصص جديد</span>
              </button>
            )}
          </div>

          {/* Roles Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.map(role => {
              const isSuper = role.id === SUPER_ADMIN_ROLE_ID;
              const isDefaultRole = role.isSystem && !isSuper;
              const assignedCount = users.filter(u => 
                (u.roleIds && u.roleIds.includes(role.id)) || (isSuper && isSuperAdminUser(u, roles))
              ).length;

              return (
                <div 
                  key={role.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                    isSuper 
                      ? 'bg-amber-50/50 border-amber-200' 
                      : isDefaultRole
                      ? 'bg-blue-50/30 border-blue-200/80 hover:border-blue-300'
                      : 'bg-stone-50/50 border-stone-200 hover:border-[#C9A24B]/50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSuper 
                            ? 'bg-[#C9A24B] text-white' 
                            : isDefaultRole
                            ? 'bg-blue-600 text-white'
                            : 'bg-stone-200 text-stone-700'
                        }`}>
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-cairo font-bold text-sm text-stone-900">{role.name}</h4>
                          {role.nameEn && (
                            <span className="text-[11px] text-stone-500 font-mono block">{role.nameEn}</span>
                          )}
                        </div>
                      </div>

                      {isSuper ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                          <Lock className="w-3 h-3" />
                          <span>نظامي ثابت</span>
                        </span>
                      ) : isDefaultRole ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                          <ShieldCheck className="w-3 h-3" />
                          <span>دور افتراضي</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-200 text-stone-700">
                          مخصص
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed min-h-[36px]">
                      {role.description}
                    </p>

                    <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs text-stone-500">
                      <span>المستخدمين المعينين:</span>
                      <span className="font-bold text-stone-800">{assignedCount} مستخدم</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-stone-200 flex items-center justify-end gap-2">
                    {isSuper ? (
                      <span className="text-xs text-amber-800 font-medium flex items-center gap-1 py-1">
                        <Lock className="w-3 h-3 text-amber-600" />
                        <span>كامل الصلاحيات دائمًا</span>
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleOpenEditRoleModal(role)}
                          className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-[#C9A24B] hover:text-white text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل الصلاحيات</span>
                        </button>
                        <button
                          onClick={() => confirmDeleteRole(role)}
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-red-500 hover:text-white text-stone-700 transition-colors"
                          title="حذف الدور"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT USER                                                  */}
      {/* ========================================================================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-cairo font-bold text-lg text-stone-900">
                  {editingUserId ? 'تعديل بيانات المستخدم والأدوار' : 'إنشاء حساب مستخدم جديد'}
                </h3>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">الاسم الكامل: *</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: أحمد محمد، سارة عبد العزيز..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">اسم المستخدم (Username): *</label>
                  <input
                    type="text"
                    required
                    value={userForm.username || ''}
                    onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="ahmed, supervisor..."
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-right font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    البريد الإلكتروني: <span className="text-stone-400 font-normal">(اختياري)</span>
                  </label>
                  <input
                    type="email"
                    value={userForm.email?.endsWith('@prestige.local') ? '' : (userForm.email || '')}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="اختياري - مثلاً: user@company.com"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-right font-mono"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">
                    يمكنك تركه فارغاً وسيتم إنشاؤه تلقائياً.
                  </span>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  كلمة المرور: * {editingUserId && '(اتركها فارغة إذا لم ترغب في تغييرها)'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingUserId}
                    value={userForm.password || ''}
                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-right font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Multiple Roles Assignment */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-2">
                  تعيين الأدوار والصلاحيات: * (يمكن تعيين أكثر من دور)
                </label>
                <div className="space-y-2 border border-stone-200 rounded-2xl p-3 bg-stone-50 max-h-56 overflow-y-auto">
                  {roles.map(role => {
                    const isChecked = (userForm.roleIds || []).includes(role.id);
                    const isSuper = role.id === SUPER_ADMIN_ROLE_ID;
                    const isTargetLastSuper = editingUserId && isLastSuperAdmin(userForm, users, roles) && isSuper;

                    return (
                      <div
                        key={role.id}
                        onClick={() => handleToggleUserRole(role.id)}
                        className={`p-2.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-amber-50/80 border-[#C9A24B]'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="pt-0.5">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#C9A24B]" />
                          ) : (
                            <Square className="w-4 h-4 text-stone-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-stone-900">{role.name}</span>
                            {isSuper ? (
                              <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">
                                Super Admin
                              </span>
                            ) : role.isSystem ? (
                              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-semibold">
                                دور افتراضي
                              </span>
                            ) : null}
                            {isTargetLastSuper && (
                              <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                                محمي (المدير الأخير)
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">{role.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">ملاحظات / الوصف الوظيفي:</label>
                <input
                  type="text"
                  value={userForm.notes || ''}
                  onChange={(e) => setUserForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="مثال: مسؤول حجوزات فرع مكة المكرمة..."
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-stone-200">
                <button
                  type="submit"
                  disabled={userSaving}
                  className="flex-1 py-3 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{userSaving ? 'جاري الحفظ...' : editingUserId ? 'حفظ التعديلات' : 'إنشاء المستخدم'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT ROLE WITH PERMISSION MATRIX                           */}
      {/* ========================================================================= */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cairo font-bold text-lg text-stone-900">
                    {editingRoleId ? 'تعديل الدور ومصفوفة الصلاحيات' : 'إنشاء دور مخصص جديد'}
                  </h3>
                  <p className="text-xs text-stone-500">حدد بدقة ما يمكن لحاملي هذا الدور عرضه أو إنشاؤه أو تعديله أو حذفه أو تصديره</p>
                </div>
              </div>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-6">
              {/* Role Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">اسم الدور (بالعربية): *</label>
                  <input
                    type="text"
                    required
                    value={roleForm.name}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="مثال: مسؤول خدمة العملاء، مدير التسويق..."
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">اسم الدور (بالإنجليزية - اختياري):</label>
                  <input
                    type="text"
                    value={roleForm.nameEn || ''}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, nameEn: e.target.value }))}
                    placeholder="e.g. Customer Care Agent"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-right"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-stone-700 block mb-1">وصف الدور والمسؤوليات: *</label>
                  <input
                    type="text"
                    required
                    value={roleForm.description}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="شرح موجز لنطاق صلاحيات ومسؤوليات هذا الدور في النظام..."
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              {/* Permissions Matrix Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2">
                  <h4 className="font-cairo font-bold text-sm text-stone-900 flex items-center gap-2">
                    <span>مصفوفة الصلاحيات لكل شاشة ووحدة</span>
                    <span className="text-xs font-normal text-stone-500">(9 أقسام رئيسية)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleToggleAllPermissionsMaster}
                    className="text-xs font-bold text-[#B38A34] hover:underline flex items-center gap-1"
                  >
                    <span>تحديد / إلغاء تحديد الكل</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-stone-200 rounded-2xl">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-bold">
                      <tr>
                        <th className="py-3 px-4 min-w-[200px]">القسم / الوحدة</th>
                        {ALL_PERMISSION_ACTIONS.map(action => (
                          <th key={action.id} className="py-3 px-3 text-center min-w-[90px]">
                            {action.labelAr}
                          </th>
                        ))}
                        <th className="py-3 px-3 text-center min-w-[80px]">الكل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {PERMISSION_MODULES.map(module => {
                        const modPerms = roleForm.permissions[module.id] || {};
                        const allChecked = ALL_PERMISSION_ACTIONS.every(act => modPerms[act.id] === true);

                        return (
                          <tr key={module.id} className="hover:bg-stone-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <strong className="text-stone-900 font-bold block">{module.labelAr}</strong>
                              <span className="text-[10px] text-stone-500 line-clamp-1">{module.descriptionAr}</span>
                            </td>

                            {ALL_PERMISSION_ACTIONS.map(action => {
                              const isChecked = !!modPerms[action.id];
                              return (
                                <td key={action.id} className="py-3 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePermission(module.id, action.id)}
                                    className={`w-6 h-6 rounded-lg inline-flex items-center justify-center transition-all ${
                                      isChecked
                                        ? 'bg-[#C9A24B] text-white shadow-xs'
                                        : 'bg-stone-100 text-stone-300 hover:bg-stone-200 hover:text-stone-500'
                                    }`}
                                  >
                                    {isChecked ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3 h-3" />}
                                  </button>
                                </td>
                              );
                            })}

                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleAllForModule(module.id)}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                                  allChecked
                                    ? 'bg-amber-100 text-[#98752B]'
                                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                                }`}
                              >
                                {allChecked ? 'إلغاء' : 'تحديد'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-stone-200">
                <button
                  type="submit"
                  disabled={roleSaving}
                  className="flex-1 py-3 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{roleSaving ? 'جاري الحفظ...' : editingRoleId ? 'حفظ تعديلات الدور' : 'إنشاء الدور'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-6 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE USER CONFIRMATION MODAL                                            */}
      {/* ========================================================================= */}
      {deleteUserModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="font-cairo font-bold text-xl text-stone-900 text-center mb-2">تأكيد حذف المستخدم</h3>
            <p className="text-xs sm:text-sm text-stone-600 text-center leading-relaxed mb-6">
              هل أنت متأكد من رغبتك في حذف حساب المستخدم <strong className="text-stone-900">"{deleteUserModal.user?.name}"</strong> ({deleteUserModal.user?.email})؟ لن يتمكن من تسجيل الدخول بعد الآن.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExecuteDeleteUser}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-colors"
              >
                نعم، احذف المستخدم
              </button>
              <button
                onClick={() => setDeleteUserModal({ isOpen: false, user: null })}
                className="flex-1 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE ROLE CONFIRMATION MODAL                                            */}
      {/* ========================================================================= */}
      {deleteRoleModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="font-cairo font-bold text-xl text-stone-900 text-center mb-2">تأكيد حذف الدور المخصص</h3>
            <p className="text-xs sm:text-sm text-stone-600 text-center leading-relaxed mb-6">
              هل أنت متأكد من حذف الدور <strong className="text-stone-900">"{deleteRoleModal.role?.name}"</strong>؟ سيتم إلغاء تعيين هذا الدور عن كافة المستخدمين المرتبطين به.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExecuteDeleteRole}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-colors"
              >
                نعم، احذف الدور
              </button>
              <button
                onClick={() => setDeleteRoleModal({ isOpen: false, role: null })}
                className="flex-1 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
