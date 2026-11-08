const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
dns.setDefaultResultOrder('ipv4first');

const customLookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  dns.resolve4(hostname, (err, addresses) => {
    if (!err && addresses && addresses.length > 0) {
      return callback(null, addresses[0], 4);
    }
    dns.lookup(hostname, options, callback);
  });
};

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Client } = require('pg');

const BACKUPS_DIR = path.join(__dirname, '..', 'data', 'backups');
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

function escapeSqlValue(val) {
  if (val === null || val === undefined) {
    return 'NULL';
  }
  if (typeof val === 'boolean') {
    return val ? 'TRUE' : 'FALSE';
  }
  if (typeof val === 'number') {
    return isFinite(val) ? val.toString() : 'NULL';
  }
  if (val instanceof Date) {
    return `'${val.toISOString()}'`;
  }
  if (Buffer.isBuffer(val)) {
    return `E'\\\\x${val.toString('hex')}'`;
  }
  if (Array.isArray(val)) {
    const elements = val.map(v => {
      if (v === null) return 'NULL';
      if (typeof v === 'number' || typeof v === 'boolean') return v.toString();
      const s = String(v).replace(/"/g, '\\"');
      return `"${s}"`;
    });
    return `ARRAY[${elements.join(',')}]`;
  }
  if (typeof val === 'object') {
    const jsonStr = JSON.stringify(val);
    return `'${jsonStr.includes("'") ? jsonStr.replace(/'/g, "''") : jsonStr}'::jsonb`;
  }
  const str = String(val);
  return `'${str.includes("'") ? str.replace(/'/g, "''") : str}'`;
}

async function inspectDatabase(connectionString) {
  if (!connectionString || typeof connectionString !== 'string') {
    throw new Error('Valid PostgreSQL connection URL is required');
  }

  const client = new Client({
    connectionString: connectionString.trim(),
    ssl: { rejectUnauthorized: false },
    lookup: customLookup,
    keepAlive: true,
    connectionTimeoutMillis: 20000
  });

  client.on('error', (err) => {
    console.warn('[PostgresDumper inspect client error]', err.message);
  });

  try {
    await client.connect();

    const infoRes = await client.query('SELECT current_database() as db_name, current_user as user_name, version();');
    const dbInfo = infoRes.rows[0];

    const schemasRes = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name;
    `);

    const tablesRes = await client.query(`
      SELECT 
        n.nspname AS table_schema,
        c.relname AS table_name,
        COALESCE(s.n_live_tup, GREATEST(c.reltuples::bigint, 0)) AS row_count
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_stat_user_tables s ON s.schemaname = n.nspname AND s.relname = c.relname
      WHERE n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        AND c.relkind = 'r'
      ORDER BY n.nspname, c.relname;
    `);

    const tables = [];
    let totalRows = 0;

    for (const t of tablesRes.rows) {
      const rowCount = Math.max(0, parseInt(t.row_count, 10) || 0);
      totalRows += rowCount;
      tables.push({
        schema: t.table_schema,
        name: t.table_name,
        fullName: `${t.table_schema}.${t.table_name}`,
        rowCount
      });
    }

    await client.end();

    return {
      success: true,
      database: dbInfo.db_name,
      user: dbInfo.user_name,
      version: dbInfo.version,
      schemas: schemasRes.rows.map(r => r.schema_name),
      totalTables: tables.length,
      totalRows,
      tables
    };
  } catch (err) {
    try { await client.end(); } catch (e) {}
    throw new Error(`Database connection failed: ${err.message}`);
  }
}

async function generateBackup(connectionString, options = {}, onProgress = null) {
  if (!connectionString || typeof connectionString !== 'string') {
    throw new Error('Valid PostgreSQL connection URL is required');
  }

  const token = crypto.randomBytes(16).toString('hex');
  const startTime = Date.now();
  const notify = (msg, pct) => {
    if (typeof onProgress === 'function') onProgress({ message: msg, percent: pct });
  };

  notify('Connecting to database...', 5);

  const client = new Client({
    connectionString: connectionString.trim(),
    ssl: { rejectUnauthorized: false },
    lookup: customLookup,
    keepAlive: true,
    connectionTimeoutMillis: 30000,
    query_timeout: 0
  });

  client.on('error', (err) => {
    console.warn('[PostgresDumper export client error]', err.message);
  });

  try {
    await client.connect();
    notify('Connected! Analyzing schemas, sequences, and enums...', 10);

    const infoRes = await client.query('SELECT current_database() as db_name, current_user as user_name, version();');
    const dbName = infoRes.rows[0].db_name;
    const sanitizedDbName = dbName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup_${sanitizedDbName}_${timestampStr}.sql`;
    const filePath = path.join(BACKUPS_DIR, `${token}.sql`);

    const outStream = fs.createWriteStream(filePath, { encoding: 'utf8' });
    const writeLine = (line = '') => {
      outStream.write(line + '\n');
    };

    await writeLine(`--`);
    await writeLine(`-- PostgreSQL database dump`);
    await writeLine(`-- Generated by BenixSpaceTools (tools.benix.space)`);
    await writeLine(`-- Source Database: ${dbName}`);
    await writeLine(`-- Date: ${new Date().toISOString()}`);
    await writeLine(`--`);
    await writeLine(``);
    await writeLine(`SET statement_timeout = 0;`);
    await writeLine(`SET lock_timeout = 0;`);
    await writeLine(`SET idle_in_transaction_session_timeout = 0;`);
    await writeLine(`SET client_encoding = 'UTF8';`);
    await writeLine(`SET standard_conforming_strings = on;`);
    await writeLine(`SELECT pg_catalog.set_config('search_path', '', false);`);
    await writeLine(`SET check_function_bodies = false;`);
    await writeLine(`SET xmloption = content;`);
    await writeLine(`SET client_min_messages = warning;`);
    await writeLine(`SET row_security = off;`);
    await writeLine(``);

    // 1. Schemas
    const schemasRes = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name;
    `);
    for (const s of schemasRes.rows) {
      await writeLine(`CREATE SCHEMA IF NOT EXISTS "${s.schema_name}";`);
    }
    await writeLine(``);

    // 2. Extensions
    const extRes = await client.query(`
      SELECT extname FROM pg_extension WHERE extname NOT IN ('plpgsql');
    `);
    for (const e of extRes.rows) {
      await writeLine(`CREATE EXTENSION IF NOT EXISTS "${e.extname}" WITH SCHEMA "public";`);
    }
    if (extRes.rows.length > 0) await writeLine(``);

    // 3. Custom Types / Enums
    const enumRes = await client.query(`
      SELECT n.nspname as schema_name, t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      JOIN pg_namespace n ON n.oid = t.typnamespace 
      WHERE n.nspname NOT IN ('information_schema', 'pg_catalog')
      GROUP BY n.nspname, t.typname;
    `);
    for (const en of enumRes.rows) {
      const vals = en.values.map(v => `'${v.replace(/'/g, "''")}'`).join(', ');
      await writeLine(`CREATE TYPE "${en.schema_name}"."${en.typname}" AS ENUM (${vals});`);
    }
    if (enumRes.rows.length > 0) await writeLine(``);

    // 4. Sequences
    const seqRes = await client.query(`
      SELECT sequence_schema, sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema NOT IN ('information_schema', 'pg_catalog');
    `);
    for (const seq of seqRes.rows) {
      await writeLine(`CREATE SEQUENCE IF NOT EXISTS "${seq.sequence_schema}"."${seq.sequence_name}";`);
    }
    if (seqRes.rows.length > 0) await writeLine(``);

    notify('Extracting table schemas and column definitions...', 20);

    // 5. Columns & Tables
    const allColsRes = await client.query(`
      SELECT 
        n.nspname AS schema_name,
        c.relname AS table_name,
        a.attname AS column_name,
        pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
        a.attnotnull AS not_null,
        pg_catalog.pg_get_expr(d.adbin, d.adrelid) AS default_value
      FROM pg_catalog.pg_attribute a
      JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
      JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
      LEFT JOIN pg_catalog.pg_attrdef d ON (a.attrelid, a.attnum) = (d.adrelid, d.adnum)
      WHERE n.nspname NOT IN ('information_schema', 'pg_catalog') 
        AND c.relkind = 'r' 
        AND a.attnum > 0 
        AND NOT a.attisdropped
      ORDER BY n.nspname, c.relname, a.attnum;
    `);

    const tablesMap = new Map();
    for (const row of allColsRes.rows) {
      const key = `"${row.schema_name}"."${row.table_name}"`;
      if (!tablesMap.has(key)) {
        tablesMap.set(key, { schema: row.schema_name, table: row.table_name, cols: [] });
      }
      tablesMap.get(key).cols.push(row);
    }

    for (const [key, t] of tablesMap.entries()) {
      const colDefs = t.cols.map(col => {
        let def = `    "${col.column_name}" ${col.data_type}`;
        if (col.not_null) def += ' NOT NULL';
        if (col.default_value) def += ` DEFAULT ${col.default_value}`;
        return def;
      });

      await writeLine(`-- Table: ${key}`);
      await writeLine(`CREATE TABLE IF NOT EXISTS ${key} (`);
      await writeLine(colDefs.join(',\n'));
      await writeLine(`);`);
      await writeLine(``);
    }

    notify('Extracting Primary Key & Unique Constraints...', 35);

    // 6. Constraints: Primary Key, Unique, and Check Constraints
    const allConstraintsRes = await client.query(`
      SELECT 
        n.nspname as schema_name,
        t.relname as table_name,
        c.conname,
        c.contype,
        pg_catalog.pg_get_constraintdef(c.oid, true) as def
      FROM pg_catalog.pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_namespace n ON t.relnamespace = n.oid
      WHERE n.nspname NOT IN ('information_schema', 'pg_catalog')
      ORDER BY c.contype = 'p' DESC, c.conname;
    `);

    const pkAndUnique = allConstraintsRes.rows.filter(c => c.contype === 'p' || c.contype === 'u');
    const foreignKeys = allConstraintsRes.rows.filter(c => c.contype === 'f');
    const checkConstraints = allConstraintsRes.rows.filter(c => c.contype === 'c');

    await writeLine(`-- Primary Key, Unique, and Check Constraints`);
    for (const c of pkAndUnique.concat(checkConstraints)) {
      await writeLine(`ALTER TABLE ONLY "${c.schema_name}"."${c.table_name}" ADD CONSTRAINT "${c.conname}" ${c.def};`);
    }
    await writeLine(``);

    // 7. Table Data
    await writeLine(`--`);
    await writeLine(`-- Data for tables`);
    await writeLine(`--`);
    await writeLine(``);

    let totalRecords = 0;
    const tableKeys = Array.from(tablesMap.keys());
    const totalTablesCount = tableKeys.length;

    for (let i = 0; i < totalTablesCount; i++) {
      const key = tableKeys[i];
      const pct = Math.floor(40 + ((i / totalTablesCount) * 45));
      notify(`Exporting records for ${key}... (${i + 1}/${totalTablesCount})`, pct);

      const dataRes = await client.query(`SELECT * FROM ${key};`);
      const count = dataRes.rows.length;
      totalRecords += count;

      if (count === 0) continue;

      await writeLine(`-- Data for table ${key} (${count} rows)`);
      const cols = Object.keys(dataRes.rows[0]);
      const quotedCols = cols.map(c => `"${c}"`).join(', ');

      // Dynamic batch size: single-row inserts for large binary bytea or base64 tables to conserve memory
      const hasLargeData = dataRes.rows.length > 0 && Object.values(dataRes.rows[0]).some(v => 
        Buffer.isBuffer(v) || (typeof v === 'string' && v.length > 50000)
      );
      const batchSize = hasLargeData ? 1 : 100;

      for (let b = 0; b < dataRes.rows.length; b += batchSize) {
        const batch = dataRes.rows.slice(b, b + batchSize);
        const valueTuples = batch.map(row => {
          const rowVals = cols.map(c => escapeSqlValue(row[c])).join(', ');
          return `(${rowVals})`;
        });
        writeLine(`INSERT INTO ${key} (${quotedCols}) VALUES \n${valueTuples.join(',\n')};`);
      }
      writeLine(``);
    }

    notify('Extracting indexes and foreign key relationships...', 90);

    // 8. Indexes
    const indexRes = await client.query(`
      SELECT schemaname, tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
      ORDER BY schemaname, tablename, indexname;
    `);

    const constraintNames = new Set(allConstraintsRes.rows.map(r => r.conname));
    const nonConstraintIndexes = indexRes.rows.filter(idx => !constraintNames.has(idx.indexname));

    if (nonConstraintIndexes.length > 0) {
      await writeLine(`-- Secondary Indexes`);
      for (const idx of nonConstraintIndexes) {
        await writeLine(`${idx.indexdef};`);
      }
      await writeLine(``);
    }

    // 9. Foreign Keys
    if (foreignKeys.length > 0) {
      await writeLine(`-- Foreign Key Constraints`);
      for (const fk of foreignKeys) {
        await writeLine(`ALTER TABLE ONLY "${fk.schema_name}"."${fk.table_name}" ADD CONSTRAINT "${fk.conname}" ${fk.def};`);
      }
      await writeLine(``);
    }

    // 10. Sequence syncs
    for (const seq of seqRes.rows) {
      try {
        const stateRes = await client.query(`SELECT last_value, is_called FROM "${seq.sequence_schema}"."${seq.sequence_name}";`);
        if (stateRes.rows.length > 0) {
          const s = stateRes.rows[0];
          await writeLine(`SELECT pg_catalog.setval('"${seq.sequence_schema}"."${seq.sequence_name}"', ${s.last_value}, ${s.is_called});`);
        }
      } catch (e) {}
    }

    await writeLine(`-- Dump completed on ${new Date().toISOString()}`);

    notify('Closing file stream and calculating size...', 96);

    await new Promise((resolve, reject) => {
      outStream.end(() => resolve());
      outStream.on('error', reject);
    });

    const fileStats = fs.statSync(filePath);
    const durationMs = Date.now() - startTime;

    await client.end();

    notify('Backup ready for download!', 100);

    return {
      success: true,
      token,
      fileName,
      filePath,
      fileSizeBytes: fileStats.size,
      fileSizeFormatted: `${(fileStats.size / 1024).toFixed(2)} KB`,
      totalTables: totalTablesCount,
      totalRows: totalRecords,
      durationMs,
      dbName,
      dbHost: (() => {
        try {
          return new URL(connectionString.replace(/^postgres(ql)?:/i, 'http:')).hostname || 'database-host';
        } catch (e) {
          const m = connectionString.match(/@([^:/]+)/);
          return m ? m[1] : 'database-host';
        }
      })()
    };
  } catch (err) {
    try { await client.end(); } catch (e) {}
    throw new Error(`Backup failed: ${err.message}`);
  }
}

function getBackupFile(token) {
  const filePath = path.join(BACKUPS_DIR, `${token}.sql`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return filePath;
}

module.exports = {
  inspectDatabase,
  generateBackup,
  getBackupFile
};
