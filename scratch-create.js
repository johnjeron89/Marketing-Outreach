require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUsers() {
  const users = [
    { email: 'pavan@nexaworks.tech', password: 'NexaWorks@2004' },
    { email: 'mangala@nexaworks.tech', password: 'NexaWorks@2004' }
  ];

  for (const user of users) {
    console.log(`Attempting to create ${user.email}...`);
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
    });

    if (error) {
      console.error(`Error creating ${user.email}:`, error.message);
    } else {
      console.log(`Success creating ${user.email}: User ID ${data.user?.id}`);
      if (data.user?.identities?.length === 0) {
        console.log(`User already exists, but might require email confirmation or is a different identity.`);
      }
    }
  }
}

createUsers();
