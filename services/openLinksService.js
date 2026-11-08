const http = require('http');
const https = require('https');
const { recordOpenLink, getRecentLinks } = require('./neonDb');

function normalizeUrl(rawUrl) {
  let url = rawUrl.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  return url;
}

function checkUrlStatus(url) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const isHttps = parsed.protocol === 'https:';
      const client = isHttps ? https : http;
      const start = Date.now();

      const req = client.request(url, {
        method: 'HEAD',
        timeout: 6000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BenixSpaceTools/1.0 (tools.benix.space)'
        }
      }, (res) => {
        resolve({
          statusCode: res.statusCode || 200,
          latencyMs: Date.now() - start,
          statusMessage: res.statusMessage || 'OK',
          reachable: true
        });
      });

      req.on('error', () => {
        resolve({
          statusCode: 0,
          latencyMs: Date.now() - start,
          statusMessage: 'Connection unreachable',
          reachable: false
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          statusCode: 408,
          latencyMs: 6000,
          statusMessage: 'Timeout',
          reachable: false
        });
      });

      req.end();
    } catch (e) {
      resolve({
        statusCode: 400,
        latencyMs: 0,
        statusMessage: 'Invalid URL format',
        reachable: false
      });
    }
  });
}

async function processOpenLinks({ links, duration = 10, tabsCount = null, layoutMode = 'auto', clientIp }) {
  if (!links) {
    throw new Error('Please provide at least one URL to open');
  }

  const rawList = Array.isArray(links) 
    ? links 
    : String(links).split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean);

  if (rawList.length === 0) {
    throw new Error('No valid URLs found in input');
  }

  // Normalize all provided URLs
  const validUrls = [];
  for (const raw of rawList) {
    const url = normalizeUrl(raw);
    if (url && !validUrls.includes(url)) {
      validUrls.push(url);
    }
  }

  if (validUrls.length === 0) {
    throw new Error('No valid HTTP/HTTPS URLs found');
  }

  // Calculate target tabs count (supports user entering 10, 20, or custom count)
  const parsedTabsCount = parseInt(tabsCount, 10);
  const targetTabsCount = Math.max(1, Math.min(!isNaN(parsedTabsCount) && parsedTabsCount > 0 ? parsedTabsCount : validUrls.length, 100));

  const durationSec = Math.max(1, Math.min(parseInt(duration, 10) || 10, 3600));

  // Screen layout mode: Grid Only (all tabs are tiled to fit the screen independently)
  let cols = 1;
  let rows = 1;
  if (targetTabsCount === 1) {
    cols = 1; rows = 1;
  } else if (targetTabsCount === 2) {
    cols = 2; rows = 1;
  } else if (targetTabsCount === 3) {
    cols = 3; rows = 1;
  } else if (targetTabsCount === 4) {
    cols = 2; rows = 2;
  } else if (targetTabsCount <= 6) {
    cols = 3; rows = 2;
  } else if (targetTabsCount <= 8) {
    cols = 4; rows = 2;
  } else if (targetTabsCount === 9) {
    cols = 3; rows = 3;
  } else if (targetTabsCount === 10) {
    // 10 tabs: 5 columns x 2 rows
    cols = 5; rows = 2;
  } else if (targetTabsCount <= 12) {
    cols = 4; rows = 3;
  } else if (targetTabsCount <= 16) {
    cols = 4; rows = 4;
  } else if (targetTabsCount === 20) {
    // 20 tabs: 5 columns x 4 rows (fits screen small)
    cols = 5; rows = 4;
  } else if (targetTabsCount <= 25) {
    cols = 5; rows = 5;
  } else {
    cols = Math.ceil(Math.sqrt(targetTabsCount * 1.5));
    rows = Math.ceil(targetTabsCount / cols);
  }

  // Verify each unique URL health once
  const urlStatusMap = new Map();
  for (const url of validUrls) {
    const check = await checkUrlStatus(url);
    urlStatusMap.set(url, check);

    // Record into Neon PostgreSQL audit table
    await recordOpenLink({
      url,
      duration: 0,
      statusCode: check.statusCode,
      clientIp
    });
  }

  // Generate independent tabs with individual screen grid coordinates
  const tabs = [];
  const cellWPct = Math.floor(100 / cols);
  const cellHPct = Math.floor(100 / rows);

  for (let i = 0; i < targetTabsCount; i++) {
    const assignedUrl = validUrls[i % validUrls.length];
    const check = urlStatusMap.get(assignedUrl) || { statusCode: 200, reachable: true, latencyMs: 50 };

    const colIdx = i % cols;
    const rowIdx = Math.floor(i / cols);

    const posInfo = {
      type: 'grid',
      col: colIdx,
      row: rowIdx,
      cols,
      rows,
      leftPct: Math.round(colIdx * cellWPct),
      topPct: Math.round(rowIdx * cellHPct),
      widthPct: cellWPct,
      heightPct: cellHPct,
      zIndex: 1
    };

    tabs.push({
      tabId: `tab_${i + 1}_${Math.random().toString(36).substring(7)}`,
      tabNumber: i + 1,
      totalTabs: targetTabsCount,
      url: assignedUrl,
      statusCode: check.statusCode,
      statusMessage: check.statusMessage,
      latencyMs: check.latencyMs,
      reachable: check.reachable,
      layout: posInfo,
      timestamp: new Date().toISOString()
    });
  }

  return {
    success: true,
    message: `Prepared ${targetTabsCount} tab(s) in a ${cols}x${rows} screen grid. All tabs will open independently and remain open permanently.`,
    tabsCount: targetTabsCount,
    uniqueUrlsCount: validUrls.length,
    layoutMode: 'grid',
    gridDimensions: { cols, rows },
    links: tabs
  };
}

module.exports = {
  processOpenLinks,
  getRecentLinks
};
