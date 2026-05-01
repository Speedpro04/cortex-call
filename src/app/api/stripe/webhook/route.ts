import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'Cortex Call <noreply@cortexcall.com>';

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
    // Primeiro busca os dados da clínica e plano
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        *,
        clinics (nome_clinica, email),
        plans (nome)
      `)
      .eq('stripe_customer_id', customerId)
      .eq('status', 'pending')
      .single();

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

    if (error) {
      console.error('Error updating subscription (created):', error);
      return;
    }

    // Enviar email de boas-vindas
    if (subscription?.clinics?.email && subscription?.plans?.nome) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [subscription.clinics.email, 'axoshub.solara@gmail.com'],
          subject: `Bem-vindo ao Cortex Call - ${subscription.clinics.nome_clinica}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #006266, #00896e); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .plan { background: #006266; color: white; padding: 15px 25px; border-radius: 8px; display: inline-block; margin: 15px 0; }
                .button { background: #006266; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px; }
                .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>🎉 Bem-vindo ao Cortex Call!</h1>
              </div>
              <div class="content">
                <h2>Olá, ${subscription.clinics.nome_clinica}!</h2>
                <p>Seu cadastro foi realizado com sucesso e seu pagamento foi confirmado.</p>
                <p>Você assinou o plano:</p>
                <div class="plan"><strong>${subscription.plans.nome}</strong></div>
                <p>A partir de agora, você tem acesso completo ao Cortex Call, a inteligência artificial que recupera pacientes para sua clínica médica.</p>
                <p><strong>Próximos passos:</strong></p>
                <ul>
                  <li>Configure sua agenda de pacientes</li>
                  <li>Conecte seu WhatsApp</li>
                  <li>Ative as campanhas de recuperação automática</li>
                </ul>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Acessar meu Painel</a>
              </div>
              <div class="footer">
                <p>Em caso de dúvida, responda este e-mail ou contactez suporte@cortexcall.com</p>
                <p>© 2026 Cortex Call - Todos os direitos reservados</p>
              </div>
            </body>
            </html>
          `,
        });
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
      }
    }
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
