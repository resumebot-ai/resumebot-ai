// app/api/users/route.ts
import { supabase } from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';

// Handle GET requests
export async function GET() {
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ users: data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Handle POST requests
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, stripeCustomerId, subscriptionStatus } = body;

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        email,
        stripe_customer_id: stripeCustomerId || null,
        subscription_status: subscriptionStatus || 'active',
      },
    ])
    .select();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ user: data[0] }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}
