import '../server/loadenv.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { sql } from '@vercel/postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationSql = readFileSync(join(__dirname, '../db/migrations/001_multiuser.sql'), 'utf8');

console.log('Running migration 001_multiuser.sql ...');
try {
  await sql.query(migrationSql);
  console.log('Migration complete.');
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exit(1);
}
