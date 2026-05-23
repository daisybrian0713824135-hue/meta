
-- RPC: complete_task — called by authenticated users to submit task completion
CREATE OR REPLACE FUNCTION public.complete_task(
  p_task_id uuid,
  p_proof_url text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   uuid := auth.uid();
  v_profile   profiles%ROWTYPE;
  v_task      tasks%ROWTYPE;
  v_today     timestamptz := date_trunc('day', now());
  v_count     int;
  v_reward    numeric;
  v_new_bal   numeric;
  v_commission numeric;
  v_referral  referrals%ROWTYPE;
  v_referrer  profiles%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;
  IF v_profile.status <> 'active' THEN
    RETURN jsonb_build_object('error', 'Account must be active to complete tasks');
  END IF;

  SELECT * INTO v_task FROM tasks WHERE id = p_task_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Task not found or inactive');
  END IF;

  SELECT COUNT(*) INTO v_count FROM task_completions
  WHERE user_id = v_user_id AND task_id = p_task_id AND completed_at >= v_today;
  IF v_count >= COALESCE(v_task.daily_limit, 1) THEN
    RETURN jsonb_build_object('error', 'Daily task limit reached');
  END IF;

  v_reward  := v_task.reward;
  v_new_bal := COALESCE(v_profile.withdrawal_balance, 0) + v_reward;

  INSERT INTO task_completions(user_id, task_id, reward_earned, status, proof_url, notes, completed_at)
  VALUES (v_user_id, p_task_id, v_reward, 'completed', p_proof_url, p_notes, now());

  UPDATE profiles SET
    withdrawal_balance = v_new_bal,
    total_earnings     = COALESCE(total_earnings, 0) + v_reward,
    completed_tasks    = COALESCE(completed_tasks, 0) + 1,
    updated_at         = now()
  WHERE id = v_user_id;

  UPDATE tasks SET total_completions = COALESCE(total_completions, 0) + 1 WHERE id = p_task_id;

  INSERT INTO earnings(user_id, amount, source, source_id, description, earned_at)
  VALUES (v_user_id, v_reward, 'task', p_task_id, 'Completed: ' || v_task.title, now());

  INSERT INTO transactions(user_id, type, amount, balance_before, balance_after, description, status, reference_id)
  VALUES (v_user_id, 'earning', v_reward, v_profile.withdrawal_balance, v_new_bal,
          'Task reward: ' || v_task.title, 'completed', p_task_id);

  -- Referral commission (10%)
  IF v_profile.referred_by IS NOT NULL THEN
    v_commission := floor(v_reward * 0.10);
    IF v_commission > 0 THEN
      SELECT * INTO v_referral FROM referrals
      WHERE referrer_id = v_profile.referred_by AND referred_id = v_user_id;
      IF FOUND THEN
        SELECT * INTO v_referrer FROM profiles WHERE id = v_profile.referred_by;
        IF FOUND THEN
          UPDATE profiles SET
            withdrawal_balance = COALESCE(withdrawal_balance, 0) + v_commission,
            total_earnings     = COALESCE(total_earnings, 0) + v_commission,
            referral_earnings  = COALESCE(referral_earnings, 0) + v_commission
          WHERE id = v_profile.referred_by;

          UPDATE referrals SET
            total_commission_earned = COALESCE(total_commission_earned, 0) + v_commission
          WHERE id = v_referral.id;

          INSERT INTO earnings(user_id, amount, source, source_id, description, earned_at)
          VALUES (v_profile.referred_by, v_commission, 'referral', v_user_id,
                  'Referral commission from ' || COALESCE(v_profile.username, 'user'), now());
        END IF;
      END IF;
    END IF;
  END IF;

  -- Live activity
  INSERT INTO live_activity(type, message, user_display_name, amount, is_real, is_visible)
  VALUES (
    'task_completion',
    COALESCE(v_profile.full_name, v_profile.username, 'A user') || ' completed ' || v_task.title || ' and earned KES ' || v_reward::text,
    COALESCE(v_profile.full_name, v_profile.username, 'User'),
    v_reward, true, true
  );

  RETURN jsonb_build_object('success', true, 'reward_earned', v_reward, 'new_balance', v_new_bal);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.complete_task(uuid, text, text) TO authenticated;
