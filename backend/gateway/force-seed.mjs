import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'data', 'marketplace.db');

console.log('Opening database at:', dbPath);
const db = new Database(dbPath);

console.log('Clearing existing data...');
db.exec('DELETE FROM provider_stats');
db.exec('DELETE FROM transactions');
db.exec('DELETE FROM api_registry');
db.exec('DELETE FROM providers');
db.exec('DELETE FROM agent_sessions');

console.log('Importing database init logic...');
import('./lib/database.js').then(async m => {
  await m.initDatabase();
  console.log('Seeding completed successfully!');
}).catch(err => {
  console.error('Error seeding data:', err);
});
