-- ==============================================================================
-- Prestige Hotels Management - Supabase PostgreSQL Database Schema
-- شركة برستيج لإدارة وتشغيل الفنادق - سكريبت إنشاء جداول قاعدة بيانات Supabase
-- ==============================================================================

-- 1. DISTRICTS TABLE (المناطق والأحياء)
CREATE TABLE IF NOT EXISTS public.districts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'مكة المكرمة',
    description TEXT,
    distance_range TEXT,
    order_num INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Districts (الأحياء والمناطق الأساسية)
INSERT INTO public.districts (id, name, city, description, distance_range, order_num)
VALUES
    ('dist_ajyad', 'أجياد', 'مكة المكرمة', 'منطقة حيوية مقابلة لأبراج البيت وباب الملك عبدالعزيز', '١٠٠ - ٣٥٠ م', 1),
    ('dist_mesfalah', 'المسفلة', 'مكة المكرمة', 'شارع إبراهيم الخليل والخدمات المركزية وباب الملك فهد', '٥٠٠ - ٨٥٠ م', 2),
    ('dist_mahbas', 'محبس الجن', 'مكة المكرمة', 'منطقة كبرى مع حافلات نقل ترددي مستمرة 24 ساعة للحرم', 'حافلات ترددية (دقائق)', 3),
    ('dist_aziziyah', 'العزيزية', 'مكة المكرمة', 'أرقى الفنادق والمقرات الواسعة للحملات والمجموعات', 'توصيل مجاني مستمر', 4),
    ('dist_aziziyah_north', 'العزيزية الشمالية', 'مكة المكرمة', 'طريق المسجد الحرام وقرب محطات النقل السريع', 'حافلات ترددية 24/7', 5),
    ('dist_ghazzah', 'المركزية / الغزة', 'مكة المكرمة', 'مقابل التوسعة الشمالية وساحات الحرم', '٢٠٠ - ٤٠٠ م', 6),
    ('dist_shubaika', 'الشبيكة / الغزة', 'مكة المكرمة', 'المنطقة المركزية الغربية وقرب بوابات الحرم', '٣٠٠ - ٥٠٠ م', 7),
    ('dist_kudai', 'كدي / أجياد', 'مكة المكرمة', 'قرب مواقف كدي وشارع أجياد السريع', '٧٠٠ - ٩٠٠ م', 8),
    ('dist_central_north_madinah', 'المنطقة المركزية الشمالية', 'المدينة المنورة', 'مقابل ساحات المسجد النبوي الشريف ومصلى النساء', '١٠٠ - ٢٥٠ م', 9),
    ('dist_central_west_madinah', 'المنطقة المركزية الغربية', 'المدينة المنورة', 'قرب باب السلام والساحات الغربية للمسجد النبوي', '١٥٠ - ٣٠٠ م', 10),
    ('dist_central_south_madinah', 'المنطقة المركزية الجنوبية', 'المدينة المنورة', 'قرب ساحة قباء وباب قباء', '٢٠٠ - ٤٠٠ م', 11)
ON CONFLICT (id) DO NOTHING;

-- 2. ADMIN USERS TABLE (المستخدمين وصلاحيات الإدارة)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'controller', -- 'admin' (مدير عام) or 'controller' (مشرف)
    password TEXT NOT NULL DEFAULT '199991',
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Super Admin (المدير العام الثابت A.hesham)
INSERT INTO public.admin_users (id, name, username, email, role, password, status, notes)
VALUES (
    'usr_super_admin_hesham',
    'المدير العام (أحمد هشام)',
    'A.hesham',
    'a.hesham@prestigehotels.sa',
    'admin',
    '199991',
    'active',
    'حساب المدير العام الرئيسي الثابت ولا يمكن تعديله أو حذفه'
)
ON CONFLICT (id) DO UPDATE SET 
    username = 'A.hesham',
    password = '199991',
    role = 'admin',
    name = 'المدير العام (أحمد هشام)';

-- 3. HOTELS TABLE (الفنادق المعتمدة)
CREATE TABLE IF NOT EXISTS public.hotels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    city TEXT NOT NULL DEFAULT 'مكة المكرمة',
    district TEXT NOT NULL,
    stars INTEGER DEFAULT 5,
    distance_to_haram INTEGER DEFAULT 100,
    distance_text TEXT,
    walking_time_minutes INTEGER DEFAULT 2,
    featured BOOLEAN DEFAULT true,
    categories JSONB DEFAULT '["فنادق سنوية", "فنادق العمرة"]'::jsonb,
    rating NUMERIC(3, 1) DEFAULT 4.8,
    review_count INTEGER DEFAULT 0,
    main_image TEXT NOT NULL,
    gallery_images JSONB DEFAULT '[]'::jsonb,
    video_url TEXT,
    overview TEXT,
    detailed_description TEXT,
    amenities JSONB DEFAULT '[]'::jsonb,
    booking_url TEXT,
    show_booking_url BOOLEAN DEFAULT true,
    agoda_url TEXT,
    show_agoda_url BOOLEAN DEFAULT true,
    expedia_url TEXT,
    show_expedia_url BOOLEAN DEFAULT true,
    google_maps_url TEXT,
    show_google_maps_url BOOLEAN DEFAULT true,
    hotel_whatsapp TEXT,
    show_hotel_whatsapp BOOLEAN DEFAULT true,
    hotel_email TEXT,
    show_hotel_email BOOLEAN DEFAULT true,
    location JSONB DEFAULT '{}'::jsonb,
    keywords TEXT,
    meta_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. OFFERS TABLE (العروض والمناسبات)
CREATE TABLE IF NOT EXISTS public.offers (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    short_description TEXT,
    full_description TEXT,
    media_type TEXT DEFAULT 'image',
    media_url TEXT NOT NULL,
    video_url TEXT,
    discount_percentage INTEGER DEFAULT 0,
    end_date TEXT,
    is_active BOOLEAN DEFAULT true,
    badge_text TEXT,
    keywords TEXT,
    meta_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. REVIEWS TABLE (التقييمات وتجارب النزلاء)
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    hotel_id TEXT,
    hotel_name TEXT,
    author_name TEXT NOT NULL,
    country TEXT,
    rating INTEGER DEFAULT 5,
    comment TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending' or 'approved'
    stay_date TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MESSAGES TABLE (رسائل واستفسارات الضيوف)
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    city TEXT,
    hotel_interest TEXT,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SITE SETTINGS TABLE (إعدادات وهوية الموقع)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY DEFAULT 'main_config',
    settings_data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. LIVE CONTENT TABLE (نصوص وتعديلات الواجهة الحية)
CREATE TABLE IF NOT EXISTS public.content (
    key TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    color TEXT,
    font_size TEXT,
    font_weight TEXT,
    updated_at BIGINT,
    updated_by TEXT
);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- تمكين القراءة العامة والإدخال المباشر
-- ==============================================================================

ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- Allow Public Read on catalog tables
CREATE POLICY "Public Read Districts" ON public.districts FOR SELECT USING (true);
CREATE POLICY "Public Read Admin Users" ON public.admin_users FOR SELECT USING (true);
CREATE POLICY "Public Read Hotels" ON public.hotels FOR SELECT USING (true);
CREATE POLICY "Public Read Offers" ON public.offers FOR SELECT USING (true);
CREATE POLICY "Public Read Reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public Read Settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Content" ON public.content FOR SELECT USING (true);

-- Allow Public Insert for Guest Messages and Reviews
CREATE POLICY "Public Insert Messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Reviews" ON public.reviews FOR INSERT WITH CHECK (true);

-- Allow Full Access with Anon Key for Dashboard Operations
CREATE POLICY "Anon Full Access Districts" ON public.districts FOR ALL USING (true);
CREATE POLICY "Anon Full Access Hotels" ON public.hotels FOR ALL USING (true);
CREATE POLICY "Anon Full Access Offers" ON public.offers FOR ALL USING (true);
CREATE POLICY "Anon Full Access Reviews" ON public.reviews FOR ALL USING (true);
CREATE POLICY "Anon Full Access Messages" ON public.messages FOR ALL USING (true);
CREATE POLICY "Anon Full Access Settings" ON public.site_settings FOR ALL USING (true);
CREATE POLICY "Anon Full Access Admin Users" ON public.admin_users FOR ALL USING (true);
CREATE POLICY "Anon Full Access Content" ON public.content FOR ALL USING (true);
