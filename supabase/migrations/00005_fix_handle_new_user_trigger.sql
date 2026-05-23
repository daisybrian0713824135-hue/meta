-- Fix handle_new_user trigger:
-- 1. Read phone from raw_user_meta_data (not NEW.phone which is always NULL)
-- 2. Sanitize empty referral_code to NULL
-- 3. Handle username conflicts with random suffix
-- 4. Wrap in EXCEPTION block so signup never fails due to profile creation errors

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_username text;
  v_referral_code text;
  v_referrer_id uuid;
  v_phone text;
  v_email text;
  v_full_name text;
  v_ref_input text;
BEGIN
  -- Extract fields from metadata
  v_username := lower(COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'username'), ''),
    split_part(NEW.email, '@', 1)
  ));

  v_phone := NULLIF(trim(COALESCE(
    NEW.raw_user_meta_data->>'phone',
    NEW.phone
  )), '');

  v_email := CASE
    WHEN NEW.email LIKE '%@miaoda.com' THEN NULLIF(trim(NEW.raw_user_meta_data->>'actual_email'), '')
    ELSE NULLIF(trim(NEW.email), '')
  END;

  v_full_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    v_username
  );

  -- Generate unique referral code
  v_referral_code := substr(md5(NEW.id::text || random()::text || now()::text), 1, 8);

  -- Resolve referrer — ignore empty or invalid codes silently
  v_ref_input := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'referral_code', '')), '');
  IF v_ref_input IS NOT NULL THEN
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE referral_code = v_ref_input
    LIMIT 1;
  END IF;

  -- Ensure username is unique (append suffix on conflict)
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
    v_username := v_username || substr(md5(random()::text), 1, 4);
  END LOOP;

  -- Insert profile
  INSERT INTO public.profiles (
    id, full_name, username, email, phone, role,
    status, account_approved, package, completed_tasks,
    withdrawal_balance, total_earnings, referral_earnings,
    premium_referrals_used, payment_verified, referral_code,
    referred_by
  ) VALUES (
    NEW.id,
    v_full_name,
    v_username,
    v_email,
    v_phone,
    'user',
    'inactive',
    false,
    null,
    0, 0, 0, 0, 0,
    false,
    v_referral_code,
    v_referrer_id
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create referral record if referred
  IF v_referrer_id IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id, commission_rate)
    VALUES (v_referrer_id, NEW.id, 0.10)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Never block signup due to profile creation errors
  -- Log to pg_stat_activity via RAISE NOTICE (visible in Supabase logs)
  RAISE WARNING 'handle_new_user failed for user %: % %', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;
