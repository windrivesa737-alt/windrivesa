-- ============================================================================
-- WinDriveSA Database Architecture & Row Level Security (RLS)
-- Migration: 20260918120000_windrive_schema_and_rls.sql
-- ============================================================================

-- Ensure pgcrypto / uuid extensions are enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. HELPER FUNCTIONS & TRIGGERS
-- ============================================================================

-- Reusable automatic updated_at timestamp function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile_number TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  account_status TEXT NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (account_status IN ('PENDING_REVIEW', 'APPROVED', 'ACTIVE', 'REJECTED', 'DEACTIVATED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- updated_at trigger for profiles
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 3. SECURE ADMIN & ROLE AUTHORIZATION FUNCTIONS (RECURSION-SAFE)
-- ============================================================================
-- SECURITY DEFINER functions with fixed search_path to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'ADMIN'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN v_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_user_status()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  SELECT account_status INTO v_status
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN v_status;
END;
$$;

-- ============================================================================
-- 4. REWARDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cash_amount NUMERIC(14,2) DEFAULT 250000.00,
  cash_currency TEXT NOT NULL DEFAULT 'ZAR',
  vehicle_make TEXT DEFAULT 'Toyota',
  vehicle_model TEXT DEFAULT 'Hilux',
  vehicle_year INTEGER DEFAULT 2026,
  vehicle_image TEXT,
  reward_status TEXT NOT NULL DEFAULT 'NOT_ASSIGNED' CHECK (reward_status IN ('NOT_ASSIGNED', 'ASSIGNED', 'ACTIVE', 'COMPLETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_rewards_profile UNIQUE (profile_id)
);

-- Indexes for rewards
CREATE INDEX IF NOT EXISTS idx_rewards_profile_id ON public.rewards(profile_id);
CREATE INDEX IF NOT EXISTS idx_rewards_reward_status ON public.rewards(reward_status);

-- updated_at trigger for rewards
DROP TRIGGER IF EXISTS trg_rewards_updated_at ON public.rewards;
CREATE TRIGGER trg_rewards_updated_at
  BEFORE UPDATE ON public.rewards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 5. CLAIMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  claim_type TEXT NOT NULL CHECK (claim_type IN ('CASH', 'VEHICLE')),
  status TEXT NOT NULL DEFAULT 'CLAIM_AVAILABLE' CHECK (
    status IN (
      'CLAIM_AVAILABLE',
      'SUBMITTED',
      'UNDER_REVIEW',
      'APPROVED',
      'REQUIREMENT_PENDING',
      'PROCESSING',
      'FULFILLED',
      'REJECTED',
      'MORE_INFORMATION_REQUIRED'
    )
  ),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  rejection_reason TEXT,
  more_information_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_claims_profile_type UNIQUE (profile_id, claim_type)
);

-- Indexes for claims
CREATE INDEX IF NOT EXISTS idx_claims_profile_id ON public.claims(profile_id);
CREATE INDEX IF NOT EXISTS idx_claims_reward_id ON public.claims(reward_id);
CREATE INDEX IF NOT EXISTS idx_claims_claim_type ON public.claims(claim_type);
CREATE INDEX IF NOT EXISTS idx_claims_status ON public.claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_submitted_at ON public.claims(submitted_at);

-- updated_at trigger for claims
DROP TRIGGER IF EXISTS trg_claims_updated_at ON public.claims;
CREATE TRIGGER trg_claims_updated_at
  BEFORE UPDATE ON public.claims
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 6. CASH CLAIM DETAILS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cash_claim_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID UNIQUE NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('CHEQUE', 'SAVINGS', 'OTHER')),
  branch_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for cash_claim_details
CREATE INDEX IF NOT EXISTS idx_cash_claim_details_claim_id ON public.cash_claim_details(claim_id);

-- updated_at trigger for cash_claim_details
DROP TRIGGER IF EXISTS trg_cash_claim_details_updated_at ON public.cash_claim_details;
CREATE TRIGGER trg_cash_claim_details_updated_at
  BEFORE UPDATE ON public.cash_claim_details
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 7. VEHICLE CLAIM DETAILS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vehicle_claim_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID UNIQUE NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  preferred_delivery_date DATE,
  contact_number TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for vehicle_claim_details
CREATE INDEX IF NOT EXISTS idx_vehicle_claim_details_claim_id ON public.vehicle_claim_details(claim_id);

-- updated_at trigger for vehicle_claim_details
DROP TRIGGER IF EXISTS trg_vehicle_claim_details_updated_at ON public.vehicle_claim_details;
CREATE TRIGGER trg_vehicle_claim_details_updated_at
  BEFORE UPDATE ON public.vehicle_claim_details
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 8. CLAIM REQUIREMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.claim_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_type TEXT UNIQUE NOT NULL CHECK (claim_type IN ('CASH', 'VEHICLE')),
  title TEXT NOT NULL,
  applicable_charge NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ENABLED' CHECK (status IN ('ENABLED', 'DISABLED')),
  support_whatsapp TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at trigger for claim_requirements
DROP TRIGGER IF EXISTS trg_claim_requirements_updated_at ON public.claim_requirements;
CREATE TRIGGER trg_claim_requirements_updated_at
  BEFORE UPDATE ON public.claim_requirements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed Default Claim Requirements: 0.00 charges, no fake WhatsApp number
INSERT INTO public.claim_requirements (
  claim_type,
  title,
  applicable_charge,
  currency,
  description,
  status,
  support_whatsapp
)
VALUES
  (
    'CASH',
    'Cash Prize Requirements',
    0.00,
    'ZAR',
    'Standard processing requirements for cash prize claims.',
    'ENABLED',
    NULL
  ),
  (
    'VEHICLE',
    'Vehicle Prize Requirements',
    0.00,
    'ZAR',
    'Standard processing requirements for vehicle prize claims.',
    'ENABLED',
    NULL
  )
ON CONFLICT (claim_type) DO UPDATE
SET
  title = EXCLUDED.title,
  applicable_charge = 0.00,
  currency = 'ZAR',
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  support_whatsapp = NULL;

-- ============================================================================
-- 9. SUPPORT SYSTEM TABLES
-- ============================================================================

-- Support Requests
CREATE TABLE IF NOT EXISTS public.support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN ('ACCOUNT', 'CLAIM', 'REWARD', 'PAYMENT', 'VERIFICATION', 'GENERAL')
  ),
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (
    status IN ('NEW', 'OPEN', 'PENDING_ADMIN', 'PENDING_USER', 'RESOLVED', 'CLOSED')
  ),
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (
    priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')
  ),
  assigned_admin_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_message_preview TEXT,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for support_requests
CREATE INDEX IF NOT EXISTS idx_support_requests_profile_id ON public.support_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON public.support_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_requests_category ON public.support_requests(category);
CREATE INDEX IF NOT EXISTS idx_support_requests_priority ON public.support_requests(priority);
CREATE INDEX IF NOT EXISTS idx_support_requests_last_activity ON public.support_requests(last_activity_at DESC);

-- updated_at trigger for support_requests
DROP TRIGGER IF EXISTS trg_support_requests_updated_at ON public.support_requests;
CREATE TRIGGER trg_support_requests_updated_at
  BEFORE UPDATE ON public.support_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Support Messages
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_request_id UUID NOT NULL REFERENCES public.support_requests(id) ON DELETE CASCADE,
  sender_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('USER', 'ADMIN', 'SYSTEM')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for support_messages
CREATE INDEX IF NOT EXISTS idx_support_messages_request_id ON public.support_messages(support_request_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON public.support_messages(created_at ASC);

-- Support Internal Notes (Admin-only confidential audit notes)
CREATE TABLE IF NOT EXISTS public.support_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_request_id UUID NOT NULL REFERENCES public.support_requests(id) ON DELETE CASCADE,
  admin_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for support_internal_notes
CREATE INDEX IF NOT EXISTS idx_support_internal_notes_request ON public.support_internal_notes(support_request_id);

-- ============================================================================
-- 10. AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  description TEXT NOT NULL,
  before_changes JSONB,
  after_changes JSONB,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_profile_id ON public.audit_logs(admin_profile_id);

-- ============================================================================
-- 11. APP SETTINGS TABLE (Singleton)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  company_name TEXT NOT NULL DEFAULT 'WinDriveSA',
  tagline TEXT NOT NULL DEFAULT 'Win Big. Drive Away.',
  currency TEXT NOT NULL DEFAULT 'ZAR',
  default_currency TEXT NOT NULL DEFAULT 'ZAR',
  whatsapp_support_number TEXT DEFAULT NULL,
  support_whatsapp TEXT DEFAULT NULL,
  support_email TEXT NOT NULL DEFAULT 'support@windrivesa.co.za',
  support_hours TEXT NOT NULL DEFAULT 'Mon - Fri, 08:00 - 17:00 SAST',
  support_availability TEXT NOT NULL DEFAULT 'Mon - Fri, 08:00 - 17:00 SAST',
  session_timeout_minutes INTEGER NOT NULL DEFAULT 60,
  require_action_confirmation BOOLEAN NOT NULL DEFAULT true,
  sensitive_action_confirmation BOOLEAN NOT NULL DEFAULT true,
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  theme_preference TEXT NOT NULL DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark', 'system')),
  date_format TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
  timezone TEXT NOT NULL DEFAULT 'Africa/Johannesburg',
  language TEXT NOT NULL DEFAULT 'English',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at trigger for app_settings
DROP TRIGGER IF EXISTS trg_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER trg_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed Default Singleton App Settings (Light theme, no fake WhatsApp number)
INSERT INTO public.app_settings (
  id,
  company_name,
  tagline,
  currency,
  default_currency,
  whatsapp_support_number,
  support_whatsapp,
  support_email,
  support_hours,
  support_availability,
  session_timeout_minutes,
  require_action_confirmation,
  sensitive_action_confirmation,
  theme,
  theme_preference,
  date_format,
  timezone,
  language
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'WinDriveSA',
  'Win Big. Drive Away.',
  'ZAR',
  'ZAR',
  NULL,
  NULL,
  'support@windrivesa.co.za',
  'Mon - Fri, 08:00 - 17:00 SAST',
  'Mon - Fri, 08:00 - 17:00 SAST',
  60,
  true,
  true,
  'light',
  'light',
  'YYYY-MM-DD',
  'Africa/Johannesburg',
  'English'
)
ON CONFLICT (id) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  tagline = EXCLUDED.tagline,
  currency = EXCLUDED.currency,
  default_currency = EXCLUDED.default_currency,
  whatsapp_support_number = NULL,
  support_whatsapp = NULL,
  support_email = EXCLUDED.support_email,
  support_hours = EXCLUDED.support_hours,
  support_availability = EXCLUDED.support_availability,
  theme = 'light',
  theme_preference = 'light';

-- ============================================================================
-- 12. AUTH SIGNUP TRIGGER: auth.users -> public.profiles
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    mobile_number,
    role,
    account_status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'mobile_number', NEW.raw_user_meta_data->>'mobileNumber', NEW.raw_user_meta_data->>'mobile', NULL),
    'USER',
    'PENDING_REVIEW'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = CASE WHEN public.profiles.full_name = '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 13. ROW LEVEL SECURITY (RLS) ACTIVATION
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_claim_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_claim_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PROFILES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id
    OR public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
    OR (
      auth.uid() = id
      -- Normal users cannot elevate their role or approve their account
      AND role = public.get_auth_user_role()
      AND account_status = public.get_auth_user_status()
    )
  );

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT
  WITH CHECK (
    (auth.uid() = id AND role = 'USER')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- REWARDS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "rewards_select_policy" ON public.rewards;
CREATE POLICY "rewards_select_policy" ON public.rewards
  FOR SELECT
  USING (
    (profile_id = auth.uid() AND reward_status IN ('ASSIGNED', 'ACTIVE', 'COMPLETED'))
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "rewards_admin_mutation" ON public.rewards;
CREATE POLICY "rewards_admin_mutation" ON public.rewards
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- CLAIMS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "claims_select_policy" ON public.claims;
CREATE POLICY "claims_select_policy" ON public.claims
  FOR SELECT
  USING (
    profile_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "claims_insert_user_policy" ON public.claims;
CREATE POLICY "claims_insert_user_policy" ON public.claims
  FOR INSERT
  WITH CHECK (
    (
      profile_id = auth.uid()
      AND status IN ('CLAIM_AVAILABLE', 'SUBMITTED')
      -- User must own the referenced reward
      AND EXISTS (
        SELECT 1 FROM public.rewards r
        WHERE r.id = reward_id
          AND r.profile_id = auth.uid()
      )
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "claims_update_policy" ON public.claims;
CREATE POLICY "claims_update_policy" ON public.claims
  FOR UPDATE
  USING (
    profile_id = auth.uid()
    OR public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
    OR (
      profile_id = auth.uid()
      AND status IN ('CLAIM_AVAILABLE', 'SUBMITTED')
    )
  );

DROP POLICY IF EXISTS "claims_delete_policy" ON public.claims;
CREATE POLICY "claims_delete_policy" ON public.claims
  FOR DELETE
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- CASH CLAIM DETAILS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "cash_claim_details_select_policy" ON public.cash_claim_details;
CREATE POLICY "cash_claim_details_select_policy" ON public.cash_claim_details
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.claims c
      WHERE c.id = claim_id
        AND (c.profile_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "cash_claim_details_insert_policy" ON public.cash_claim_details;
CREATE POLICY "cash_claim_details_insert_policy" ON public.cash_claim_details
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.claims c
      WHERE c.id = claim_id
        AND (c.profile_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "cash_claim_details_update_policy" ON public.cash_claim_details;
CREATE POLICY "cash_claim_details_update_policy" ON public.cash_claim_details
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.claims c
      WHERE c.id = claim_id
        AND (c.profile_id = auth.uid() OR public.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.claims c
      WHERE c.id = claim_id
        AND (c.profile_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "cash_claim_details_delete_policy" ON public.cash_claim_details;
CREATE POLICY "cash_claim_details_delete_policy" ON public.cash_claim_details
  FOR DELETE
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- VEHICLE CLAIM DETAILS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "vehicle_claim_details_select_policy" ON public.vehicle_claim_details;
CREATE POLICY "vehicle_claim_details_select_policy" ON public.vehicle_claim_details
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.claims c
      WHERE c.id = claim_id
        AND (c.profile_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "vehicle_claim_details_insert_policy" ON public.vehicle_claim_details;
CREATE POLICY "vehicle_claim_details_insert_policy" ON public.vehicle_claim_details
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.claims c
      WHERE c.id = claim_id
        AND (c.profile_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "vehicle_claim_details_update_policy" ON public.vehicle_claim_details;
CREATE POLICY "vehicle_claim_details_update_policy" ON public.vehicle_claim_details
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.claims c
      WHERE c.id = claim_id
        AND (c.profile_id = auth.uid() OR public.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.claims c
      WHERE c.id = claim_id
        AND (c.profile_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "vehicle_claim_details_delete_policy" ON public.vehicle_claim_details;
CREATE POLICY "vehicle_claim_details_delete_policy" ON public.vehicle_claim_details
  FOR DELETE
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- CLAIM REQUIREMENTS POLICIES
-- ----------------------------------------------------------------------------
-- Readable by authenticated users
DROP POLICY IF EXISTS "claim_requirements_select_policy" ON public.claim_requirements;
CREATE POLICY "claim_requirements_select_policy" ON public.claim_requirements
  FOR SELECT
  TO authenticated
  USING (true);

-- Mutations restricted strictly to administrators
DROP POLICY IF EXISTS "claim_requirements_admin_mutation" ON public.claim_requirements;
CREATE POLICY "claim_requirements_admin_mutation" ON public.claim_requirements
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- SUPPORT REQUESTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "support_requests_select_policy" ON public.support_requests;
CREATE POLICY "support_requests_select_policy" ON public.support_requests
  FOR SELECT
  USING (
    profile_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "support_requests_insert_policy" ON public.support_requests;
CREATE POLICY "support_requests_insert_policy" ON public.support_requests
  FOR INSERT
  WITH CHECK (
    (profile_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "support_requests_update_policy" ON public.support_requests;
CREATE POLICY "support_requests_update_policy" ON public.support_requests
  FOR UPDATE
  USING (
    profile_id = auth.uid()
    OR public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
    OR (
      profile_id = auth.uid()
      AND status IN ('OPEN', 'CLOSED')
    )
  );

DROP POLICY IF EXISTS "support_requests_delete_policy" ON public.support_requests;
CREATE POLICY "support_requests_delete_policy" ON public.support_requests
  FOR DELETE
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- SUPPORT MESSAGES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "support_messages_select_policy" ON public.support_messages;
CREATE POLICY "support_messages_select_policy" ON public.support_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_requests r
      WHERE r.id = support_request_id
        AND (r.profile_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "support_messages_insert_policy" ON public.support_messages;
CREATE POLICY "support_messages_insert_policy" ON public.support_messages
  FOR INSERT
  WITH CHECK (
    (sender_profile_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.support_requests r
      WHERE r.id = support_request_id
        AND (r.profile_id = auth.uid() OR public.is_admin())
    )
  );

-- ----------------------------------------------------------------------------
-- SUPPORT INTERNAL NOTES POLICIES (Strictly Admin-Only)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "support_internal_notes_admin_all" ON public.support_internal_notes;
CREATE POLICY "support_internal_notes_admin_all" ON public.support_internal_notes
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- AUDIT LOGS POLICIES (Append-Only & Admin-Only Read)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
  FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
  FOR INSERT
  WITH CHECK (
    -- Any authenticated action or admin can append audit records
    auth.role() = 'authenticated'
    OR public.is_admin()
  );

-- Immutability: Block update/delete on audit logs for all users
DROP POLICY IF EXISTS "audit_logs_deny_update" ON public.audit_logs;
CREATE POLICY "audit_logs_deny_update" ON public.audit_logs
  FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS "audit_logs_deny_delete" ON public.audit_logs;
CREATE POLICY "audit_logs_deny_delete" ON public.audit_logs
  FOR DELETE
  USING (false);

-- ----------------------------------------------------------------------------
-- APP SETTINGS POLICIES (Singleton)
-- ----------------------------------------------------------------------------
-- Settings readable by all authenticated participants
DROP POLICY IF EXISTS "app_settings_select_policy" ON public.app_settings;
CREATE POLICY "app_settings_select_policy" ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Settings mutable strictly by administrators
DROP POLICY IF EXISTS "app_settings_admin_mutation" ON public.app_settings;
CREATE POLICY "app_settings_admin_mutation" ON public.app_settings
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
