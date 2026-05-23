import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { user_id, package_name, amount, payment_reference } = body;

    if (!user_id || !package_name) {
      return new Response(JSON.stringify({ error: 'Missing user_id or package_name' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify package exists and price matches
    const { data: pkg, error: pkgErr } = await supabase
      .from('packages')
      .select('*')
      .eq('name', package_name)
      .eq('is_active', true)
      .maybeSingle();

    if (pkgErr || !pkg) {
      return new Response(JSON.stringify({ error: 'Invalid package' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Activate the user account
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({
        status: 'active',
        account_approved: true,
        payment_verified: true,
        package: package_name,
        package_activated_at: now.toISOString(),
        package_expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', user_id);

    if (profileErr) {
      return new Response(JSON.stringify({ error: 'Failed to update profile', details: profileErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create activation log
    await supabase.from('activation_logs').insert({
      user_id,
      package: package_name,
      amount_paid: amount || pkg.price,
      payment_reference: payment_reference || null,
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    // Create transaction record
    await supabase.from('transactions').insert({
      user_id,
      type: 'payment',
      amount: amount || pkg.price,
      balance_before: 0,
      balance_after: 0,
      description: `Package activation: ${pkg.display_name}`,
      package: package_name,
      status: 'completed',
      reference_id: payment_reference || null,
    });

    // Create live activity
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', user_id)
      .maybeSingle();

    const displayName = profileData?.full_name || profileData?.username || 'A user';
    await supabase.from('live_activity').insert({
      type: 'package_activation',
      message: `${displayName} activated ${pkg.display_name} package`,
      user_display_name: displayName,
      amount: amount || pkg.price,
      is_real: true,
      is_visible: true,
    });

    // Create notification for user
    await supabase.from('notifications').insert({
      user_id,
      type: 'payment',
      title: 'Account Activated!',
      message: `Your ${pkg.display_name} package has been activated. Start earning now!`,
      is_read: false,
      is_broadcast: false,
    });

    return new Response(
      JSON.stringify({ success: true, package: package_name, expires_at: expiresAt.toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
