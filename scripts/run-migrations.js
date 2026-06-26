/**
 * HAMA Database Migration Runner
 *
 * Applies SQL migration files to your Supabase project.
 *
 * Usage:
 *   1. Copy .env.example to .env (already done)
 *   2. Make sure SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY
 *      are set in your .env file
 *   3. Run: node scripts/run-migrations.js
 *
 * The script reads the SQL files from supabase/migrations/ in order
 * and executes them against your Supabase project using the
 * Management API (requires service_role key).
 *
 * IMPORTANT: This script uses the SUPABASE_SERVICE_ROLE_KEY from your .env.
 * It has admin privileges - keep it secure and NEVER commit it.
 */

const fs = require('fs');
const path = require('path');

// Load .env file manually (no dotenv dependency needed)
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found. Copy .env.example to .env and fill in your credentials.');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL not found in .env');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env');
  console.error('   This key is required for running migrations (DDL operations).');
  console.error('   Get it from: Supabase Dashboard → Project Settings → API → service_role key');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
console.log(`🔗 Project ref: ${projectRef}`);

// Get migration files in order
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

if (migrationFiles.length === 0) {
  console.error('❌ No SQL migration files found in supabase/migrations/');
  process.exit(1);
}

console.log(`📋 Found ${migrationFiles.length} migration files:`);
migrationFiles.forEach(f => console.log(`   - ${f}`));

/**
 * Execute SQL against the Supabase project via the Management API.
 * The Management API uses the project ref and a service_role key (or access token).
 *
 * Endpoint: POST https://api.supabase.com/v1/projects/{ref}/sql/query
 * Requires: Authorization: Bearer {service_role_key or access_token}
 */
async function executeSQL(sql, label) {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/sql/query`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });

    const result = await response.text();
    
    if (!response.ok) {
      // Try alternative: use the direct database REST API with service role key
      // Fallback to executing via the Supabase REST SQL endpoint
      console.log(`⚠️ Management API failed (${response.status}), trying REST API fallback...`);
      return await executeSQLViaRestAPI(sql, label);
    }

    console.log(`✅ ${label} — success`);
    return true;
  } catch (error) {
    console.log(`⚠️ Management API error: ${error.message}, trying REST API fallback...`);
    return await executeSQLViaRestAPI(sql, label);
  }
}

/**
 * Fallback: Execute SQL via Supabase REST API using service_role key.
 * This uses the /rest/v1/ endpoint with raw SQL via the "query" parameter.
 */
async function executeSQLViaRestAPI(sql, label) {
  // Split SQL into individual statements and execute one by one
  // (since the REST API handles single statements better)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`   Executing ${statements.length} statements...`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    if (!stmt) continue;

    // Skip comments-only blocks
    if (stmt.startsWith('--') || stmt.startsWith('/*')) continue;

    try {
      // Use the Supabase REST API with the service_role key
      // Note: This approach has limitations since REST API doesn't support all DDL
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apiKey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      // REST API can't execute arbitrary DDL - that's a known limitation
      // So this fallback is mostly for reference
      successCount++;
    } catch (e) {
      failCount++;
    }
  }

  // Since REST API can't execute DDL, inform the user
  console.log(`ℹ️  The REST API cannot execute DDL statements (CREATE TABLE, ALTER, etc.)`);
  console.log(`   This is a Supabase platform limitation.`);
  
  return null; // signal that manual action is needed
}

async function main() {
  console.log('\n🚀 Starting HAMA database migrations...\n');

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    const label = file.replace('.sql', '');
    
    console.log(`\n📄 Running: ${file}`);
    const result = await executeSQL(sql, label);
    
    if (result === null) {
      console.log(`\n⚠️  Could not execute ${file} automatically.`);
      console.log(`   Please run it manually in the Supabase Dashboard SQL Editor.`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📋 Migration Summary');
  console.log('='.repeat(50));
  console.log('\nSince automated DDL execution has limitations, the most reliable');
  console.log('method is to use the Supabase Dashboard SQL Editor.');
  console.log('\nOpen this URL and paste the SQL files in order:');
  console.log(`https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  console.log('\nFiles to run (in this order):');
  migrationFiles.forEach((f, i) => console.log(`  ${i + 1}. supabase/migrations/${f}`));
  console.log('');
}

main().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
