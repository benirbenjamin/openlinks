const { useState, useEffect, useRef } = React;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0d14", color: "#f3f4f6", fontFamily: "sans-serif", padding: "2rem" }}>
          <div style={{ maxWidth: "480px", width: "100%", background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "2rem", textAlign: "center" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(239,68,68,0.15)", color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto", fontSize: "1.5rem" }}>
              ⚠️
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Something went wrong</h3>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "1.5rem", wordBreak: "break-word" }}>
              {String(this.state.error?.message || this.state.error || "An unexpected error occurred.")}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              style={{ padding: "0.6rem 1.5rem", borderRadius: "10px", background: "#38bdf8", color: "#0b0f19", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "0.9rem" }}>
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function GoogleAdSlot({ slotId = "7034214536", format = "auto", style = { display: "block" } }) {
  useEffect(() => {
    try {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch (e) {
      // AdSense push catch for local preview or blocked ad networks
    }
  }, []);

  return (
    <div className="ad-banner-wrapper">
      <span className="ad-badge">Advertisement &bull; Benix Space Ads</span>
      <ins className="adsbygoogle"
           style={style}
           data-ad-client="ca-pub-4078466828008985"
           data-ad-slot={slotId}
           data-ad-format={format}
           data-full-width-responsive="true"></ins>
    </div>
  );
}

// -------------------------------------------------------------
// The 3-Ad Video Monetization Download Gate Modal
// -------------------------------------------------------------
function DownloadGateModal({ backupData, onClose }) {
  const [adStage, setAdStage] = useState(1); // 1 = Banner 1, 2 = Video Ad, 3 = Reward Banner & Download
  const [countdown, setCountdown] = useState(6);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [downloadTriggered, setDownloadTriggered] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    let timer = null;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleStartDownload = () => {
    setDownloadTriggered(true);
    const link = document.createElement('a');
    link.href = backupData.downloadUrl;
    link.setAttribute('download', backupData.fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sampleVideoAds = [
    {
      title: "Neon Serverless Postgres Cloud",
      sponsor: "Neon Database",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      cta: "Explore Serverless Postgres",
      ctaUrl: "https://neon.tech"
    },
    {
      title: "Cloud Infrastructure & Scalable DevOps",
      sponsor: "Benix Cloud Partners",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      cta: "Deploy Faster Now",
      ctaUrl: "https://tools.benix.space"
    }
  ];

  const currentVideo = sampleVideoAds[0];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">
            <i className="fa-solid fa-cloud-arrow-down" style={{ color: "var(--accent-cyan)" }}></i>
            <span>Preparing Your Backup Download</span>
          </div>
          <div className="step-indicator">
            <span>Ads (3 Required):</span>
            <span className={`step-dot ${adStage >= 1 ? 'active' : ''}`}></span>
            <span className={`step-dot ${adStage >= 2 ? 'active' : ''}`}></span>
            <span className={`step-dot ${adStage >= 3 ? 'active' : ''}`}></span>
          </div>
        </div>

        <div className="modal-body">
          {/* Ad 1: Header Sponsored Banner (Google AdSense Slot 7034214536) */}
          <div className="ad-slot-box">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span className="ad-badge" style={{ margin: 0 }}>Ad 1 of 3 &bull; Verified Sponsor</span>
              <span style={{ fontSize: "0.75rem", color: "var(--accent-emerald)" }}>
                <i className="fa-solid fa-circle-check"></i> Verified Partner
              </span>
            </div>
            <GoogleAdSlot slotId="7034214536" />
          </div>

          {/* Ad 2: High-Impact Video Ad Player */}
          <div className="video-ad-container">
            <video 
              ref={videoRef}
              className="video-ad-player" 
              src={currentVideo.url}
              autoPlay 
              playsInline
              loop
              muted={isMuted}
            ></video>

            <div className="video-ad-overlay">
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                <span className="video-badge">
                  <i className="fa-solid fa-play"></i> Video Ad (2 of 3) &bull; {currentVideo.sponsor}
                </span>
                <button 
                  onClick={() => setIsMuted(!isMuted)} 
                  className="preset-chip" 
                  style={{ pointerEvents: "auto", background: "rgba(0,0,0,0.6)", color: "#fff" }}>
                  <i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
                </button>
              </div>

              <div className="video-countdown-banner">
                <div className="countdown-text">
                  <i className="fa-solid fa-shield-halved" style={{ color: "var(--accent-cyan)" }}></i>
                  <span>Download file unlocks in:</span>
                  <span className="countdown-highlight">{countdown}s</span>
                </div>
                <a 
                  href={currentVideo.ctaUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-secondary" 
                  style={{ padding: "0.35rem 0.8rem", fontSize: "0.75rem" }}>
                  {currentVideo.cta} <i className="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
              </div>
            </div>

            <div 
              className="video-progress-bar" 
              style={{ width: `${Math.min(100, ((6 - countdown) / 6) * 100)}%` }}></div>
          </div>

          {/* Ad 3: Reward Interstitial Confirmation */}
          <div className="reward-ad-card">
            <div>
              <span className="ad-badge" style={{ color: "var(--accent-emerald)" }}>Ad 3 of 3 &bull; Final Reward</span>
              <h4>{backupData.fileName}</h4>
              <p>Ready to save: {backupData.fileSize} &bull; {backupData.totalTables} Tables &bull; {backupData.totalRows} Records</p>
            </div>
            {countdown === 0 ? (
              <span style={{ color: "var(--accent-emerald)", fontWeight: 800, fontSize: "0.85rem" }}>
                <i className="fa-solid fa-circle-check"></i> Unlocked!
              </span>
            ) : (
              <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                <i className="fa-solid fa-lock"></i> Unlocking...
              </span>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: "0.6rem 1.2rem" }}>
            Cancel
          </button>

          {countdown === 0 ? (
            <button 
              onClick={handleStartDownload} 
              className="btn btn-primary"
              style={{ padding: "0.75rem 1.75rem", fontSize: "1rem" }}>
              <i className="fa-solid fa-download"></i> 
              {downloadTriggered ? "Download Started! Click to Re-download" : "Download SQL Backup Now"}
            </button>
          ) : (
            <button disabled className="btn btn-primary" style={{ opacity: 0.6 }}>
              <i className="fa-solid fa-spinner fa-spin"></i> Please watch ads ({countdown}s)...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Main Application Component
// -------------------------------------------------------------
function App() {
  const [activeTab, setActiveTab] = useState('postgres-dumper');
  const [stats, setStats] = useState({ totalBackups: 0, totalRowsExported: 0, totalLinksOpened: 0 });

  // Tool 1: Postgres to SQL State
  const [connectionUrl, setConnectionUrl] = useState('');
  const [inspectData, setInspectData] = useState(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState('');
  const [backupResult, setBackupResult] = useState(null);
  const [showDownloadGate, setShowDownloadGate] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Tool 2: OpenLinks State - Screen Grid Only (Permanently Opened, No Timers)
  const [linksInput, setLinksInput] = useState('');
  const [tabsCount, setTabsCount] = useState(10);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [canvasViewMode, setCanvasViewMode] = useState('screen');
  const [isOpenLinksLoading, setIsOpenLinksLoading] = useState(false);
  const [openLinksResult, setOpenLinksResult] = useState(null);
  const [linkHistory, setLinkHistory] = useState([]);
  const [openLinksMessage, setOpenLinksMessage] = useState('');
  const openedWindowsRef = useRef([]);

  // Fetch initial stats & OpenLinks history
  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {});

    fetch('/api/links/history')
      .then(r => r.json())
      .then(d => { if (d.history) setLinkHistory(d.history); })
      .catch(() => {});
  }, []);

  // Quick Preset Samples
  const handlePreset = (url) => {
    setConnectionUrl(url);
    setErrorMessage('');
  };

  // Inspect Database
  const handleInspect = async () => {
    if (!connectionUrl.trim()) {
      setErrorMessage('Please enter a valid PostgreSQL connection URL');
      return;
    }
    setErrorMessage('');
    setIsInspecting(true);
    setTerminalLogs('Connecting to PostgreSQL database to inspect structure...\n');

    try {
      const res = await fetch('/api/database/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: connectionUrl.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Connection failed');
      }
      setInspectData(data);
      setTerminalLogs(prev => prev + `[SUCCESS] Connected to ${data.database}!\nTotal Tables: ${data.totalTables}\nTotal Records: ${data.totalRows}\nPostgres Version: ${data.version}\n`);
    } catch (e) {
      setErrorMessage(e.message);
      setTerminalLogs(prev => prev + `[ERROR] ${e.message}\n`);
    } finally {
      setIsInspecting(false);
    }
  };

  // Generate Backup
  const handleExport = async () => {
    if (!connectionUrl.trim()) {
      setErrorMessage('Please enter a PostgreSQL connection URL');
      return;
    }
    setErrorMessage('');
    setIsExporting(true);
    setTerminalLogs('Starting full database export...\n');

    try {
      setTerminalLogs(prev => prev + 'Extracting extensions, sequences, tables, constraints, records, and indexes...\n');
      const res = await fetch('/api/database/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: connectionUrl.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to export backup');
      }

      setBackupResult(data);
      setTerminalLogs(prev => prev + `\n[COMPLETED] Backup generated: ${data.fileName}\nSize: ${data.fileSize} (${data.totalTables} tables, ${data.totalRows} rows)\nReady for download!\n`);
      setShowDownloadGate(true); // Open the 3-ad monetization gate
    } catch (e) {
      setErrorMessage(e.message);
      setTerminalLogs(prev => prev + `[ERROR] ${e.message}\n`);
    } finally {
      setIsExporting(false);
    }
  };

  // Close all opened popup windows
  const closeAllOpenedTabs = () => {
    if (openedWindowsRef.current && openedWindowsRef.current.length > 0) {
      openedWindowsRef.current.forEach(win => {
        try {
          if (win && !win.closed) {
            win.close();
          }
        } catch (e) {}
      });
      openedWindowsRef.current = [];
    }
  };

  // Launch independent browser tabs/windows fitting screen grid
  // Tabs remain OPEN permanently (NO auto-close timers!)
  const launchTabsInScreen = (linksList, gridDims) => {
    setPopupBlocked(false);

    const screenW = window.screen.availWidth || window.innerWidth || 1920;
    const screenH = window.screen.availHeight || window.innerHeight || 1080;
    const count = linksList.length;

    // Determine grid columns and rows (default 10 -> 5x2, 20 -> 5x4)
    const cols = (gridDims && gridDims.cols) || (count === 20 ? 5 : (count === 10 ? 5 : Math.ceil(Math.sqrt(count * 1.5))));
    const rows = (gridDims && gridDims.rows) || Math.ceil(count / cols);

    const winW = Math.max(220, Math.floor(screenW / cols));
    const winH = Math.max(160, Math.floor(screenH / rows));

    // Stagger opening each window independently to prevent browser pop-up suppression
    linksList.forEach((item, index) => {
      setTimeout(() => {
        const colIdx = (item.layout && item.layout.col !== undefined) ? item.layout.col : (index % cols);
        const rowIdx = (item.layout && item.layout.row !== undefined) ? item.layout.row : Math.floor(index / cols);
        const left = colIdx * winW;
        const top = rowIdx * winH;
        const features = `width=${winW},height=${winH},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes,toolbar=yes`;

        try {
          const win = window.open(item.url, `_blank`, features);
          if (!win || win.closed || typeof win.closed === 'undefined') {
            setPopupBlocked(true);
          } else {
            openedWindowsRef.current.push(win);
            // NOTE: TABS REMAIN OPEN PERMANENTLY! No auto-close timer!
          }
        } catch (e) {
          setPopupBlocked(true);
        }
      }, index * 120);
    });
  };

  // OpenLinks execution
  const handleOpenLinksSubmit = async (e) => {
    e.preventDefault();
    if (!linksInput.trim()) return;

    setIsOpenLinksLoading(true);
    setOpenLinksMessage('');
    setPopupBlocked(false);

    try {
      const res = await fetch('/api/links/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          links: linksInput, 
          tabsCount: parseInt(tabsCount, 10),
          layoutMode: 'grid'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Error processing links');
      }

      setOpenLinksResult(data);
      setOpenLinksMessage(data.message);

      // Launch independent tabs in screen grid (permanently opened)
      launchTabsInScreen(data.links, data.gridDimensions);

      // Refresh link history from Neon PostgreSQL
      fetch('/api/links/history')
        .then(r => r.json())
        .then(d => { if (d.history) setLinkHistory(d.history); });

    } catch (err) {
      setOpenLinksMessage(`Error: ${err.message}`);
    } finally {
      setIsOpenLinksLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-mesh"></div>

      {/* Header */}
      <header className="header">
        <div className="container nav-wrap">
          <a href="/" className="logo-area">
            <div className="logo-icon">
              <i className="fa-solid fa-cube"></i>
            </div>
            <div className="logo-text">
              <h1>BenixSpaceTools</h1>
            </div>
            <span className="domain-pill">tools.benix.space</span>
          </a>

          <nav className="nav-links">
            <button 
              className={`nav-btn ${activeTab === 'postgres-dumper' ? 'active' : ''}`}
              onClick={() => setActiveTab('postgres-dumper')}>
              <i className="fa-solid fa-database"></i> PostgreSQL to SQL
            </button>
            <button 
              className={`nav-btn ${activeTab === 'openlinks' ? 'active' : ''}`}
              onClick={() => setActiveTab('openlinks')}>
              <i className="fa-solid fa-up-right-from-square"></i> OpenLinks
            </button>
            <button 
              className={`nav-btn ${activeTab === 'tools-directory' ? 'active' : ''}`}
              onClick={() => setActiveTab('tools-directory')}>
              <i className="fa-solid fa-shapes"></i> All Tools
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge">
            <i className="fa-solid fa-bolt"></i> Free High-Performance Developer Suite
          </div>
          <h2 className="hero-title">
            Download <span>PostgreSQL Databases to SQL</span> &amp; Open Links
          </h2>
          <p className="hero-desc">
            Instantly export complete PostgreSQL database dumps from any connection URL. Integrated with the <strong>OpenLinks</strong> multi-URL automated viewer. Safe, fast, and 100% cloud compatible.
          </p>

          {/* Stats Bar */}
          <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent-cyan)" }}>
                {(stats?.totalBackups ?? 0).toLocaleString()}+
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "0.4rem" }}>
                Databases Dumped
              </span>
            </div>
            <div>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent-emerald)" }}>
                {(((stats?.totalRowsExported ?? 0)) / 1000).toFixed(0)}k+
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "0.4rem" }}>
                Records Exported
              </span>
            </div>
            <div>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent-purple)" }}>
                {(stats?.totalLinksOpened ?? 0).toLocaleString()}+
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "0.4rem" }}>
                Links Opened
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Top Google AdSense Banner Slot */}
      <div className="container">
        <GoogleAdSlot slotId="7034214536" />
      </div>

      {/* Main Container */}
      <main className="container">
        {/* Tool Navigation Bar */}
        <div className="tool-tabs-bar">
          <button 
            className={`tool-tab-btn ${activeTab === 'postgres-dumper' ? 'active' : ''}`}
            onClick={() => setActiveTab('postgres-dumper')}>
            <i className="fa-solid fa-database"></i> PostgreSQL to SQL Downloader
          </button>
          <button 
            className={`tool-tab-btn ${activeTab === 'openlinks' ? 'active' : ''}`}
            onClick={() => setActiveTab('openlinks')}>
            <i className="fa-solid fa-globe"></i> OpenLinks Timed Viewer
          </button>
          <button 
            className={`tool-tab-btn ${activeTab === 'tools-directory' ? 'active' : ''}`}
            onClick={() => setActiveTab('tools-directory')}>
            <i className="fa-solid fa-grid-2"></i> Developer Tools Directory
          </button>
        </div>

        {/* -------------------------------------------------------------
            TAB 1: POSTGRESQL DATABASE TO SQL DOWNLOADER
           ------------------------------------------------------------- */}
        {activeTab === 'postgres-dumper' && (
          <div className="tool-card">
            <div className="tool-header">
              <h3 className="tool-title">
                <i className="fa-solid fa-server" style={{ color: "var(--accent-blue)" }}></i>
                PostgreSQL Database URL to SQL Backup File
              </h3>
              <p className="tool-subtitle">
                Paste any PostgreSQL connection URL (Neon, Supabase, Prisma, Railway, AWS RDS, Render, or Docker). The tool will connect securely, extract all DDL, tables, constraints, sequences, enums, and data, then package a self-contained <code>.sql</code> file for download.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>PostgreSQL Connection String:</span>
                <span style={{ fontSize: "0.75rem", color: "var(--accent-cyan)" }}>
                  <i className="fa-solid fa-lock"></i> Zero Credential Storage &bull; Processed In Memory
                </span>
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="postgresql://user:password@ep-host.aws.neon.tech/neondb?sslmode=require"
                value={connectionUrl}
                onChange={(e) => setConnectionUrl(e.target.value)}
              />

              {/* Sample Presets */}
              <div className="sample-presets">
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Format examples:</span>
                <button 
                  className="preset-chip"
                  onClick={() => handlePreset('postgresql://neondb_owner:password@ep-cool-sample.us-east-2.aws.neon.tech/neondb?sslmode=require')}>
                  Neon Serverless
                </button>
                <button 
                  className="preset-chip"
                  onClick={() => handlePreset('postgresql://postgres:password@db.supabase.co:5432/postgres')}>
                  Supabase
                </button>
                <button 
                  className="preset-chip"
                  onClick={() => handlePreset('postgres://user:password@pooled.db.prisma.io:5432/postgres?sslmode=require')}>
                  Prisma Postgres
                </button>
                <button 
                  className="preset-chip"
                  onClick={() => handlePreset('postgresql://postgres:postgres@localhost:5432/my_database')}>
                  Localhost Docker
                </button>
              </div>
            </div>

            {errorMessage && (
              <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", color: "#fca5a5", marginBottom: "1rem", fontSize: "0.9rem" }}>
                <i className="fa-solid fa-triangle-exclamation"></i> {errorMessage}
              </div>
            )}

            <div className="button-row">
              <button 
                onClick={handleInspect} 
                disabled={isInspecting || isExporting} 
                className="btn btn-secondary">
                <i className={`fa-solid ${isInspecting ? 'fa-spinner fa-spin' : 'fa-magnifying-glass'}`}></i>
                {isInspecting ? 'Inspecting Database...' : 'Inspect & Count Tables'}
              </button>

              <button 
                onClick={handleExport} 
                disabled={isInspecting || isExporting} 
                className="btn btn-primary">
                <i className={`fa-solid ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-arrow-down'}`}></i>
                {isExporting ? 'Exporting SQL Backup...' : 'Generate & Download SQL File'}
              </button>
            </div>

            {/* Live Terminal Output */}
            {terminalLogs && (
              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <span className="terminal-dot dot-red"></span>
                    <span className="terminal-dot dot-yellow"></span>
                    <span className="terminal-dot dot-green"></span>
                  </div>
                  <span>PostgreSQL Backup Console &bull; tools.benix.space</span>
                </div>
                <div className="terminal-body">{terminalLogs}</div>
              </div>
            )}

            {/* Inspection Results Card */}
            {inspectData && (
              <div className="inspector-card">
                <div className="stats-grid">
                  <div className="stat-box">
                    <div className="stat-value">{inspectData.database || 'Database'}</div>
                    <div className="stat-label">Database Name</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value">{inspectData.totalTables ?? inspectData.tableCount ?? (inspectData.tables ? inspectData.tables.length : 0)}</div>
                    <div className="stat-label">Total Tables</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value">{(inspectData.totalRows ?? 0).toLocaleString()}</div>
                    <div className="stat-label">Total Records</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value">{inspectData.schemas ? inspectData.schemas.length : 1}</div>
                    <div className="stat-label">Schemas ({Array.isArray(inspectData.schemas) ? inspectData.schemas.join(', ') : 'public'})</div>
                  </div>
                </div>

                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--text-secondary)" }}>
                  Discovered Tables &amp; Record Counts:
                </h4>
                <div className="table-list-scroll">
                  {(inspectData.tables || []).map((t, idx) => (
                    <div key={idx} className="table-item">
                      <span>{t.fullName || (t.schema && t.table_name ? `${t.schema}.${t.table_name}` : (t.table_name || `table_${idx+1}`))}</span>
                      <span className="row-badge">{(t.rowCount !== undefined ? t.rowCount : (t.column_count !== undefined ? `${t.column_count} cols` : 0)).toLocaleString()} {t.rowCount !== undefined ? 'rows' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 2: OPENLINKS SYSTEM (Screen Grid Only - Permanent Tabs)
           ------------------------------------------------------------- */}
        {activeTab === 'openlinks' && (
          <div className="tool-card">
            <div className="tool-header">
              <h3 className="tool-title">
                <i className="fa-solid fa-table-cells" style={{ color: "var(--accent-cyan)" }}></i>
                OpenLinks &bull; Multi-URL Opener in Screen Grid
              </h3>
              <p className="tool-subtitle">
                Launch any number of links in an organized screen-fitting grid. Enter your tab count (e.g. 10 tabs, 20 tabs) and all independent windows will open across your display and stay open permanently (no auto-close timers).
              </p>
            </div>

            <form onSubmit={handleOpenLinksSubmit}>
              {/* Tabs Count & Screen Grid Box */}
              <div className="tabs-count-box">
                <div className="tabs-count-header">
                  <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>
                    <i className="fa-solid fa-table-cells-large" style={{ color: "var(--accent-cyan)", marginRight: "0.5rem" }}></i>
                    Tabs Count to Fit in Screen Grid:
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input 
                      type="number" 
                      min="1" 
                      max="100" 
                      value={tabsCount}
                      onChange={(e) => setTabsCount(e.target.value)}
                      className="tabs-count-input"
                    />
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Tabs</span>
                  </div>
                </div>

                {/* Preset Chips */}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  <button 
                    type="button" 
                    className={`preset-chip ${parseInt(tabsCount, 10) === 4 ? 'active' : ''}`}
                    onClick={() => setTabsCount(4)}>
                    <i className="fa-solid fa-border-all"></i> 4 Tabs (2x2 Quad)
                  </button>
                  <button 
                    type="button" 
                    className={`preset-chip ${parseInt(tabsCount, 10) === 6 ? 'active' : ''}`}
                    onClick={() => setTabsCount(6)}>
                    6 Tabs (3x2 Grid)
                  </button>
                  <button 
                    type="button" 
                    className={`preset-chip ${parseInt(tabsCount, 10) === 10 ? 'active' : ''}`}
                    onClick={() => setTabsCount(10)}>
                    <i className="fa-solid fa-table-cells"></i> 10 Tabs Grid (5x2 Screen Grid)
                  </button>
                  <button 
                    type="button" 
                    className={`preset-chip ${parseInt(tabsCount, 10) === 20 ? 'active' : ''}`}
                    onClick={() => setTabsCount(20)}>
                    <i className="fa-solid fa-table-cells"></i> 20 Tabs Grid (5x4 Small Screen Grid)
                  </button>
                  <button 
                    type="button" 
                    className={`preset-chip ${parseInt(tabsCount, 10) === 30 ? 'active' : ''}`}
                    onClick={() => setTabsCount(30)}>
                    30 Tabs (6x5 Grid)
                  </button>
                  <button 
                    type="button" 
                    className={`preset-chip ${parseInt(tabsCount, 10) === 50 ? 'active' : ''}`}
                    onClick={() => setTabsCount(50)}>
                    50 Tabs (Mega Grid)
                  </button>
                </div>

                <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--accent-emerald)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <i className="fa-solid fa-circle-check"></i>
                  <span>Grid Only Layout &bull; All windows fit the screen and remain open permanently (no auto-closing).</span>
                </div>
              </div>

              {/* Links Input */}
              <div className="form-group">
                <label className="form-label">
                  <span>Enter Links (one per line):</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Auto-cycles links to fill your chosen tabs count</span>
                </label>
                <textarea 
                  className="form-textarea" 
                  rows="4" 
                  placeholder="https://benix.space&#10;https://tools.benix.space&#10;https://github.com/benirbenjamin/openlinks"
                  value={linksInput}
                  onChange={(e) => setLinksInput(e.target.value)}
                  required></textarea>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                  <button 
                    type="button"
                    className="preset-chip"
                    onClick={() => setLinksInput("https://benix.space\nhttps://tools.benix.space\nhttps://github.com/benirbenjamin/openlinks")}>
                    Load Benix Space Sample Links
                  </button>
                  <button 
                    type="button"
                    className="preset-chip"
                    onClick={() => setLinksInput("https://news.ycombinator.com\nhttps://github.com\nhttps://developer.mozilla.org\nhttps://neon.tech")}>
                    Load Dev Portals
                  </button>
                </div>
              </div>

              <div className="button-row">
                <button 
                  type="submit" 
                  disabled={isOpenLinksLoading} 
                  className="btn btn-primary"
                  style={{ flex: 2 }}>
                  <i className={`fa-solid ${isOpenLinksLoading ? 'fa-spinner fa-spin' : 'fa-rocket'}`}></i>
                  {isOpenLinksLoading ? 'Verifying & Opening Screen Grid...' : `Open ${tabsCount} Tabs in Screen Grid (Permanent)`}
                </button>

                {openedWindowsRef.current.length > 0 && (
                  <button 
                    type="button" 
                    onClick={closeAllOpenedTabs}
                    className="btn btn-secondary"
                    style={{ borderColor: "var(--accent-rose)", color: "#fca5a5" }}>
                    <i className="fa-solid fa-rectangle-xmark"></i> Close All Opened Tabs ({openedWindowsRef.current.length})
                  </button>
                )}
              </div>
            </form>

            {/* Popup Blocker Notice */}
            {popupBlocked && (
              <div className="popup-notice-banner">
                <i className="fa-solid fa-shield-virus" style={{ fontSize: "1.4rem", color: "var(--accent-amber)" }}></i>
                <div style={{ flex: 1 }}>
                  <strong>Browser Pop-up Blocker Detected!</strong>
                  <div style={{ fontSize: "0.8rem", marginTop: "0.2rem" }}>
                    To open {tabsCount} independent tabs tiled in a grid across your screen, please click the <strong>Pop-up blocked</strong> icon in your browser address bar and select <em>"Always allow pop-ups and redirects from tools.benix.space"</em>.
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => openLinksResult && launchTabsInScreen(openLinksResult.links, openLinksResult.gridDimensions)} 
                  className="btn btn-primary" 
                  style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                  <i className="fa-solid fa-arrow-rotate-right"></i> Retry Launch
                </button>
              </div>
            )}

            {openLinksMessage && (
              <div style={{ marginTop: "1.5rem", padding: "0.85rem 1rem", borderRadius: "var(--radius-md)", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "var(--accent-emerald)" }}>
                <i className="fa-solid fa-circle-check"></i> {openLinksMessage}
              </div>
            )}

            {/* Screen Fit Canvas Viewer */}
            {openLinksResult && openLinksResult.links && (
              <div className="screen-canvas-wrapper">
                <div className="screen-canvas-topbar">
                  <div className="screen-canvas-title">
                    <i className="fa-solid fa-display" style={{ color: "var(--accent-cyan)" }}></i>
                    <span>
                      Screen Grid Canvas &bull; {openLinksResult.tabsCount} Independent Tabs ({openLinksResult.gridDimensions ? `${openLinksResult.gridDimensions.cols} cols x ${openLinksResult.gridDimensions.rows} rows` : 'Grid Fitted'})
                    </span>
                  </div>
                  <div className="screen-canvas-actions">
                    <button 
                      type="button"
                      className={`layout-pill-btn ${canvasViewMode === 'screen' ? 'active' : ''}`}
                      onClick={() => setCanvasViewMode('screen')}>
                      <i className="fa-solid fa-table-cells"></i> Grid View
                    </button>
                    <button 
                      type="button"
                      className={`layout-pill-btn ${canvasViewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setCanvasViewMode('list')}>
                      <i className="fa-solid fa-list-ul"></i> List View
                    </button>
                    <button 
                      type="button"
                      className="layout-pill-btn"
                      onClick={() => launchTabsInScreen(openLinksResult.links, openLinksResult.gridDimensions)}>
                      <i className="fa-solid fa-arrow-up-right-from-square"></i> Re-Launch Grid
                    </button>
                  </div>
                </div>

                <div className="screen-canvas-body">
                  {canvasViewMode === 'screen' ? (
                    <div 
                      className="grid-canvas-layout" 
                      style={{ 
                        gridTemplateColumns: `repeat(${openLinksResult.gridDimensions ? openLinksResult.gridDimensions.cols : 5}, minmax(170px, 1fr))` 
                      }}>
                      {openLinksResult.links.map((item, idx) => (
                        <div 
                          key={item.tabId || idx} 
                          className="grid-card-small"
                          onClick={() => window.open(item.url, '_blank')}
                          title={`Click to open/focus: ${item.url}`}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="grid-card-small-header">
                            <span className="grid-card-num">#{item.tabNumber}</span>
                            <span className="grid-coord-pill">
                              R{(item.layout && item.layout.row !== undefined ? item.layout.row : Math.floor(idx / (openLinksResult.gridDimensions ? openLinksResult.gridDimensions.cols : 5))) + 1} : C{(item.layout && item.layout.col !== undefined ? item.layout.col : (idx % (openLinksResult.gridDimensions ? openLinksResult.gridDimensions.cols : 5))) + 1}
                            </span>
                            <span className="row-badge" style={{ padding: "0.1rem 0.35rem", fontSize: "0.65rem", background: item.reachable ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)", color: item.reachable ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                              {item.statusCode || 200}
                            </span>
                          </div>
                          <span className="grid-card-url" style={{ fontWeight: 600, color: "var(--accent-cyan)", marginBottom: "0.15rem" }}>
                            {new URL(item.url).hostname}
                          </span>
                          <span className="grid-card-url">{item.url}</span>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "auto" }}>
                            <span><i className="fa-solid fa-gauge-high"></i> {item.latencyMs || 40}ms</span>
                            <span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>
                              Launch <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Detailed List View */
                    <div className="table-list-scroll">
                      {openLinksResult.links.map((item, idx) => (
                        <div key={idx} className="table-item">
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflow: "hidden" }}>
                            <span className="grid-card-num">#{item.tabNumber}</span>
                            <span className="grid-coord-pill">
                              R{(item.layout && item.layout.row !== undefined ? item.layout.row : 0) + 1}:C{(item.layout && item.layout.col !== undefined ? item.layout.col : 0) + 1}
                            </span>
                            <a href={item.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent-cyan)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.url}
                            </a>
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {item.latencyMs || 40}ms
                            </span>
                            <span className="row-badge" style={{ background: item.reachable ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)", color: item.reachable ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                              {item.statusCode || '200'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent History from Neon DB */}
            {linkHistory && linkHistory.length > 0 && (
              <div style={{ marginTop: "2.5rem" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--text-secondary)" }}>
                  <i className="fa-solid fa-clock-rotate-left"></i> Recent Links Audited in Neon Database:
                </h4>
                <div className="table-list-scroll">
                  {linkHistory.map((item, idx) => (
                    <div key={idx} className="table-item">
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>
                        {item.url}
                      </span>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {item.created_at ? new Date(item.created_at).toLocaleTimeString() : ''}
                        </span>
                        <span className="row-badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--accent-emerald)" }}>
                          <i className="fa-solid fa-check"></i> Audited
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 3: TOOLS DIRECTORY (Expandable Suite)
           ------------------------------------------------------------- */}
        {activeTab === 'tools-directory' && (
          <div>
            <div className="section-title">Developer Tools Directory</div>
            <p className="section-subtitle">
              BenixSpaceTools is an expanding suite of free developer and web utilities. We add new tools regularly.
            </p>

            <div className="tools-grid">
              <div className="tool-grid-card" onClick={() => setActiveTab('postgres-dumper')}>
                <div>
                  <span className="tool-badge-pill badge-active">Active</span>
                  <h4 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                    PostgreSQL to SQL Downloader
                  </h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Paste your PostgreSQL connection string and export complete .sql backup files with all schemas, tables, constraints, sequences, and records.
                  </p>
                </div>
                <div style={{ marginTop: "1rem", color: "var(--accent-cyan)", fontSize: "0.85rem", fontWeight: 700 }}>
                  Launch Tool <i className="fa-solid fa-arrow-right"></i>
                </div>
              </div>

              <div className="tool-grid-card" onClick={() => setActiveTab('openlinks')}>
                <div>
                  <span className="tool-badge-pill badge-active">Active &bull; Powered by OpenLinks</span>
                  <h4 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                    OpenLinks Multi-URL Opener
                  </h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Launch and automate visiting links with custom viewing durations, response code verification, and session history stored in Neon.
                  </p>
                </div>
                <div style={{ marginTop: "1rem", color: "var(--accent-cyan)", fontSize: "0.85rem", fontWeight: 700 }}>
                  Launch Tool <i className="fa-solid fa-arrow-right"></i>
                </div>
              </div>

              <div className="tool-grid-card">
                <div>
                  <span className="tool-badge-pill badge-upcoming">Coming Soon</span>
                  <h4 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                    PostgreSQL to MySQL Converter
                  </h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Convert PostgreSQL dumps containing UUIDs, JSONB, bytea, and arrays into 100% MySQL InnoDB compatible SQL files.
                  </p>
                </div>
                <div style={{ marginTop: "1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  In Development
                </div>
              </div>

              <div className="tool-grid-card">
                <div>
                  <span className="tool-badge-pill badge-upcoming">Coming Soon</span>
                  <h4 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                    SQL Query Beautifier &amp; Formatter
                  </h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Instant indentation, keyword capitalization, and syntax formatting for complex SQL statements.
                  </p>
                </div>
                <div style={{ marginTop: "1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  In Development
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mid-Page In-Feed Monetization Ad */}
        <GoogleAdSlot slotId="7034214536" />

        {/* SEO & Technical FAQ Section */}
        <section style={{ margin: "4rem 0" }}>
          <h3 className="section-title">Frequently Asked Questions</h3>
          <p className="section-subtitle">
            Everything you need to know about exporting PostgreSQL databases and using BenixSpaceTools.
          </p>

          <div className="faq-list">
            <div className="faq-item">
              <div className="faq-question">
                <i className="fa-solid fa-circle-question" style={{ color: "var(--accent-cyan)", marginRight: "0.5rem" }}></i>
                How do I backup a PostgreSQL database using a connection URL?
              </div>
              <div className="faq-answer">
                Simply paste your standard PostgreSQL connection string (formatted as <code>postgresql://user:password@host:5432/dbname?sslmode=require</code>) into the input field above. BenixSpaceTools connects via secure SSL, extracts table definitions, sequences, enums, constraints, and data rows, and compiles them into a clean <code>.sql</code> script ready for download.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question">
                <i className="fa-solid fa-circle-question" style={{ color: "var(--accent-cyan)", marginRight: "0.5rem" }}></i>
                Does it support Neon, Supabase, Prisma, and Railway?
              </div>
              <div className="faq-answer">
                Yes! BenixSpaceTools is designed to work with all popular PostgreSQL providers, including Neon Serverless, Supabase, Prisma Postgres, Railway, Render, AWS RDS, DigitalOcean, and local Docker containers.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question">
                <i className="fa-solid fa-circle-question" style={{ color: "var(--accent-cyan)", marginRight: "0.5rem" }}></i>
                What is the OpenLinks Screen Grid system?
              </div>
              <div className="faq-answer">
                Integrated from the open-source project <a href="https://github.com/benirbenjamin/openlinks" target="_blank" rel="noreferrer" style={{ color: "var(--accent-cyan)" }}>benirbenjamin/openlinks</a>, OpenLinks allows you to input URLs and specify your desired tab count. The tool calculates an organized screen-fitting grid (such as a 5&times;2 grid for 10 tabs, or 5&times;4 for 20 tabs) and opens each tab independently across your display, leaving all tabs open permanently without any auto-close timers.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question">
                <i className="fa-solid fa-circle-question" style={{ color: "var(--accent-cyan)", marginRight: "0.5rem" }}></i>
                Are my database credentials stored or logged?
              </div>
              <div className="faq-answer">
                No. Your database credentials are used strictly in memory during the execution of your backup session and are never written to disk or database logs. Only high-level anonymized metadata (such as database name, table count, and row count) is audited.
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* The 3-Ad Video Monetization Download Gate Modal */}
      {showDownloadGate && backupResult && (
        <DownloadGateModal 
          backupData={backupResult} 
          onClose={() => setShowDownloadGate(false)} 
        />
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-links">
            <a href="/">Home</a>
            <a href="/#postgres-dumper">Postgres to SQL</a>
            <a href="/#openlinks">OpenLinks</a>
            <a href="/#tools-directory">Tool Directory</a>
            <a href="/sitemap.xml" target="_blank">Sitemap</a>
            <a href="/robots.txt" target="_blank">Robots.txt</a>
          </div>
          <p>&copy; {new Date().getFullYear()} BenixSpaceTools &bull; <a href="https://tools.benix.space" style={{ color: "var(--accent-cyan)", textDecoration: "none" }}>tools.benix.space</a> &bull; Powered by Benix Space &bull; All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
