import React, { useState } from 'react';
import { AdminUser, UserRole } from '../types';
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
  EyeOff
} from 'lucide-react';
import { 
  saveAdminUserToDb, 
  deleteAdminUserFromDb 
} from '../services/firebase';

interface AdminUsersManagerProps {
  users: AdminUser[];
  currentUserId?: string;
  currentUserRole?: UserRole;
  onRefreshUsers: () => Promise<void>;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminUsersManager: React.FC<AdminUsersManagerProps> = ({
  users,
  currentUserId,
  currentUserRole = 'admin',
  onRefreshUsers,
  onShowToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = currentUserRole === 'admin';

  const [userForm, setUserForm] = useState<AdminUser>({
    id: '',
    name: '',
    username: '',
    email: '',
    role: 'controller',
    password: '',
    status: 'active',
    notes: '',
    createdAt: Date.now()
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    user: AdminUser | null;
  }>({
    isOpen: false,
    user: null
  });

  const handleOpenAddModal = () => {
    setEditingUserId(null);
    setShowPassword(true);
    setUserForm({
      id: 'usr_' + Date.now(),
      name: '',
      username: '',
      email: '',
      role: 'controller',
      password: '',
      status: 'active',
      notes: '',
      createdAt: Date.now()
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: AdminUser) => {
    setEditingUserId(user.id);
    setShowPassword(false);
    setUserForm({ ...user });
    setIsModalOpen(true);
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
    if (!userForm.email.trim()) {
      onShowToast('يرجى إدخال البريد الإلكتروني', 'error');
      return;
    }
    if (!editingUserId && !userForm.password?.trim()) {
      onShowToast('يرجى كتابة كلمة مرور للمستخدم الجديد', 'error');
      return;
    }

    // Role enforcement: A.hesham is the fixed Super Admin, all others are controllers (مشرفين)
    const isTargetSuperAdmin = userForm.username.trim().toLowerCase() === 'a.hesham' || userForm.id === 'usr_super_admin_hesham';
    const enforcedRole: UserRole = isTargetSuperAdmin ? 'admin' : 'controller';
    const enforcedPassword = isTargetSuperAdmin ? '199991' : (userForm.password || '123456');

    setSaving(true);
    try {
      await saveAdminUserToDb({
        ...userForm,
        username: isTargetSuperAdmin ? 'A.hesham' : userForm.username.trim(),
        role: enforcedRole,
        password: enforcedPassword
      });
      await onRefreshUsers();
      setIsModalOpen(false);
      onShowToast(editingUserId ? 'تم تحديث بيانات المستخدم بنجاح' : 'تم إنشاء المستخدم بنجاح', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء حفظ بيانات المستخدم', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    if (user.username?.toLowerCase() === 'a.hesham' || user.id === 'usr_super_admin_hesham') {
      onShowToast('لا يمكن تعطيل حساب المدير العام الرئيسي الثابت (A.hesham)', 'error');
      return;
    }
    try {
      const updated: AdminUser = {
        ...user,
        status: user.status === 'active' ? 'inactive' : 'active'
      };
      await saveAdminUserToDb(updated);
      await onRefreshUsers();
      onShowToast(updated.status === 'active' ? 'تم تفعيل حساب المستخدم' : 'تم تعطيل حساب المستخدم مؤقتاً', 'info');
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء تغيير حالة الحساب', 'error');
    }
  };

  const confirmDeleteUser = (user: AdminUser) => {
    if (user.username?.toLowerCase() === 'a.hesham' || user.id === 'usr_super_admin_hesham') {
      onShowToast('لا يمكن حذف حساب المدير العام الرئيسي الثابت (A.hesham)', 'error');
      return;
    }
    if (users.length <= 1) {
      onShowToast('لا يمكن حذف المستخدم الوحيد في النظام', 'error');
      return;
    }
    setDeleteModal({
      isOpen: true,
      user
    });
  };

  const handleExecuteDelete = async () => {
    if (!deleteModal.user) return;
    try {
      await deleteAdminUserFromDb(deleteModal.user.id);
      await onRefreshUsers();
      onShowToast(`تم حذف المستخدم "${deleteModal.user.name}" بنجاح`, 'success');
    } catch (err) {
      console.error(err);
      onShowToast('حدث خطأ أثناء حذف المستخدم', 'error');
    } finally {
      setDeleteModal({ isOpen: false, user: null });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-cairo font-bold text-stone-900">إدارة المستخدمين وصلاحيات الوصول</h2>
          </div>
          <p className="text-xs text-stone-500">
            إضافة وتعديل حسابات المدراء (أدمن) والمتحكمين / المشرفين مع تحديد الصلاحيات
          </p>
        </div>

        {currentUserRole === 'admin' && (
          <button
            onClick={handleOpenAddModal}
            id="admin-add-user-btn"
            className="px-5 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة مستخدم جديد</span>
          </button>
        )}
      </div>

      {/* Roles Legend & Permissions Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Super Admin Box */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
          <div className="flex items-center gap-2 text-[#B38A34]">
            <ShieldCheck className="w-5 h-5" />
            <strong className="font-cairo font-bold text-sm">صلاحية: مدير عام (أدمن)</strong>
          </div>
          <p className="text-xs text-stone-700 leading-relaxed">
            صلاحيات كاملة وغير مقيدة: إضافة وتعديل وحذف الفنادق والعروض والتقييمات والرسائل والأحياء، والتحكم في إعدادات وهوية الموقع وإدارة حسابات المستخدمين الآخرين.
          </p>
        </div>

        {/* Controller / Supervisor Box */}
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2">
          <div className="flex items-center gap-2 text-blue-700">
            <Shield className="w-5 h-5" />
            <strong className="font-cairo font-bold text-sm">صلاحية: متحكم / مشرف (Controller)</strong>
          </div>
          <p className="text-xs text-stone-700 leading-relaxed">
            صلاحيات تشغيلية: إدارة وتعديل الفنادق، العروض، السلايدر، مراجعة واعتماد التقييمات، متابعة الرسائل، وإدارة الأحياء والمناطق دون الوصول لتعديل المستخدمين أو الإعدادات العامة.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-stone-500 text-xs font-semibold">
              <th className="pb-3 pr-2">المستخدم</th>
              <th className="pb-3">اسم المستخدم</th>
              <th className="pb-3">البريد الإلكتروني</th>
              <th className="pb-3">الدور / الصلاحية</th>
              <th className="pb-3 text-center">الحالة</th>
              <th className="pb-3">تاريخ الإنشاء</th>
              <th className="pb-3 pl-2 text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                <td className="py-3.5 pr-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      user.role === 'admin'
                        ? 'bg-[#C9A24B]/15 text-[#B38A34]'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {user.role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                    </div>
                    <div>
                      <strong className="text-stone-900 font-bold block text-sm">
                        {user.name}
                      </strong>
                      {user.notes && (
                        <span className="text-[11px] text-stone-500 line-clamp-1">
                          {user.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                <td className="py-3.5 font-mono text-xs font-bold text-[#B38A34] dir-ltr text-right">
                  {user.username || user.email.split('@')[0]}
                </td>

                <td className="py-3.5 font-mono text-xs text-stone-700 dir-ltr text-right">
                  {user.email}
                </td>

                <td className="py-3.5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    user.role === 'admin'
                      ? 'bg-amber-100 text-[#98752B] border border-amber-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {user.role === 'admin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
                    <span>{user.role === 'admin' ? 'مدير عام (أدمن)' : 'مشرف'}</span>
                  </span>
                </td>

                <td className="py-3.5 text-center">
                  <button
                    onClick={() => handleToggleStatus(user)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border ${
                      user.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                    }`}
                    title="اضغط لتغيير حالة التفعيل"
                  >
                    {user.status === 'active' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                    <span>{user.status === 'active' ? 'نشط' : 'معطل'}</span>
                  </button>
                </td>

                <td className="py-3.5 text-stone-500 text-xs">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-SA') : '-'}
                </td>

                <td className="py-3.5 pl-2 text-left">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditModal(user)}
                      className="p-2 rounded-lg bg-stone-100 hover:bg-[#C9A24B] hover:text-white text-stone-700 transition-colors"
                      title="تعديل المستخدم والصلاحية"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {user.email.toLowerCase() !== 'ahmed.tito.h1@gmail.com' && (
                      <button
                        onClick={() => confirmDeleteUser(user)}
                        className="p-2 rounded-lg bg-stone-100 hover:bg-red-500 hover:text-white text-stone-700 transition-colors"
                        title="حذف المستخدم"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#C9A24B]/15 text-[#B38A34] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-cairo font-bold text-lg text-stone-900">
                  {editingUserId ? 'تعديل بيانات المستخدم والصلاحية' : 'إضافة مستخدم جديد'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
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
                  placeholder="مثال: أحمد محمد، سارة العتيبي..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">اسم المستخدم (Username): *</label>
                <input
                  type="text"
                  required
                  value={userForm.username || ''}
                  onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="مثال: ahmed, supervisor1, admin"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-right font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">البريد الإلكتروني: *</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="name@prestigehotels.sa"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B] dir-ltr text-right font-mono"
                />
              </div>

              {/* Password Field: Super Admin only can change passwords */}
              {isSuperAdmin ? (
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    كلمة المرور: {editingUserId && '(اتركها فارغة إذا لم ترغب في تغييرها)'}
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
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>تغيير كلمة المرور متاح للمدير العام فقط (ahmed.tito.h1@gmail.com).</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">الدور والصلاحية:</label>
                <div className="p-3.5 rounded-2xl border-2 bg-stone-50 border-stone-200">
                  {userForm.email.trim().toLowerCase() === 'ahmed.tito.h1@gmail.com' ? (
                    <div className="flex items-center gap-2 text-[#B38A34]">
                      <ShieldCheck className="w-5 h-5 text-[#B38A34]" />
                      <div>
                        <strong className="text-xs font-bold block text-stone-900">مدير عام (Super Admin)</strong>
                        <span className="text-[11px] text-stone-500">حساب الإدارة العليا الحصري</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-blue-700">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <div>
                        <strong className="text-xs font-bold block text-stone-900">مشرف (Supervisor / Controller)</strong>
                        <span className="text-[11px] text-stone-500">صلاحيات إدارة الفنادق والعروض والتقييمات والرسائل</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">ملاحظات أو الوصف الوظيفي:</label>
                <input
                  type="text"
                  value={userForm.notes || ''}
                  onChange={(e) => setUserForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="مثال: مشرف حجوزات مكة المكرمة..."
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:bg-white focus:border-[#C9A24B]"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-[#C9A24B] hover:bg-[#B38A34] text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? 'جاري الحفظ...' : editingUserId ? 'حفظ التعديلات' : 'إنشاء الحساب'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="font-cairo font-bold text-xl text-stone-900 text-center mb-2">تأكيد حذف المستخدم</h3>
            <p className="text-xs sm:text-sm text-stone-600 text-center leading-relaxed mb-6">
              هل أنت متأكد من رغبتك في حذف حساب المستخدم <strong className="text-stone-900">"{deleteModal.user?.name}"</strong> ({deleteModal.user?.email})؟ لن يتمكن من تسجيل الدخول بعد الآن.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExecuteDelete}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-colors"
              >
                نعم، احذف المستخدم
              </button>
              <button
                onClick={() => setDeleteModal({ isOpen: false, user: null })}
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
