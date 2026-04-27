import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  
  // Apenas intercepta rotas /dashboard
  if (url.pathname.startsWith('/dashboard')) {
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const accessToken = request.cookies.get('sb-access-token')?.value || request.headers.get('Authorization')?.replace('Bearer ', '');
    const refreshToken = request.cookies.get('sb-refresh-token')?.value;

    // MASTER BYPASS SEGURO: Validar token HMAC (não pode ser forjado)
    const masterToken = request.cookies.get('master-token')?.value;
    const masterEmail = request.cookies.get('master-email')?.value;
    
    if (masterToken && masterEmail) {
      // Recriar o HMAC para validar — usa a mesma secret do server
      try {
        // Nota: crypto.subtle disponível no Edge Runtime do Next.js
        const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret';
        const today = new Date().toISOString().split('T')[0];
        const message = `master:${masterEmail}:${today}`;
        
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const msgData = encoder.encode(message);
        
        const cryptoKey = await crypto.subtle.importKey(
          'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
        );
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
        const expectedToken = Array.from(new Uint8Array(signature))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        if (expectedToken === masterToken) {
          return NextResponse.next();
        }
      } catch (e) {
        // Token inválido, continua com fluxo normal
        console.error('Master token validation failed:', e);
      }
    }

    if (!accessToken) {
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)

    if (authError || !user) {
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    const email = user.email

    // MASTER BYPASS via Supabase Auth (usuário logado com email master)
    if (email === process.env.MASTER_EMAIL) {
        return NextResponse.next()
    }

    // Busca a subscription
    const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select(`
            status,
            clinics (
                user_id
            )
        `)
        .eq('clinics.user_id', user.id)
        .single()

    if (subError || !subscription || subscription.status !== 'active') {
        url.pathname = '/'
        url.hash = 'precos'
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/dashboard/:path*',
}
