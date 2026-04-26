import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  
  // Apenas intercepta rotas /dashboard
  if (url.pathname.startsWith('/dashboard')) {
    
    // Configura o supabase client para leitura (server-side)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Precisamos pegar a sessão atual ou o token
    const accessToken = request.cookies.get('sb-access-token')?.value || request.headers.get('Authorization')?.replace('Bearer ', '');
    const refreshToken = request.cookies.get('sb-refresh-token')?.value;

    // MASTER BYPASS: Se o cookie local estiver presente, libera o acesso imediatamente (ignora Supabase)
    if (request.cookies.get('master-bypass')?.value === 'true') {
        return NextResponse.next()
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

    // MASTER BYPASS
    if (email === process.env.MASTER_EMAIL) {
        return NextResponse.next()
    }

    // Busca a subscription usando query customizada porque pode não ser o dono direto
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
