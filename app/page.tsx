import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const supabase = await createClient();
  let user = null;
  
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    // Treat as unauthenticated if fetch fails
  }

  if (!user) {
    redirect('/login');
  }

  const role = user.user_metadata?.role;
  if (role === 'staff') {
    redirect('/members');
  }

  redirect('/dashboard');
}
