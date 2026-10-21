export type { AdminUser } from './index';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'export';

export type PermissionModule = 
  | 'hotels'               // الفنادق المعتمدة
  | 'branches'             // فروع ومكاتب الشركة
  | 'availability_pricing' // التوفر والأسعار والغرف
  | 'booking_settings'     // إعدادات وسياسات الحجز
  | 'bookings_log'         // سجل الحجوزات
  | 'invoices_policies'    // الفواتير وسياسات الإلغاء
  | 'site_content'         // محتوى الموقع والواجهة
  | 'users_roles'          // المستخدمين والأدوار والصلاحيات
  | 'system_settings';     // إعدادات النظام والهوية وسجل العمليات

export interface ModuleDefinition {
  id: PermissionModule;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
}

export const PERMISSION_MODULES: ModuleDefinition[] = [
  {
    id: 'hotels',
    labelAr: 'الفنادق المعتمدة',
    labelEn: 'Approved Hotels',
    descriptionAr: 'إدارة وتعديل الفنادق، التصنيفات، الصور، المرافق والمواقع الجغرافية',
    descriptionEn: 'Manage hotels, categories, gallery, amenities and coordinates'
  },
  {
    id: 'branches',
    labelAr: 'الفروع ومكاتب الشركة',
    labelEn: 'Branches & Offices',
    descriptionAr: 'إدارة فروع برستيج بمكة، المدينة، القاهرة، وإندونيسيا',
    descriptionEn: 'Manage branches in Makkah, Madinah, Cairo, and Indonesia'
  },
  {
    id: 'availability_pricing',
    labelAr: 'التوفر والأسعار والغرف',
    labelEn: 'Availability & Pricing',
    descriptionAr: 'التحكم في أسعار الغرف اليومية، الإتاحة، المخزون، وخطط الوجبات',
    descriptionEn: 'Control room daily rates, inventory, availability and meal plans'
  },
  {
    id: 'booking_settings',
    labelAr: 'إعدادات وسياسات الحجز',
    labelEn: 'Booking Settings',
    descriptionAr: 'سياسات الإلغاء، أوقات الدخول والمغادرة، شروط الدفع، والضرائب',
    descriptionEn: 'Cancellation policies, check-in/out times, terms and taxes'
  },
  {
    id: 'bookings_log',
    labelAr: 'سجل الحجوزات والنزلاء',
    labelEn: 'Bookings Log',
    descriptionAr: 'متابعة وتأكيد وتعديل حالات الحجوزات، إصدار السندات، والمفتاح الرقمي',
    descriptionEn: 'Track, confirm and update booking statuses, vouchers, and digital keys'
  },
  {
    id: 'invoices_policies',
    labelAr: 'الفواتير والسياسات المالية',
    labelEn: 'Invoices & Financial Policies',
    descriptionAr: 'عرض وتصدير فواتير الحجوزات وسندات القبض وسياسات الاسترداد',
    descriptionEn: 'View and export booking invoices, receipts and refund policies'
  },
  {
    id: 'site_content',
    labelAr: 'محتوى الموقع والواجهة',
    labelEn: 'Site Content & Layout',
    descriptionAr: 'شرائح الهيرو، فيديو الإنترو، قصة الشركة، الخدمات، والترجمات',
    descriptionEn: 'Hero slides, intro video, story, services, and live text translations'
  },
  {
    id: 'users_roles',
    labelAr: 'المستخدمين والأدوار والصلاحيات',
    labelEn: 'Users & Roles Management',
    descriptionAr: 'إدارة حسابات المشرفين، إنشاء الأدوار وتعيين مصفوفات الصلاحيات',
    descriptionEn: 'Manage admin accounts, create custom roles, and assign permissions'
  },
  {
    id: 'system_settings',
    labelAr: 'إعدادات النظام وسجل العمليات',
    labelEn: 'System Settings & Audit Log',
    descriptionAr: 'إعدادات الهوية والشعار، الاتصال بقاعدة البيانات، وسجل تدقيق العمليات',
    descriptionEn: 'Branding, logo, database connections, and system audit logs'
  }
];

export const ALL_PERMISSION_ACTIONS: { id: PermissionAction; labelAr: string; labelEn: string }[] = [
  { id: 'view', labelAr: 'عرض (View)', labelEn: 'View' },
  { id: 'create', labelAr: 'إضافة (Create)', labelEn: 'Create' },
  { id: 'edit', labelAr: 'تعديل (Edit)', labelEn: 'Edit' },
  { id: 'delete', labelAr: 'حذف (Delete)', labelEn: 'Delete' },
  { id: 'export', labelAr: 'تصدير (Export)', labelEn: 'Export' }
];

export type RolePermissions = {
  [module in PermissionModule]?: {
    view?: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
    export?: boolean;
  };
};

export interface AdminRole {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  isSystem?: boolean; // Super Admin is fixed and cannot be edited or deleted
  permissions: RolePermissions;
  createdAt: number;
  updatedAt?: number;
}

// Built-in fixed Super Admin Role
export const SUPER_ADMIN_ROLE_ID = 'role_super_admin';

export const SUPER_ADMIN_ROLE: AdminRole = {
  id: SUPER_ADMIN_ROLE_ID,
  name: 'المدير العام (Super Admin)',
  nameEn: 'Super Admin',
  description: 'صلاحيات إدارية كاملة غير مقيدة على كافة أقسام ووظائف المنصة (دور نظامي ثابت لا يمكن تعديله أو حذفه)',
  isSystem: true,
  permissions: {
    hotels: { view: true, create: true, edit: true, delete: true, export: true },
    branches: { view: true, create: true, edit: true, delete: true, export: true },
    availability_pricing: { view: true, create: true, edit: true, delete: true, export: true },
    booking_settings: { view: true, create: true, edit: true, delete: true, export: true },
    bookings_log: { view: true, create: true, edit: true, delete: true, export: true },
    invoices_policies: { view: true, create: true, edit: true, delete: true, export: true },
    site_content: { view: true, create: true, edit: true, delete: true, export: true },
    users_roles: { view: true, create: true, edit: true, delete: true, export: true },
    system_settings: { view: true, create: true, edit: true, delete: true, export: true }
  },
  createdAt: 1704067200000 // 2024-01-01
};

// Seed Example Role: Bookings Staff (موظف حجوزات)
export const BOOKINGS_STAFF_ROLE_ID = 'role_bookings_staff';

export const BOOKINGS_STAFF_ROLE: AdminRole = {
  id: BOOKINGS_STAFF_ROLE_ID,
  name: 'موظف حجوزات (Bookings Staff)',
  nameEn: 'Bookings Staff',
  description: 'صلاحية استعراض سجل الحجوزات وتحديث حالاتها وإصدار سندات الحجز والفواتير',
  isSystem: false,
  permissions: {
    bookings_log: { view: true, create: false, edit: true, delete: false, export: true },
    invoices_policies: { view: true, create: false, edit: false, delete: false, export: true },
    hotels: { view: true, create: false, edit: false, delete: false, export: false },
    availability_pricing: { view: true, create: false, edit: false, delete: false, export: false }
  },
  createdAt: 1704067200000
};

// Seed Example Role: Availability Manager (مدير التوفر والأسعار)
export const AVAILABILITY_MANAGER_ROLE_ID = 'role_availability_manager';

export const AVAILABILITY_MANAGER_ROLE: AdminRole = {
  id: AVAILABILITY_MANAGER_ROLE_ID,
  name: 'مدير التوفر والأسعار (Availability Manager)',
  nameEn: 'Availability Manager',
  description: 'إدارة كاملة لأسعار الغرف والتوفر والمخزون اليومي مع صلاحية تصدير التقارير',
  isSystem: false,
  permissions: {
    availability_pricing: { view: true, create: true, edit: true, delete: true, export: true },
    hotels: { view: true, create: false, edit: false, delete: false, export: false },
    booking_settings: { view: true, create: false, edit: true, delete: false, export: false }
  },
  createdAt: 1704067200000
};

export const DEFAULT_ADMIN_ROLES: AdminRole[] = [
  SUPER_ADMIN_ROLE,
  BOOKINGS_STAFF_ROLE,
  AVAILABILITY_MANAGER_ROLE
];

// Audit Log Types
export interface AuditLogEntry {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  userEmail?: string;
  module: PermissionModule;
  action: string;
  actionLabelAr: string;
  recordId?: string;
  recordTitle?: string;
  details: string;
  oldValue?: any;
  newValue?: any;
}
