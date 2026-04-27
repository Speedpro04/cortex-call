import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * Verifica se o email é um master email (validação server-side).
 * Gera um token seguro para evitar spoofing via cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ isMaster: false }, { status: 400 });
    }

    // Buscar na tabela master_emails (server-side only)
    const { data, error } = await supabase
      .from('master_emails')
      .select('email')
      .eq('email', email.trim().toLowerCase())
      .eq('ativo', true)
      .single();

    if (error || !data) {
      return NextResponse.json({ isMaster: false });
    }

    // Gerar token HMAC seguro (não pode ser forjado sem a secret)
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret';
    const token = crypto
      .createHmac('sha256', secret)
      .update(`master:${email.toLowerCase()}:${new Date().toISOString().split('T')[0]}`)
      .digest('hex');

    const response = NextResponse.json({ isMaster: true });

    // Setar cookie httpOnly (não acessível via JS do navegador)
    response.cookies.set('master-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400, // 24h
    });

    response.cookies.set('master-email', email.toLowerCase(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });

    return response;
  } catch (error) {
    console.error('Master check error:', error);
    return NextResponse.json({ isMaster: false }, { status: 500 });
  }
}
