import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createSupabaseTables() {
  console.log('Creating Supabase tables...');

  try {
    // Create profiles table
    console.log('\nCreating profiles table...');
    const { error: profilesError } = await supabase.rpc('create_profiles_table');
    
    if (profilesError) {
      console.error('Error creating profiles table:', profilesError);
    } else {
      console.log('Profiles table created successfully.');
    }
    
    // Create canvas_tokens table
    console.log('\nCreating canvas_tokens table...');
    const { error: tokensError } = await supabase.rpc('create_canvas_tokens_table');
    
    if (tokensError) {
      console.error('Error creating canvas_tokens table:', tokensError);
    } else {
      console.log('Canvas_tokens table created successfully.');
    }
    
    console.log('\nSupabase tables creation completed.');
  } catch (error) {
    console.error('Error creating Supabase tables:', error);
  }
}

// Run the function
createSupabaseTables(); 