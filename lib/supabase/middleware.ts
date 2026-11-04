import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public self-registration is disabled — accounts are created by admins in Settings.
  if (request.nextUrl.pathname.startsWith('/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users away from protected routes
  const protectedPaths = [
    '/dashboard', '/members', '/plans', '/classes', '/trainers', '/payments', '/checkins', '/reports',
    '/settings', '/expenses', '/inventory', '/history',
  ];
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from the login page
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    // Role comes from public.profiles — never from user_metadata, which users can edit themselves.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('auth_id', user.id)
      .single();
    const url = request.nextUrl.clone();
    url.pathname = profile?.role === 'admin' ? '/dashboard' : '/members';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
