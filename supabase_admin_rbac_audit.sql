-- ==============================================================================
-- PRESTIGE HOTELS - RBAC ROLES & AUDIT LOGS SUPABASE SCHEMA
-- Execute this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nejmudhoamtugdaqfbdd/sql/new
-- ==============================================================================

-- 1. ADMIN ROLES TABLE
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT DEFAULT '',
    description TEXT DEFAULT '',
    is_system BOOLEAN DEFAULT false,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated access
DROP POLICY IF EXISTS "Public access for admin_roles" ON public.admin_roles;
CREATE POLICY "Public access for admin_roles"
    ON public.admin_roles
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 2. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT,
    module TEXT NOT NULL,
    action TEXT NOT NULL,
    action_label_ar TEXT,
    record_id TEXT,
    record_title TEXT,
    details TEXT DEFAULT '',
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Indexes for lightning fast queries and sorting
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON public.audit_logs (module);

-- Enable Row Level Security (RLS)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated access
DROP POLICY IF EXISTS "Public read and write for audit_logs" ON public.audit_logs;
CREATE POLICY "Public read and write for audit_logs"
    ON public.audit_logs
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 3. SEED DEFAULT SYSTEM ROLES
INSERT INTO public.admin_roles (id, name, name_en, description, is_system, permissions)
VALUES 
(
    'role_super_admin',
    'المدير العام (Super Admin)',
    'Super Administrator',
    'كامل الصلاحيات المطلقة لإدارة المنصة، المستخدمين، الأدوار، الحجوزات، وكافة الإعدادات الحساسة.',
    true,
    '{
        "hotels": {"view": true, "create": true, "edit": true, "delete": true, "export": true},
        "offers": {"view": true, "create": true, "edit": true, "delete": true, "export": true},
        "bookings": {"view": true, "create": true, "edit": true, "delete": true, "export": true},
        "availability_pricing": {"view": true, "create": true, "edit": true, "delete": true, "export": true},
        "reviews": {"view": true, "create": true, "edit": true, "delete": true, "export": true},
        "messages": {"view": true, "create": true, "edit": true, "delete": true, "export": true},
        "districts": {"view": true, "create": true, "edit": true, "delete": true, "export": true},
        "users_management": {"view": true, "create": true, "edit": true, "delete": true, "export": true},
        "roles_permissions": {"view": true, "create": true, "edit": true, "delete": true, "export": true},
        "system_settings": {"view": true, "create": true, "edit": true, "delete": true, "export": true},
        "audit_logs": {"view": true, "create": true, "edit": true, "delete": true, "export": true}
    }'::jsonb
),
(
    'role_bookings_staff',
    'موظف حجوزات وفواتير',
    'Bookings & Reservations Staff',
    'صلاحية استعراض وإدارة طلبات التسكين، إصدار وتعديل الفواتير وسندات القبض، وتحديث حالات الحجوزات.',
    true,
    '{
        "hotels": {"view": true, "create": false, "edit": false, "delete": false, "export": false},
        "offers": {"view": true, "create": false, "edit": false, "delete": false, "export": false},
        "bookings": {"view": true, "create": true, "edit": true, "delete": false, "export": true},
        "availability_pricing": {"view": true, "create": false, "edit": false, "delete": false, "export": false},
        "reviews": {"view": true, "create": false, "edit": false, "delete": false, "export": false},
        "messages": {"view": true, "create": false, "edit": false, "delete": false, "export": false},
        "districts": {"view": true, "create": false, "edit": false, "delete": false, "export": false},
        "users_management": {"view": false, "create": false, "edit": false, "delete": false, "export": false},
        "roles_permissions": {"view": false, "create": false, "edit": false, "delete": false, "export": false},
        "system_settings": {"view": false, "create": false, "edit": false, "delete": false, "export": false},
        "audit_logs": {"view": true, "create": false, "edit": false, "delete": false, "export": false}
    }'::jsonb
),
(
    'role_availability_manager',
    'مدير التوفر والأسعار (Inventory Manager)',
    'Inventory & Availability Manager',
    'صلاحية إدارة جدول التوفر والمخزون، أسعار المواسم، ومخزون الغرف اليومي لمنع الحجز المزدوج.',
    true,
    '{
        "hotels": {"view": true, "create": false, "edit": true, "delete": false, "export": false},
        "offers": {"view": true, "create": false, "edit": false, "delete": false, "export": false},
        "bookings": {"view": true, "create": false, "edit": false, "delete": false, "export": true},
        "availability_pricing": {"view": true, "create": true, "edit": true, "delete": true, "export": true},
        "reviews": {"view": true, "create": false, "edit": false, "delete": false, "export": false},
        "messages": {"view": false, "create": false, "edit": false, "delete": false, "export": false},
        "districts": {"view": true, "create": false, "edit": false, "delete": false, "export": false},
        "users_management": {"view": false, "create": false, "edit": false, "delete": false, "export": false},
        "roles_permissions": {"view": false, "create": false, "edit": false, "delete": false, "export": false},
        "system_settings": {"view": false, "create": false, "edit": false, "delete": false, "export": false},
        "audit_logs": {"view": true, "create": false, "edit": false, "delete": false, "export": false}
    }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    permissions = EXCLUDED.permissions,
    updated_at = timezone('utc'::text, now());
