-- ==============================================================================
-- Prestige Hotels Management - Complete Supabase Master Setup (Zero Mock Data)
-- شركة برستيج لإدارة وتشغيل الفنادق - سكريبت التأسيس الشامل لقاعدة البيانات بدون بيانات وهمية
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS & STORAGE SETUP (حاوية تخزين الوسائط السحابية: صور وفيديوهات)
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- إنشاء حاوية وسائط الموقع والفنادق والفيديوهات (prestige-media)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prestige-media',
  'prestige-media',
  true,
  104857600, -- 100 ميجابايت كحد أقصى لكل ملف (فيديو أو صورة عالية الدقة)
  ARRAY[
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml'
  ];

-- سياسات الأمان لحاوية التخزين (قراءة ورفع وتعديل وحذف مباشر)
DROP POLICY IF EXISTS "Public Access to prestige-media" ON storage.objects;
CREATE POLICY "Public Access to prestige-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'prestige-media');

DROP POLICY IF EXISTS "Public Upload to prestige-media" ON storage.objects;
CREATE POLICY "Public Upload to prestige-media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'prestige-media');

DROP POLICY IF EXISTS "Public Update to prestige-media" ON storage.objects;
CREATE POLICY "Public Update to prestige-media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'prestige-media');

DROP POLICY IF EXISTS "Public Delete from prestige-media" ON storage.objects;
CREATE POLICY "Public Delete from prestige-media"
ON storage.objects FOR DELETE
USING (bucket_id = 'prestige-media');


-- ------------------------------------------------------------------------------
-- 2. DISTRICTS TABLE (المناطق والأحياء بمكة المكرمة والمدينة المنورة)
-- ------------------------------------------------------------------------------
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

-- إدراج الأحياء والمناطق الأساسية للمدينتين المقدستين
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


-- ------------------------------------------------------------------------------
-- 3. ADMIN USERS TABLE (حسابات المشرفين والمدير العام)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'controller', -- 'admin' (مدير عام) أو 'controller' (مشرف)
    password TEXT NOT NULL DEFAULT '199991',
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- تثبيت حساب المدير العام الرئيسي الثابت (A.hesham / 199991)
INSERT INTO public.admin_users (id, name, username, email, role, password, status, notes)
VALUES (
    'usr_super_admin_hesham',
    'المدير العام (أحمد هشام)',
    'A.hesham',
    'a.hesham@prestigehotels.sa',
    'admin',
    '199991',
    'active',
    'حساب المدير العام الرئيسي الثابت ولا يمكن حذفه'
)
ON CONFLICT (id) DO UPDATE SET 
    username = 'A.hesham',
    password = '199991',
    role = 'admin',
    name = 'المدير العام (أحمد هشام)';


-- ------------------------------------------------------------------------------
-- 4. HOTELS TABLE (جدول الفنادق - فارغ تماماً بانتظار إدخالات الإدارة)
-- ------------------------------------------------------------------------------
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
    categories JSONB DEFAULT '[]'::jsonb,
    rating NUMERIC(3, 1) DEFAULT 5.0,
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
    is_active BOOLEAN DEFAULT true,
    order_num INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ------------------------------------------------------------------------------
-- 5. OFFERS TABLE (العروض والمناسبات - فارغ بانتظار إدخالات الإدارة)
-- ------------------------------------------------------------------------------
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


-- ------------------------------------------------------------------------------
-- 6. REVIEWS TABLE (التقييمات وتجارب النزلاء المعتمدة)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    hotel_id TEXT,
    hotel_name TEXT,
    author_name TEXT NOT NULL,
    country TEXT,
    rating INTEGER DEFAULT 5,
    comment TEXT NOT NULL,
    status TEXT DEFAULT 'approved', -- 'pending' أو 'approved'
    stay_date TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ------------------------------------------------------------------------------
-- 7. MESSAGES TABLE (رسائل واستفسارات ضيوف الرحمن)
-- ------------------------------------------------------------------------------
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


-- ------------------------------------------------------------------------------
-- 8. SITE SETTINGS TABLE (إعدادات وهوية الموقع والشرائح والفروع وجهات الاتصال)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY DEFAULT 'main_config',
    settings_data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- تهيئة إعدادات الموقع الأساسية (بدون شرائح وهمية، جاهزة للرفع من الإدارة)
INSERT INTO public.site_settings (id, settings_data)
VALUES (
  'main_config',
  '{
    "siteTitle": "برستيج لإدارة وتشغيل الفنادق",
    "siteSubtitle": "تسكين وفنادق مكة المكرمة والمدينة المنورة",
    "logoUrl": "",
    "faviconUrl": "",
    "metaDescription": "شركة برستيج لإدارة وتشغيل الفنادق - رواد الضيافة والتسكين الفندقي في مكة المكرمة والمدينة المنورة.",
    "metaKeywords": "فنادق مكة, فنادق المدينة, حجز فنادق الحرم, برستيج لإدارة الفنادق, تسكين فنادق, عمرة وحج",
    "heroSlides": [],
    "channels": [
      {
        "id": "ch_whatsapp",
        "type": "whatsapp",
        "title": "واتساب إدارة وحجوزات برستيج",
        "value": "+966501234567",
        "isActive": true,
        "order": 0
      },
      {
        "id": "ch_phone",
        "type": "phone",
        "title": "رقم الهاتف المباشر",
        "value": "+966501234567",
        "isActive": true,
        "order": 1
      },
      {
        "id": "ch_email",
        "type": "email",
        "title": "البريد الإلكتروني الرسمي",
        "value": "info@prestigehotels.sa",
        "isActive": true,
        "order": 2
      }
    ],
    "branches": [
      {
        "id": "branch_makkah",
        "name": "فرع مكة المكرمة (المقر الرئيسي)",
        "city": "مكة المكرمة",
        "address": "أبراج وقف الملك عبدالعزيز (الصفوة)، شارع أجياد، المنطقة المركزية، مكة المكرمة",
        "mapUrl": "https://maps.google.com/?q=King+Abdulaziz+Endowment+Towers+Makkah",
        "phone": "+966501234567",
        "whatsapp": "+966501234567",
        "workingHours": "على مدار الساعة 24/7",
        "isMainBranch": true,
        "isActive": true,
        "order": 1
      },
      {
        "id": "branch_madinah",
        "name": "فرع المدينة المنورة",
        "city": "المدينة المنورة",
        "address": "المنطقة المركزية الشمالية، أمام بوابة الملك فهد، طريق الملك فهد، المدينة المنورة",
        "mapUrl": "https://maps.google.com/?q=Northern+Central+Area+Madinah",
        "phone": "+966501234568",
        "whatsapp": "+966501234568",
        "workingHours": "على مدار الساعة 24/7",
        "isMainBranch": false,
        "isActive": true,
        "order": 2
      }
    ],
    "departmentContacts": [
      {
        "id": "dept_sales",
        "department": "إدارة المبيعات والشركات",
        "name": "فريق المبيعات والتعاقدات",
        "roleTitle": "مسؤول مبيعات الشركات وحجوزات المجموعات",
        "phone": "+966501234567",
        "whatsapp": "+966501234567",
        "workingHours": "متاح 24/7 طوال أيام الأسبوع",
        "isActive": true,
        "order": 1
      },
      {
        "id": "dept_bookings",
        "department": "قسم الحجوزات والتسكين",
        "name": "استشاري التسكين المباشر",
        "roleTitle": "مسؤول تأكيد الغرف والأجنحة الفندقية",
        "phone": "+966501234568",
        "whatsapp": "+966501234568",
        "workingHours": "على مدار الساعة 24/7",
        "isActive": true,
        "order": 2
      },
      {
        "id": "dept_accounts",
        "department": "قسم الحسابات والمالية",
        "name": "الإدارة المالية والمدفوعات",
        "roleTitle": "المسؤول المالي والفواتير والتحويلات",
        "phone": "+966501234569",
        "whatsapp": "+966501234569",
        "workingHours": "9:00 ص - 6:00 م",
        "isActive": true,
        "order": 3
      }
    ],
    "quickLinks": [
      { "id": "link_home", "title": "الرئيسية", "targetPage": "home", "isActive": true, "order": 1 },
      { "id": "link_hotels", "title": "فنادقنا المُدارة", "targetPage": "hotels", "isActive": true, "order": 2 },
      { "id": "link_packages", "title": "باقات الحج والعمرة", "targetPage": "packages", "isActive": true, "order": 3 },
      { "id": "link_offers", "title": "العروض والمناسبات", "targetPage": "offers", "isActive": true, "order": 4 },
      { "id": "link_about", "title": "من نحن", "targetPage": "about", "isActive": true, "order": 5 },
      { "id": "link_contact", "title": "تواصل معنا", "targetPage": "contact", "isActive": true, "order": 6 }
    ],
    "aboutUs": {
      "title": "عن شركة برستيج لإدارة وتشغيل الفنادق",
      "subtitle": "مسيرة ريادة واحترافية في إدارة وتشغيل الفنادق والضيافة الفاخرة لضيوف الرحمن وزوار مكة المكرمة والمدينة المنورة.",
      "badge": "شرف خدمة ضيوف الرحمن",
      "missionTitle": "رسالتنا: التميز في إدارة وتشغيل الفنادق وخدمة الضيوف",
      "missionText1": "تأسست شركة برستيج لإدارة وتشغيل الفنادق انطلاقاً من رؤية متكاملة لرفع كفاءة تشغيل الأصول الفندقية وتقديم أرقى حلول الضيافة والتسكين لضيوف الرحمن وشركات السياحة في المدينتين المقدستين.",
      "missionText2": "بفضل خبراتنا الإدارية وكوادرنا التشغيلية المتخصصة في كبرى فنادق مكة المكرمة والمدينة المنورة، نضمن للمستثمرين والنزلاء أعلى معايير الجودة الفندقية وسرعة إجراءات التسكين.",
      "visionTitle": "رؤيتنا: الريادة في إدارة وتشغيل الفنادق والضيافة الروحانية",
      "visionText": "أن نكون الخيار الأول والأكثر ثقة للمستثمرين وضيوف الرحمن ووكالات العمرة عالمياً من خلال تقديم أرقى معايير الإدارة والتشغيل الفندقي.",
      "yearsExperience": "١٥+ عاماً",
      "servedGuests": "١٢٠,٠٠٠+",
      "officeTitle": "المقر الرئيسي لشركة برستيج لإدارة وتشغيل الفنادق",
      "officeCity": "مكة المكرمة",
      "officeAddress": "أبراج وقف الملك عبدالعزيز - مجمع أبراج البيت، طريق أجياد، مكة المكرمة",
      "officeMapUrl": "https://maps.google.com/?q=King+Abdulaziz+Endowment+Towers+Makkah",
      "officePhone": "+966501234567",
      "officeWhatsApp": "+966501234567",
      "officeEmail": "info@prestigehotels.sa",
      "officeWorkingHours": "على مدار الساعة 24/7 لخدمة ضيوف الرحمن",
      "licenseNumber": "73104928",
      "licenseAuthority": "مرخصون من وزارة الحج والعمرة والهيئة السعودية للسياحة",
      "showLicense": true,
      "photos": [],
      "mainPhoto": ""
    }
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------------------------
-- 9. LIVE CONTENT TABLE (تعديلات النصوص والواجهة الفورية)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content (
    key TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    color TEXT,
    font_size TEXT,
    font_weight TEXT,
    updated_at BIGINT,
    updated_by TEXT
);


-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- سياسات الأمان للقراءة العامة وتعديلات لوحة التحكم المباشرة
-- ------------------------------------------------------------------------------
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- 1. السماح بالقراءة العامة
CREATE POLICY "Public Read Districts" ON public.districts FOR SELECT USING (true);
CREATE POLICY "Public Read Admin Users" ON public.admin_users FOR SELECT USING (true);
CREATE POLICY "Public Read Hotels" ON public.hotels FOR SELECT USING (true);
CREATE POLICY "Public Read Offers" ON public.offers FOR SELECT USING (true);
CREATE POLICY "Public Read Reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public Read Settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Content" ON public.content FOR SELECT USING (true);

-- 2. السماح للزوار بإرسال الرسائل والتقييمات
CREATE POLICY "Public Insert Messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Reviews" ON public.reviews FOR INSERT WITH CHECK (true);

-- 3. السماح بكافة عمليات الإدارة والتحكم
CREATE POLICY "Anon Full Access Districts" ON public.districts FOR ALL USING (true);
CREATE POLICY "Anon Full Access Hotels" ON public.hotels FOR ALL USING (true);
CREATE POLICY "Anon Full Access Offers" ON public.offers FOR ALL USING (true);
CREATE POLICY "Anon Full Access Reviews" ON public.reviews FOR ALL USING (true);
CREATE POLICY "Anon Full Access Messages" ON public.messages FOR ALL USING (true);
CREATE POLICY "Anon Full Access Settings" ON public.site_settings FOR ALL USING (true);
CREATE POLICY "Anon Full Access Admin Users" ON public.admin_users FOR ALL USING (true);
CREATE POLICY "Anon Full Access Content" ON public.content FOR ALL USING (true);


-- ------------------------------------------------------------------------------
-- 11. REALTIME REPLICATION (تمكين التحديث الحي اللحظي الفوري لجميع الجداول)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY['districts', 'admin_users', 'hotels', 'offers', 'reviews', 'messages', 'site_settings', 'content'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = tbl
    ) THEN
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;
  END LOOP;
END $$;
