const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const { initNeonDb, recordBackupLog, getPlatformStats } = require('./services/neonDb');
const { inspectDatabase, generateBackup, getBackupFile } = require('./services/postgresDumper');
const { processOpenLinks, getRecentLinks } = require('./services/openLinksService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------------
// SEO Endpoints: robots.txt & sitemap.xml
// -------------------------------------------------------------
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Allow: /api/tools
Allow: /sitemap.xml

# Allow AI crawlers for indexation & discovery
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: https://tools.benix.space/sitemap.xml
`);
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  const now = new Date().toISOString().split('T')[0];
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>https://tools.benix.space/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://tools.benix.space/#postgres-dumper</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://tools.benix.space/#openlinks</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://tools.benix.space/#tools-directory</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`);
});

// -------------------------------------------------------------
// API: Tools Directory & Platform Stats
// -------------------------------------------------------------
app.get('/api/tools', (req, res) => {
  res.json({
    platform: 'BenixSpaceTools',
    domain: 'tools.benix.space',
    version: '1.0.0',
    tools: [
      {
        id: 'postgres-dumper',
        title: 'PostgreSQL Database to SQL Downloader',
        slug: 'postgres-to-sql',
        category: 'Database Tools',
        status: 'active',
        badge: 'Popular',
        description: 'Connect to any PostgreSQL database (Neon, Supabase, Prisma, Railway, AWS RDS, Docker) via connection URL and download a complete .sql backup file with all tables, constraints, sequences, and records.'
      },
      {
        id: 'openlinks',
        title: 'OpenLinks - Multi-URL Opener & Timed Viewer',
        slug: 'open-links',
        category: 'Web & Traffic Tools',
        status: 'active',
        badge: 'Powered by OpenLinks',
        description: 'Automated multi-link opener with custom duration timers, link health checks, background tab launching, and session tracking. Based on openlinks.'
      },
      {
        id: 'postgres-to-mysql',
        title: 'PostgreSQL to MySQL Converter',
        slug: 'pg-to-mysql',
        category: 'Database Tools',
        status: 'upcoming',
        badge: 'Coming Soon',
        description: 'Convert PostgreSQL DDL, types (UUID, JSONB, boolean), and sequences into 100% MySQL InnoDB compatible SQL scripts.'
      },
      {
        id: 'sql-formatter',
        title: 'SQL Query Beautifier & Formatter',
        slug: 'sql-formatter',
        category: 'Developer Utilities',
        status: 'upcoming',
        badge: 'Coming Soon',
        description: 'Format, indent, and optimize complex SQL queries for PostgreSQL, MySQL, and SQLite.'
      }
    ]
  });
});

app.get('/api/stats', async (req, res) => {
  const stats = await getPlatformStats();
  res.json(stats);
});

// -------------------------------------------------------------
// API: PostgreSQL Inspector & Backup Downloader
// -------------------------------------------------------------
app.post('/api/database/inspect', async (req, res) => {
  const { connectionString } = req.body;
  try {
    const data = await inspectDatabase(connectionString);
    res.json(data);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/database/export', async (req, res) => {
  const { connectionString, options } = req.body;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    const backup = await generateBackup(connectionString, options || {});

    // Save record to Neon PostgreSQL
    await recordBackupLog({
      host: backup.dbHost,
      dbName: backup.dbName,
      tables: backup.totalTables,
      rows: backup.totalRows,
      fileSize: backup.fileSizeBytes,
      durationMs: backup.durationMs,
      clientIp
    });

    res.json({
      success: true,
      token: backup.token,
      fileName: backup.fileName,
      fileSize: backup.fileSizeFormatted,
      fileSizeBytes: backup.fileSizeBytes,
      totalTables: backup.totalTables,
      totalRows: backup.totalRows,
      durationMs: backup.durationMs,
      downloadUrl: `/api/database/download/${backup.token}?file=${encodeURIComponent(backup.fileName)}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/database/download/:token', (req, res) => {
  const { token } = req.params;
  const requestedFileName = req.query.file || 'database_backup.sql';
  const filePath = getBackupFile(token);

  if (!filePath) {
    return res.status(404).send('Backup file not found or has expired.');
  }

  res.setHeader('Content-Type', 'application/sql');
  res.setHeader('Content-Disposition', `attachment; filename="${requestedFileName.replace(/"/g, '')}"`);
  
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

// -------------------------------------------------------------
// API: OpenLinks System (compatible with benirbenjamin/openlinks)
// -------------------------------------------------------------
app.post('/open-link', async (req, res) => {
  const { link, duration, tabsCount, layoutMode } = req.body;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  try {
    const result = await processOpenLinks({ 
      links: [link], 
      duration: duration || 10, 
      tabsCount: tabsCount || 1, 
      layoutMode: layoutMode || 'auto', 
      clientIp 
    });
    res.json({
      message: 'Link opened successfully in OpenLinks system.',
      ...result
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/links/open', async (req, res) => {
  const { links, duration, tabsCount, layoutMode } = req.body;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  try {
    const result = await processOpenLinks({ 
      links, 
      duration, 
      tabsCount, 
      layoutMode, 
      clientIp 
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/links/history', async (req, res) => {
  const history = await getRecentLinks(20);
  res.json({ success: true, history });
});

// Fallback to React frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, async () => {
  console.log(`======================================================`);
  console.log(`BenixSpaceTools (tools.benix.space) Server Started!`);
  console.log(`Local URL: http://localhost:${PORT}`);
  console.log(`======================================================`);
  await initNeonDb();
});
