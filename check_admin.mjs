import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables.');
  process.exit(1);
}
if (!adminEmail || !adminPassword || adminPassword.length < 8) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 characters) in the environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkLogin() {
  console.log('Testing login...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  if (error) {
    console.error('Login error:', error.message);
  } else {
    console.log('Login successful for:', data.user.email);
    console.log('Checking profile...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('auth_id', data.user.id)
      .single();
    
    if (profileError) {
      console.error('Profile fetch error:', profileError.message);
    } else {
      console.log('Profile found:', profile);
    }
  }
}

checkLogin();
