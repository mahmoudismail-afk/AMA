import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
if (!adminEmail || !adminPassword || adminPassword.length < 8) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 characters) in the environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { full_name: 'System Admin' }
  });

  if (error) {
    if (error.message.includes('already registered')) {
        console.log('User already exists. Updating password instead...');
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const user = usersData.users.find(u => u.email === adminEmail);
        if (user) {
            const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
                password: adminPassword
            });
            if (updateError) {
                console.error('Error updating password:', updateError);
            } else {
                console.log(`Successfully updated password for ${adminEmail}`);
            }
        }
    } else {
        console.error('Error creating admin user:', error);
    }
  } else {
    console.log('Successfully created admin user:', data.user.email);
  }
}

createAdmin();
