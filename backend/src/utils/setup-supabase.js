import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Read SQL file
const sqlFilePath = path.join(__dirname, 'supabase-schema.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Split SQL statements
const sqlStatements = sqlContent
  .split(';')
  .map(statement => statement.trim())
  .filter(statement => statement.length > 0);

// Execute SQL statements
async function setupSupabase() {
  console.log('Setting up Supabase tables...');
  
  try {
    for (const statement of sqlStatements) {
      console.log(`Executing SQL statement: ${statement.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { query: statement });
      
      if (error) {
        console.error('Error executing SQL statement:', error);
      } else {
        console.log('SQL statement executed successfully.');
      }
    }
    
    console.log('Supabase setup completed.');
  } catch (error) {
    console.error('Error setting up Supabase:', error);
  }
}

// Run setup
setupSupabase(); 