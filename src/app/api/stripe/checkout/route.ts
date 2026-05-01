import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan_slug, clinic_name, email, phone, user_id } = body;

    // 1. Buscar o plano no banco
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('slug', plan_slug)
      .eq('ativo', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado.' },
        { status: 404 }
      );
    }

    // Define o Price ID do Stripe com base no plano (fallback para variaveis de ambiente caso não esteja no banco)
    let stripePriceId = plan.stripe_price_id;
    if (!stripePriceId) {
      if (plan_slug === 'plan-2-especialistas' || plan_slug === 'plan-2-medicos') stripePriceId = process.env.STRIPE_PRICE_ID_2_ESP;
      else if (plan_slug === 'plan-3-5-especialistas' || plan_slug === 'plan-3-5-medicos') stripePriceId = process.env.STRIPE_PRICE_ID_3_5_ESP;
      else if (plan_slug === 'plan-5-8-especialistas' || plan_slug === 'plan-5-8-medicos') stripePriceId = process.env.STRIPE_PRICE_ID_5_8_ESP;
    }

    if (!stripePriceId) {
       console.error(`Missing Stripe Price ID for plan: ${plan_slug}. Checked database and env variables.`);
       return NextResponse.json(
        { error: `Configuração de preço do Stripe ausente para o plano: ${plan_slug}. Verifique as variáveis de ambiente.` },
        { status: 500 }
      );
    }

    // 2. Criar ou recuperar Customer no Stripe
    let customerId;
    const existingCustomers = await stripe.customers.list({ email: email, limit: 1 });
    
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: email,
        name: clinic_name,
        phone: phone,
        metadata: {
          user_id: user_id
        }
      });
      customerId = customer.id;
    }

    // 3. Criar Checkout Session no Stripe
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/register?plan=${plan_slug}&canceled=true`,
      client_reference_id: user_id, // Vincula ao usuário do Supabase
    });

    // 4. Criar a clínica no Supabase se não existir
    let clinicId;
    const { data: existingClinic } = await supabase
      .from('clinics')
      .select('id')
      .eq('user_id', user_id)
      .single();

    if (existingClinic) {
        clinicId = existingClinic.id;
    } else {
        const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .insert({
            user_id: user_id,
            nome_clinica: clinic_name,
            email: email,
            telefone: phone
        })
        .select()
        .single();

        if (clinicError) {
            console.error('Supabase Clinic Error:', clinicError);
            return NextResponse.json(
                { error: 'Erro ao criar clínica.' },
                { status: 500 }
            );
        }
        clinicId = clinic.id;
    }

    // 5. Criar a assinatura (pendente até confirmação do Stripe)
    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        clinic_id: clinicId,
        plan_id: plan.id,
        status: 'pending',
        stripe_customer_id: customerId,
      });

    if (subError) {
      console.error('Supabase Subscription Error:', subError);
    }

    // 6. Retornar URL do checkout
    return NextResponse.json({
      success: true,
      payment_url: session.url,
    });
  } catch (error) {
    console.error('Checkout Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
