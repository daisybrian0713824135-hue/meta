// MetaPay - paynecta-webhook edge function
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret, x-paynecta-secret',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('PAYNECTA_WEBHOOK_SECRET') || 'devan1234';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const sig = req.headers.get('x-webhook-secret') || req.headers.get('x-paynecta-secret');

    if (sig !== webhookSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { status, transaction_id, amount, metadata } = body;

    if (status !== 'success' && status !== 'completed') {
      return new Response(
        JSON.stringify({ received: true, processed: false, reason: 'Non-success status' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user_id = metadata?.user_id;
    const package_name = metadata?.package_name;

    if (!user_id || !package_name) {
      return new Response(JSON.stringify({ error: 'Missing metadata: user_id and package_name required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Idempotency check
    const { data: existingLog } = await supabase
      .from('activation_logs').select('id')
      .eq('paynecta_transaction_id', transaction_id).maybeSingle();

    if (existingLog) {
      return new Response(
        JSON.stringify({ received: true, processed: false, reason: 'Already processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: pkg } = await supabase.from('packages').select('*')
      .eq('name', package_name).maybeSingle();

    if (!pkg) {
      return new Response(JSON.stringify({ error: 'Invalid package' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await supabase.from('profiles').update({
      status: 'active', account_approved: true, payment_verified: true,
      package: package_name, package_activated_at: now.toISOString(),
      package_expires_at: expiresAt.toISOString(), updated_at: now.toISOString(),
    }).eq('id', user_id);

    await supabase.from('activation_logs').insert({
      user_id, package: package_name, amount_paid: amount || pkg.price,
      paynecta_transaction_id: transaction_id,
      activated_at: now.toISOString(), expires_at: expiresAt.toISOString(),
    });

    await supabase.from('transactions').insert({
      user_id, type: 'payment', amount: amount || pkg.price,
      balance_before: 0, balance_after: 0,
      description: `Package: ${pkg.display_name} via Paynecta`,
      package: package_name, paynecta_transaction_id: transaction_id, status: 'completed',
    });

    await supabase.from('notifications').insert({
      user_id, type: 'payment', title: 'Payment Confirmed!',
      message: `Your ${pkg.display_name} package is now active. Start earning!`,
      is_read: false, is_broadcast: false,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
