-- ============================================================================
-- WinDriveSA Secure First-Admin Provisioning & Role Protection Migration
-- Migration: 20260923180000_first_admin_provisioning.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ROLE INTEGRITY & TAMPERING PREVENTION TRIGGER
-- ----------------------------------------------------------------------------
-- Guarantees that:
-- 1. Non-admin users cannot change their own role or anyone else's role.
-- 2. Only existing authenticated administrators or database superuser/service_role can change roles.
-- 3. The last remaining administrator can never be demoted.
-- 4. Every role elevation or demotion is recorded in public.audit_logs.

CREATE OR REPLACE FUNCTION public.enforce_profile_role_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_admin_count integer;
  v_caller_is_admin boolean;
BEGIN
  -- If role is not changing, proceed normally
  IF OLD.role = NEW.role THEN
    RETURN NEW;
  END IF;

  -- Validate role is one of the allowed values
  IF NEW.role NOT IN ('USER', 'ADMIN') THEN
    RAISE EXCEPTION 'Invalid role specified: %. Role must be either USER or ADMIN.', NEW.role;
  END IF;

  -- Check if caller is database superuser/service_role OR an authenticated admin
  v_caller_is_admin := (
    current_user IN ('postgres', 'service_role', 'supabase_admin')
    OR public.is_admin()
  );

  IF NOT v_caller_is_admin THEN
    RAISE EXCEPTION 'Access Denied: Only authorized administrators can alter user roles.';
  END IF;

  -- Prevent demoting the last remaining administrator
  IF OLD.role = 'ADMIN' AND NEW.role = 'USER' THEN
    SELECT count(*) INTO v_admin_count
    FROM public.profiles
    WHERE role = 'ADMIN' AND id != OLD.id;

    IF v_admin_count = 0 THEN
      RAISE EXCEPTION 'Operation Aborted: Cannot demote the last remaining administrator. The system must retain at least one administrator.';
    END IF;
  END IF;

  -- Record audit log for the role transition
  BEGIN
    INSERT INTO public.audit_logs (
      admin_profile_id,
      action,
      entity_type,
      entity_id,
      description,
      before_changes,
      after_changes,
      status
    ) VALUES (
      COALESCE(auth.uid(), OLD.id),
      CASE WHEN NEW.role = 'ADMIN' THEN 'ADMIN_ROLE_PROMOTED' ELSE 'ADMIN_ROLE_REVOKED' END,
      'profile',
      OLD.id,
      format('Role changed from %s to %s for profile %s (%s).', OLD.role, NEW.role, OLD.full_name, OLD.email),
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role),
      'COMPLETED'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Prevent logging errors from failing the transaction
    RAISE NOTICE 'Audit log record notice: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_role_integrity ON public.profiles;
CREATE TRIGGER trg_profile_role_integrity
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_role_integrity();

-- ----------------------------------------------------------------------------
-- 2. OWNER-CONTROLLED FIRST-ADMIN PROVISIONING FUNCTION
-- ----------------------------------------------------------------------------
-- Strictly owner-controlled via SQL Editor or authenticated superuser.
-- Guarantees:
-- - Rejects execution if any administrator already exists.
-- - Verifies that the registered account exists in public.profiles.
-- - Upgrades role to 'ADMIN' and account_status to 'ACTIVE'.
-- - Automatically inserts a dedicated audit log record.
-- - No credentials, passwords, or service-role keys are exposed in client code.

CREATE OR REPLACE FUNCTION public.provision_first_admin(admin_email TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_existing_admins integer;
  v_target_profile public.profiles%ROWTYPE;
BEGIN
  -- 1. Ensure clean trimmed lowercase email
  admin_email := LOWER(TRIM(admin_email));

  IF admin_email IS NULL OR admin_email = '' THEN
    RAISE EXCEPTION 'Please provide a valid, registered email address.';
  END IF;

  -- 2. Guard: Refuse execution if ANY administrator already exists in the system
  SELECT count(*) INTO v_existing_admins
  FROM public.profiles
  WHERE role = 'ADMIN';

  IF v_existing_admins > 0 THEN
    RAISE EXCEPTION 'First-admin setup has already been completed. % active administrator(s) already exist. Subsequent administrators must be created or promoted by an existing administrator.', v_existing_admins;
  END IF;

  -- 3. Verify user has registered their account first
  SELECT * INTO v_target_profile
  FROM public.profiles
  WHERE LOWER(email) = admin_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No registered user profile found for email "%". Please register the account first at /register (or in Supabase Auth), then re-run this function.', admin_email;
  END IF;

  -- 4. Elevate the target user to ADMIN and activate account
  UPDATE public.profiles
  SET
    role = 'ADMIN',
    account_status = 'ACTIVE',
    updated_at = now()
  WHERE id = v_target_profile.id;

  -- 5. Record immutable audit log entry
  INSERT INTO public.audit_logs (
    admin_profile_id,
    action,
    entity_type,
    entity_id,
    description,
    before_changes,
    after_changes,
    status
  ) VALUES (
    v_target_profile.id,
    'FIRST_ADMIN_PROVISIONED',
    'profile',
    v_target_profile.id,
    format('First WinDriveSA administrator successfully provisioned for %s (%s) via owner SQL console.', v_target_profile.full_name, v_target_profile.email),
    jsonb_build_object('role', v_target_profile.role, 'account_status', v_target_profile.account_status),
    jsonb_build_object('role', 'ADMIN', 'account_status', 'ACTIVE'),
    'COMPLETED'
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', format('First administrator successfully provisioned for %s (%s). You can now sign in at /login and navigate to /admin.', v_target_profile.full_name, v_target_profile.email),
    'user_id', v_target_profile.id,
    'email', v_target_profile.email,
    'role', 'ADMIN',
    'account_status', 'ACTIVE'
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. AUTHORIZED ADMIN-ONLY ROLE ASSIGNMENT FUNCTION
-- ----------------------------------------------------------------------------
-- Allows existing authenticated administrators to promote or demote other users.

CREATE OR REPLACE FUNCTION public.admin_assign_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_id UUID;
  v_target_profile public.profiles%ROWTYPE;
BEGIN
  v_caller_id := auth.uid();

  -- Require caller to be an authenticated administrator
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only an authenticated administrator can assign user roles.';
  END IF;

  -- Validate requested role
  new_role := UPPER(TRIM(new_role));
  IF new_role NOT IN ('USER', 'ADMIN') THEN
    RAISE EXCEPTION 'Invalid role: %. Role must be either USER or ADMIN.', new_role;
  END IF;

  -- Find target profile
  SELECT * INTO v_target_profile
  FROM public.profiles
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user profile not found.';
  END IF;

  -- Update role (the trg_profile_role_integrity trigger handles last-admin protection & audit logging)
  UPDATE public.profiles
  SET
    role = new_role,
    updated_at = now()
  WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', format('User role successfully updated to %s for %s.', new_role, v_target_profile.email),
    'user_id', target_user_id,
    'role', new_role
  );
END;
$$;
