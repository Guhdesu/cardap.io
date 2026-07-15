import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas do staff que NÃO precisam de autenticação
const PUBLIC_STAFF_PATHS = ['/staff/login'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Aplica proteção apenas nas rotas do staff
  if (!pathname.startsWith('/staff')) return NextResponse.next();

  // Permite acesso às rotas públicas do staff (login)
  if (PUBLIC_STAFF_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Verifica presença do token no cookie
  const token = request.cookies.get('staff_token')?.value;

  if (!token) {
    const loginUrl = new URL('/staff/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/staff/:path*'],
};
