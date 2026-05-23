// MetaPay - task-completer edge function
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Invalid auth' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { task_id, proof_url, notes } = body;

    if (!task_id) {
      return new Response(JSON.stringify({ error: 'task_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile, error: profileErr } = await supabase
      .from('profiles').select('*').eq('id', user.id).maybeSingle();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (profile.status !== 'active') {
      return new Response(JSON.stringify({ error: 'Account must be active to complete tasks' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: task, error: taskErr } = await supabase
      .from('tasks').select('*').eq('id', task_id).eq('is_active', true).maybeSingle();

    if (taskErr || !task) {
      return new Response(JSON.stringify({ error: 'Task not found or inactive' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: todayCount } = await supabase
      .from('task_completions').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('task_id', task_id).gte('completed_at', todayStart.toISOString());

    if ((todayCount ?? 0) >= task.daily_limit) {
      return new Response(JSON.stringify({ error: 'Daily task limit reached' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const reward = Number(task.reward);
    const now = new Date().toISOString();
    const newBalance = Number(profile.withdrawal_balance) + reward;
    const newTotalEarnings = Number(profile.total_earnings) + reward;
    const newCompletedTasks = Number(profile.completed_tasks) + 1;

    await supabase.from('task_completions').insert({
      user_id: user.id, task_id, reward_earned: reward, status: 'completed',
      proof_url: proof_url || null, notes: notes || null, completed_at: now,
    });

    await supabase.from('profiles').update({
      withdrawal_balance: newBalance, total_earnings: newTotalEarnings,
      completed_tasks: newCompletedTasks, updated_at: now,
    }).eq('id', user.id);

    await supabase.from('tasks').update({
      total_completions: task.total_completions + 1,
    }).eq('id', task_id);

    await supabase.from('earnings').insert({
      user_id: user.id, amount: reward, source: 'task', source_id: task_id,
      description: `Completed: ${task.title}`, earned_at: now,
    });

    await supabase.from('transactions').insert({
      user_id: user.id, type: 'earning', amount: reward,
      balance_before: Number(profile.withdrawal_balance), balance_after: newBalance,
      description: `Task reward: ${task.title}`, status: 'completed', reference_id: task_id,
    });

    // Referral commission (10%)
    if (profile.referred_by) {
      const commission = Math.floor(reward * 0.10);
      if (commission > 0) {
        const { data: referral } = await supabase.from('referrals').select('*')
          .eq('referrer_id', profile.referred_by).eq('referred_id', user.id).maybeSingle();
        if (referral) {
          const { data: referrer } = await supabase.from('profiles')
            .select('withdrawal_balance, total_earnings, referral_earnings')
            .eq('id', profile.referred_by).maybeSingle();
          if (referrer) {
            await supabase.from('profiles').update({
              withdrawal_balance: Number(referrer.withdrawal_balance) + commission,
              total_earnings: Number(referrer.total_earnings) + commission,
              referral_earnings: Number(referrer.referral_earnings) + commission,
            }).eq('id', profile.referred_by);
            await supabase.from('referrals').update({
              total_commission_earned: Number(referral.total_commission_earned) + commission,
            }).eq('id', referral.id);
            await supabase.from('earnings').insert({
              user_id: profile.referred_by, amount: commission,
              source: 'referral', source_id: user.id,
              description: `Referral commission from ${profile.username}`, earned_at: now,
            });
          }
        }
      }
    }

    // Live activity
    await supabase.from('live_activity').insert({
      type: 'task_completion',
      message: `${profile.full_name || profile.username} completed ${task.title} and earned KES ${reward}`,
      user_display_name: profile.full_name || profile.username,
      amount: reward, is_real: true, is_visible: true,
    });

    return new Response(
      JSON.stringify({ success: true, reward_earned: reward, new_balance: newBalance }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
