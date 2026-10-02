-- ==============================================================================
-- Prestige Hotels Management - Booking System Enhancements & Schema Extension
-- شركة برستيج لإدارة وتشغيل الفنادق - سكريبت تحديث وإضافة جداول منظومة الحجز والغرف والباقات
-- ملحق مستقل مكمل لـ (supabase_master_setup.sql) بدون أي تعارض أو أخطاء
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. ONLINE BOOKING ENABLED COLUMN (إتاحة الحجز أونلاين لكل فندق)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.hotels
ADD COLUMN IF NOT EXISTS online_booking_enabled BOOLEAN DEFAULT true;

-- ------------------------------------------------------------------------------
-- 1. HOTEL BOOKING POLICY COLUMN (تحديث جدول الفنادق بسياسات الحجز والضرائب والشارات)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.hotels 
ADD COLUMN IF NOT EXISTS booking_policy JSONB DEFAULT '{
  "checkInTime": "16:00 عصراً (Check-in)",
  "checkOutTime": "12:00 ظهراً (Check-out)",
  "cancellationType": "free_flexible",
  "cancellationNoticeDays": 2,
  "childrenPolicyText": "إقامة مجانية لطفل واحد دون سن 6 سنوات مشاركاً للأسرة المتوفرة.",
  "extraBedPrice": 120,
  "petsAllowed": false,
  "smokingAllowed": false,
  "paymentTerms": "الدفع عند الوصول في مكتب الاستقبال بالفندق (نقداً أو مدى أو فيزا / ماستركارد)، لا يشترط دفع مسبق.",
  "termsAndConditionsList": [
    "يلزم تقديم أصل بطاقة الهوية الوطنية أو الإقامة أو جواز السفر لجميع النزلاء المقيمين عند تسجيل الوصول.",
    "إلغاء مجاني ومرن متاح بالكامل حتى 48 ساعة قبل موعد تسجيل الوصول المحدد.",
    "تطبق لائحة وزارة السياحة والضيافة في المملكة العربية السعودية على جميع الحجوزات والتعاملات."
  ],
  "showFreeCancellationBadge": true,
  "showPayAtHotelBadge": true,
  "showInstantConfirmBadge": true,
  "showMealInclusionBadge": true,
  "priceIncludesTax": true,
  "taxPercentage": 15
}'::jsonb;


-- ------------------------------------------------------------------------------
-- 2. ROOM TYPES TABLE (جدول أنواع الغرف والأسعار والمواسم وسياسة الضريبة)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.room_types (
    id TEXT PRIMARY KEY,
    hotel_id TEXT NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_en TEXT,
    category TEXT DEFAULT 'غرفة فاخرة',
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 350.00,
    total_rooms INTEGER DEFAULT 5,
    available_rooms INTEGER DEFAULT 5,
    max_guests INTEGER DEFAULT 2,
    bed_type TEXT DEFAULT 'سرير كينج مزدوج',
    room_size TEXT DEFAULT '32 م²',
    features JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    key_prefix TEXT DEFAULT 'KEY',
    status TEXT DEFAULT 'available', -- 'available', 'booked', 'maintenance'
    season_periods JSONB DEFAULT '[]'::jsonb,
    packages JSONB DEFAULT '[]'::jsonb,
    services JSONB DEFAULT '[]'::jsonb,
    meal_options JSONB DEFAULT '[]'::jsonb,
    show_free_cancellation BOOLEAN DEFAULT true,
    show_pay_at_hotel BOOLEAN DEFAULT true,
    price_includes_tax BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    order_num INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ------------------------------------------------------------------------------
-- 3. MEAL PLANS TABLE (جدول خطط الوجبات الفندقية: إفطار، نصف إقامة، إقامة كاملة)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meal_plans (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'none', 'breakfast', 'half_board', 'full_board'
    name TEXT NOT NULL,
    name_en TEXT,
    price_per_person_per_night NUMERIC(10, 2) DEFAULT 0.00,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إدراج خطط الوجبات الأساسية المعتمدة
INSERT INTO public.meal_plans (id, type, name, name_en, price_per_person_per_night, description, is_active)
VALUES
  ('meal_none', 'none', 'بدون وجبات (إقامة فقط)', 'Room Only', 0.00, 'إقامة مريحة في الغرفة مع حرية اختيار وجباتك خارج الفندق', true),
  ('meal_breakfast', 'breakfast', 'شامل بوفيه إفطار فاخر', 'Bed & Breakfast', 45.00, 'بوفيه إفطار يومي متنوع يضم تشكيلة شرقية وغربية طازجة', true),
  ('meal_half_board', 'half_board', 'نصف إقامة (إفطار + عشاء)', 'Half Board', 95.00, 'بوفيه إفطار صباحي مفتوح + وجبة عشاء فاخرة يومياً', true),
  ('meal_full_board', 'full_board', 'إقامة كاملة (إفطار + غداء + عشاء)', 'Full Board', 140.00, 'تجربة ضيافة ملكية متكاملة تشمل الإفطار والغداء والعشاء يومياً', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_per_person_per_night = EXCLUDED.price_per_person_per_night,
  description = EXCLUDED.description;


-- ------------------------------------------------------------------------------
-- 4. ROOM PACKAGES TABLE (جدول باقات الغرف والعروض الخاصة بفترات محددة)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.room_packages (
    id TEXT PRIMARY KEY,
    hotel_id TEXT NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL,
    room_name TEXT NOT NULL,
    name TEXT NOT NULL,
    name_en TEXT,
    meal_plan_id TEXT DEFAULT 'meal_breakfast',
    meal_plan_name TEXT DEFAULT 'شامل بوفيه إفطار فاخر',
    nights INTEGER NOT NULL DEFAULT 3,
    total_price NUMERIC(10, 2) NOT NULL,
    price_per_night NUMERIC(10, 2),
    start_date DATE,
    end_date DATE,
    price_includes_tax BOOLEAN DEFAULT true,
    badge_text TEXT DEFAULT 'عرض خاص',
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ------------------------------------------------------------------------------
-- 5. ROOM BOOKINGS TABLE (جدول الحجوزات، رقم التأكيد، والمفتاح الرقمي المعتمد)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.room_bookings (
    id TEXT PRIMARY KEY,
    booking_code TEXT NOT NULL, -- رقم طلب الحجز مثل PRS-4892 (يستلم به العميل طلبه)
    digital_key TEXT,           -- رقم تأكيد الحجز / المفتاح الرقمي (يحدده ويعتمده المشرف حصراً)
    confirmation_code TEXT,     -- كود التأكيد المسجل
    hotel_id TEXT NOT NULL,
    hotel_name TEXT NOT NULL,
    hotel_city TEXT DEFAULT 'مكة المكرمة',
    room_id TEXT NOT NULL,
    room_name TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    guest_email TEXT,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    nights INTEGER NOT NULL DEFAULT 1,
    rooms_count INTEGER NOT NULL DEFAULT 1,
    adults INTEGER NOT NULL DEFAULT 2,
    children INTEGER NOT NULL DEFAULT 0,
    meal_plan_id TEXT DEFAULT 'meal_none',
    meal_plan_name TEXT DEFAULT 'بدون وجبات',
    meal_plan_price NUMERIC(10, 2) DEFAULT 0.00,
    room_price_per_night NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    special_requests TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'checked_in', 'completed', 'cancelled'
    assigned_room_number TEXT,              -- رقم الغرفة الفعلي (يحدد وقت الوصول والتسكين فقط)
    admin_notes TEXT,                       -- ملاحظات المشرف الإدارية
    booking_data JSONB DEFAULT '{}'::jsonb,  -- كائن تفاصيل الحجز الكامل والمرن
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء فهارس سريعة لسرعة البحث وتتبع الحجوزات برقم الهاتف أو كود الحجز
CREATE INDEX IF NOT EXISTS idx_room_bookings_code ON public.room_bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_room_bookings_phone ON public.room_bookings(guest_phone);
CREATE INDEX IF NOT EXISTS idx_room_bookings_digital_key ON public.room_bookings(digital_key);
CREATE INDEX IF NOT EXISTS idx_room_bookings_hotel ON public.room_bookings(hotel_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_status ON public.room_bookings(status);


-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- سياسات الأمان والحماية للجداول الجديدة
-- ------------------------------------------------------------------------------
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_bookings ENABLE ROW LEVEL SECURITY;

-- 1. السماح بالقراءة العامة لخطط الوجبات والغرف والباقات
DROP POLICY IF EXISTS "Public Read Room Types" ON public.room_types;
CREATE POLICY "Public Read Room Types" ON public.room_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Meal Plans" ON public.meal_plans;
CREATE POLICY "Public Read Meal Plans" ON public.meal_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Room Packages" ON public.room_packages;
CREATE POLICY "Public Read Room Packages" ON public.room_packages FOR SELECT USING (true);

-- 2. السماح للعميل بإجراء طلب حجز جديد وتتبع حجزه
DROP POLICY IF EXISTS "Public Read Room Bookings" ON public.room_bookings;
CREATE POLICY "Public Read Room Bookings" ON public.room_bookings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Room Bookings" ON public.room_bookings;
CREATE POLICY "Public Insert Room Bookings" ON public.room_bookings FOR INSERT WITH CHECK (true);

-- 3. السماح بالإدارة الكاملة (التعديل والحذف والتأكيد)
DROP POLICY IF EXISTS "Anon Full Access Room Types" ON public.room_types;
CREATE POLICY "Anon Full Access Room Types" ON public.room_types FOR ALL USING (true);

DROP POLICY IF EXISTS "Anon Full Access Meal Plans" ON public.meal_plans;
CREATE POLICY "Anon Full Access Meal Plans" ON public.meal_plans FOR ALL USING (true);

DROP POLICY IF EXISTS "Anon Full Access Room Packages" ON public.room_packages;
CREATE POLICY "Anon Full Access Room Packages" ON public.room_packages FOR ALL USING (true);

DROP POLICY IF EXISTS "Anon Full Access Room Bookings" ON public.room_bookings;
CREATE POLICY "Anon Full Access Room Bookings" ON public.room_bookings FOR ALL USING (true);


-- ------------------------------------------------------------------------------
-- 7. REALTIME REPLICATION (تمكين التحديث اللحظي لجميع جداول الحجز)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  tbl text;
  new_tables text[] := ARRAY['room_types', 'meal_plans', 'room_packages', 'room_bookings'];
BEGIN
  FOREACH tbl IN ARRAY new_tables LOOP
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
