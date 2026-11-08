const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { inspectDatabase, generateBackup } = require('./services/postgresDumper');
const { initNeonDb, getPlatformStats } = require('./services/neonDb');
const { processOpenLinks, getRecentLinks } = require('./services/openLinksService');

const TEST_DB = 'postgresql://neondb_owner:npg_j9q1UhnxgTrl@ep-soft-hill-b4t6y52i-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function runTests() {
  console.log('--- STARTING BENIX SPACE TOOLS TEST SUITE ---');

  // Test 1: Neon DB Init & Stats
  console.log('\n[TEST 1] Initializing Neon DB...');
  await initNeonDb();
  const stats = await getPlatformStats();
  console.log('Stats fetched:', stats);

  // Test 2: Inspect Database
  console.log('\n[TEST 2] Inspecting Database...');
  const inspect = await inspectDatabase(TEST_DB);
  console.log(`Inspected DB: ${inspect.database}`);
  console.log(`Total Tables: ${inspect.totalTables}, Total Rows: ${inspect.totalRows}`);
  console.log('Sample discovered tables:', inspect.tables.slice(0, 3));

  // Test 3: Generate SQL Backup
  console.log('\n[TEST 3] Generating full .sql backup...');
  const backup = await generateBackup(TEST_DB, {}, (p) => {
    console.log(`[BACKUP PROGRESS ${p.percent}%] ${p.message}`);
  });
  console.log(`Backup generated! File: ${backup.fileName}, Size: ${backup.fileSizeFormatted}, Tables: ${backup.totalTables}, Rows: ${backup.totalRows}`);

  // Test 4: OpenLinks System
  console.log('\n[TEST 4] Testing OpenLinks system...');
  const openLinksResult = await processOpenLinks({
    links: ['https://benix.space', 'https://tools.benix.space'],
    duration: 15,
    clientIp: '127.0.0.1'
  });
  console.log('OpenLinks processed:', openLinksResult.message);
  console.log('Links count:', openLinksResult.totalLinks);

  const history = await getRecentLinks(5);
  console.log('Recent links in DB:', history.length);

  console.log('\n=============================================');
  console.log('ALL BENIX SPACE TOOLS TESTS PASSED WITH 100% SUCCESS!');
  console.log('=============================================');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
