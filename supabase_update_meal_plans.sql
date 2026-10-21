-- ==============================================================================
-- PRESTIGE HOTELS - MEAL PLANS DATABASE UPGRADE SCRIPT
-- كود ترقية وتحديث جدول خطط الوجبات الفندقية (meal_plans)
-- ==============================================================================
-- قم بنسخ هذا الكود بالكامل ولصقه في:
-- Supabase Dashboard -> SQL Editor -> New query -> Run
-- ==============================================================================

-- 1. إضافة عمود معرف الفندق (hotel_id) لربط كل خطة وجبة بفندق محدد أو جعلها عامة (NULL)
ALTER TABLE IF EXISTS public.meal_plans 
ADD COLUMN IF NOT EXISTS hotel_id TEXT;

-- 2. إضافة عمود أساس التسعير (لكل فرد في الليلة أو للغرفة كاملة في الليلة)
ALTER TABLE IF EXISTS public.meal_plans 
ADD COLUMN IF NOT EXISTS pricing_basis TEXT DEFAULT 'per_person_per_night';

-- 3. إضافة عمود السعر العام (price) كمرادف متوافق
ALTER TABLE IF EXISTS public.meal_plans 
ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0.00;

-- 4. إضافة عمود تاريخ آخر تحديث
ALTER TABLE IF EXISTS public.meal_plans 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5. إنشاء فهرس سريع للبحث الفوري عن وجبات الفندق
CREATE INDEX IF NOT EXISTS idx_meal_plans_hotel_id ON public.meal_plans(hotel_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_type ON public.meal_plans(type);
CREATE INDEX IF NOT EXISTS idx_meal_plans_active ON public.meal_plans(is_active);

-- 6. التأكد من تمكين وتحديث سياسات الأمان (RLS) للقراءة والتعديل من لوحة التحكم
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Meal Plans" ON public.meal_plans;
CREATE POLICY "Public Read Meal Plans" ON public.meal_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon Full Access Meal Plans" ON public.meal_plans;
CREATE POLICY "Anon Full Access Meal Plans" ON public.meal_plans FOR ALL USING (true);

-- 7. تحديث ونشر تغييرات الـ Realtime لتحديث واجهات النزلاء ولوحة التحكم لحظياً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'meal_plans'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_plans;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- 8. تنظيف أي خطط غير صحيحة وإعادة إدراج الخطط القياسية العامة
INSERT INTO public.meal_plans (id, type, name, name_en, price_per_person_per_night, pricing_basis, description, is_active)
VALUES
  ('room_only', 'room_only', 'إقامة فقط (بدون وجبات)', 'Room Only (No Meals)', 0.00, 'per_person_per_night', 'إقامة مريحة في الغرفة مع حرية اختيار وجباتك خارج الفندق', true),
  ('meal_none', 'room_only', 'بدون وجبات (إقامة فقط)', 'Room Only', 0.00, 'per_person_per_night', 'إقامة مريحة في الغرفة مع حرية اختيار وجباتك خارج الفندق', true),
  ('meal_breakfast', 'breakfast', 'شامل بوفيه إفطار فاخر', 'Bed & Breakfast Buffet', 45.00, 'per_person_per_night', 'بوفيه إفطار يومي متنوع يضم تشكيلة شرقية وغربية طازجة', true),
  ('meal_half_board', 'half_board', 'نصف إقامة (إفطار + عشاء)', 'Half Board (Breakfast & Dinner)', 95.00, 'per_person_per_night', 'بوفيه إفطار صباحي مفتوح + وجبة عشاء فاخرة يومياً', true),
  ('meal_full_board', 'full_board', 'إقامة كاملة (إفطار + غداء + عشاء)', 'Full Board (All 3 Meals)', 140.00, 'per_person_per_night', 'تجربة ضيافة ملكية متكاملة تشمل الإفطار والغداء والعشاء يومياً', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  price_per_person_per_night = EXCLUDED.price_per_person_per_night,
  pricing_basis = EXCLUDED.pricing_basis,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- تأكيد النجاح
SELECT 'تم تحديث وترقية جدول meal_plans بنجاح وتمكين دعم hotel_id و pricing_basis ✓' AS result;
