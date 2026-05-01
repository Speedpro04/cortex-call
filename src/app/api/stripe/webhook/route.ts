import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia' as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature');

  let event;
  const body = await request.text();

  if (endpointSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }
  } else {
    // Modo de teste ou sem secret configurado
    event = JSON.parse(body);
    console.warn("⚠️ Webhook rodando sem verificação de assinatura (Modo Desenvolvimento)");
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
            await handleSubscriptionCreated(session.customer as string, session.subscription as string);
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        if (invoice.subscription) {
            await handlePaymentSucceeded(invoice.subscription as string);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        if (invoice.subscription) {
            await handlePaymentFailed(invoice.subscription as string);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription.id);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleSubscriptionCreated(customerId: string, subscriptionId: string) {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        stripe_subscription_id: subscriptionId,
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('stripe_customer_id', customerId)
      .eq('status', 'pending');

    if (error) console.error('Error updating subscription (created):', error);
}

async function handlePaymentSucceeded(subscriptionId: string) {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);
      
    if (error) console.error('Error updating subscription (payment succeeded):', error);
}

async function handlePaymentFailed(subscriptionId: string) {
     const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'overdue',
      })
      .eq('stripe_subscription_id', subscriptionId);
      
    if (error) console.error('Error updating subscription (payment failed):', error);
}

async function handleSubscriptionDeleted(subscriptionId: string) {
     const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);
      
    if (error) console.error('Error updating subscription (deleted):', error);
}
