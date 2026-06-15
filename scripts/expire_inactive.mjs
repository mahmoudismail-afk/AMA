import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = Object.fromEntries(
  envContent.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const eqIdx = line.indexOf('=');
      return [line.slice(0, eqIdx), line.slice(eqIdx + 1)];
    })
);

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching active members...");
  const { data: members, error } = await supabase
    .from('members')
    .select(`
      id,
      created_at,
      profile_id,
      profile:profiles (full_name, phone),
      memberships (id, status)
    `)
    .eq('status', 'active');

  if (error) {
    console.error("Error fetching members:", error);
    process.exit(1);
  }

  console.log(`Found ${members.length} active members. Checking for missing subscriptions...`);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let count = 0;
  for (const m of members) {
    const activeMemberships = (m.memberships || []).filter(ms => ms.status === 'active');
    const createdAt = new Date(m.created_at);

    const name = m.profile?.full_name || 'Unknown';

    if (activeMemberships.length === 0 && createdAt < sevenDaysAgo) {
      console.log(`Marking as expired: ${name}`);
      const { error: updateError } = await supabase
        .from('members')
        .update({ status: 'expired' })
        .eq('id', m.id);
        
      if (updateError) {
        console.error(`Failed to update ${name}:`, updateError);
      } else {
        count++;
      }
    }
  }

  console.log(`\nSuccessfully marked ${count} old members without plans as 'expired'.`);
}

run();
