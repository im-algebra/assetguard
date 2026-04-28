// AssetGuard — Digital Rights Protection System
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import {
  ShieldCheck, Search, FileVideo, FileImage, AlertTriangle,
  CheckCircle, Plus, RefreshCw, LayoutDashboard, BarChart3,
  ExternalLink, ShieldAlert, Globe, Trash2, User, Key, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL || '/api';

// ─── Fade animation preset ───
const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.35 }
};

// ─── GSAP hook for login page ───
function useLoginAnimation(loggedIn) {
  const loginRef = useRef(null);

  useLayoutEffect(() => {
    if (loggedIn || !loginRef.current) return undefined;

    const ctx = gsap.context(() => {
      gsap.set('.login-bg-icon', { autoAlpha: 0, scale: 0, rotation: -180 });
      gsap.set('.login-card', { autoAlpha: 0, y: 40, scale: 0.95 });
      gsap.set('.login-shield', { autoAlpha: 0, rotationY: 720 });
      gsap.set('.login-title', { autoAlpha: 0, y: 15 });
      gsap.set('.login-subtitle', { autoAlpha: 0, y: 10 });
      gsap.set('.login-field', { autoAlpha: 0, x: -20 });
      gsap.set('.login-btn', { autoAlpha: 0, y: 15 });

      const tl = gsap.timeline({ delay: 0.15 });
      tl.to('.login-bg-icon', { autoAlpha: 0.08, scale: 1, rotation: 0, duration: 0.8, stagger: 0.1, ease: 'back.out(1.7)', clearProps: 'transform,visibility' })
        .to('.login-card', { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out', clearProps: 'transform,visibility' }, '-=0.45')
        .to('.login-shield', { autoAlpha: 1, rotationY: 0, duration: 1, ease: 'power2.out', clearProps: 'transform,visibility' }, '-=0.4')
        .to('.login-title', { autoAlpha: 1, y: 0, duration: 0.4, clearProps: 'transform,visibility' }, '-=0.3')
        .to('.login-subtitle', { autoAlpha: 1, y: 0, duration: 0.3, clearProps: 'transform,visibility' }, '-=0.2')
        .to('.login-field', { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.1, clearProps: 'transform,visibility' }, '-=0.2')
        .to('.login-btn', { autoAlpha: 1, y: 0, duration: 0.4, clearProps: 'transform,visibility' }, '-=0.1');
    }, loginRef);

    return () => ctx.revert();
  }, [loggedIn]);

  return loginRef;
}

// ─── GSAP hook for main app ───
function useAppAnimation(loggedIn, tab) {
  const appRef = useRef(null);

  useLayoutEffect(() => {
    if (!loggedIn || !appRef.current) return undefined;

    const ctx = gsap.context(() => {
      gsap.killTweensOf(['.app-header', '.app-nav-btn']);
      gsap.set(['.app-header', '.app-nav-btn'], { clearProps: 'all', autoAlpha: 1 });

      gsap.from('.app-header', {
        opacity: 0,
        y: -20,
        duration: 0.5,
        ease: 'power3.out',
        onComplete: () => gsap.set('.app-header', { clearProps: 'all' })
      });
      gsap.from('.app-nav-btn', {
        opacity: 0,
        y: 10,
        duration: 0.3,
        stagger: 0.08,
        delay: 0.2,
        ease: 'back.out(1.5)',
        onComplete: () => gsap.set('.app-nav-btn', { clearProps: 'all' })
      });
    }, appRef);

    return () => ctx.revert();
  }, [loggedIn]);

  useLayoutEffect(() => {
    if (!loggedIn || !appRef.current) return undefined;

    const ctx = gsap.context(() => {
      gsap.killTweensOf(['.stat-card', '.content-section']);
      gsap.set(['.stat-card', '.content-section'], { clearProps: 'all', autoAlpha: 1 });

      gsap.from('.content-section', {
        opacity: 0,
        y: 20,
        duration: 0.45,
        ease: 'power2.out',
        onComplete: () => gsap.set('.content-section', { clearProps: 'all' })
      });
      gsap.from('.stat-card', {
        opacity: 0,
        y: 15,
        scale: 0.98,
        duration: 0.4,
        stagger: 0.08,
        delay: 0.1,
        ease: 'power2.out',
        onComplete: () => gsap.set('.stat-card', { clearProps: 'all' })
      });
    }, appRef);

    return () => ctx.revert();
  }, [loggedIn, tab]);

  return appRef;
}

function App() {
  // ── Auth State & Persistence ──
  const [loggedIn, setLoggedIn] = useState(false);
  const [creds, setCreds] = useState({ username: '', password: '' });


  // ── App State ──
  const [assets, setAssets] = useState([]);
  const [stats, setStats] = useState({
    total_assets: 0, total_detections: 0,
    high_risk_count: 0, platform_distribution: {}, recent_alerts: []
  });
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanPreview, setScanPreview] = useState(null);
  const [scanType, setScanType] = useState(null);
  const [tab, setTab] = useState('dashboard');

  // ── GSAP Animation Hooks ──
  const loginRef = useLoginAnimation(loggedIn);
  const appRef = useAppAnimation(loggedIn, tab);

  useEffect(() => { if (loggedIn) { fetchAssets(); fetchStats(); } }, [loggedIn]);

  // ── API Calls ──
  const fetchAssets = async () => {
    try { setAssets((await axios.get(`${API}/assets`)).data); } catch (e) { console.error(e); }
  };
  const fetchStats = async () => {
    try { setStats((await axios.get(`${API}/stats`)).data); } catch (e) { console.error(e); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    setUploading(true);
    try { await axios.post(`${API}/upload`, fd); fetchAssets(); fetchStats(); }
    catch (err) { alert("Upload failed: " + (err.response?.data?.error || err.message)); }
    finally { setUploading(false); }
  };

  const handleScan = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setScanPreview(URL.createObjectURL(file));
    setScanType(file.type);
    const fd = new FormData(); fd.append('file', file);
    setScanning(true); setScanResult(null);
    try { setScanResult((await axios.post(`${API}/compare`, fd)).data); fetchStats(); }
    catch (err) { alert("Scan failed: " + (err.response?.data?.error || err.message)); }
    finally { setScanning(false); }
  };

  const handleDeleteAsset = async (filename) => {
    if (!confirm(`Remove "${filename}" from protection?`)) return;
    try { await axios.delete(`${API}/assets/${filename}`); fetchAssets(); fetchStats(); }
    catch (err) { alert(err.response?.data?.error || err.message); }
  };

  const handleDeleteDetection = async (id) => {
    if (!confirm("Remove this detection record?")) return;
    try { await axios.delete(`${API}/detections/${id}`); fetchStats(); }
    catch (err) { alert(err.response?.data?.error || err.message); }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (creds.username === 'admin' && creds.password === 'assetguard2026') setLoggedIn(true);
    else alert("Invalid credentials. Use admin / assetguard2026");
  };

  if (!loggedIn) return (
    <div ref={loginRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[
          { Icon: ShieldCheck, x: '12%', y: '15%' },
          { Icon: Globe, x: '82%', y: '20%' },
          { Icon: Search, x: '8%', y: '75%' },
          { Icon: ShieldAlert, x: '85%', y: '70%' },
          { Icon: AlertTriangle, x: '50%', y: '85%' },
          { Icon: ExternalLink, x: '70%', y: '10%' },
        ].map((item, i) => (
          <div key={i} className="login-bg-icon" style={{ position: 'absolute', left: item.x, top: item.y, opacity: 0.08 }}>
            <item.Icon size={56} strokeWidth={1} />
          </div>
        ))}
      </div>

      <div className="glass-elevated login-card" style={{ maxWidth: 400, width: '100%', padding: '2.5rem', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="login-shield glow-pulse" style={{ display: 'inline-flex', background: 'var(--blue)', padding: 14, borderRadius: 16, marginBottom: 16 }}>
            <ShieldCheck size={40} color="white" />
          </div>
          <h1 className="login-title" style={{ fontSize: '2rem', margin: '0.5rem 0 0.25rem' }}>AssetGuard</h1>
          <p className="login-subtitle" style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Secure Access Portal</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="login-field">
            <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', fontWeight: 600 }}>Username</label>
            <div style={{ position: 'relative', marginTop: 6 }}>
              <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
              <input className="login-input" placeholder="admin" value={creds.username} onChange={e => setCreds({ ...creds, username: e.target.value })} required />
            </div>
          </div>
          <div className="login-field">
            <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', fontWeight: 600 }}>Password</label>
            <div style={{ position: 'relative', marginTop: 6 }}>
              <Key size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
              <input className="login-input" type="password" placeholder="••••••••" value={creds.password} onChange={e => setCreds({ ...creds, password: e.target.value })} required />
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn btn-primary login-btn" style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Initialize System
          </motion.button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.6rem', opacity: 0.25, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          &copy; 2026 AssetGuard &middot; Authenticated Access Only
        </p>
      </div>
    </div>
  );

  /* MAIN APPLICATION */
  return (
    <div ref={appRef} className="app-shell">
      <header className="app-header dashboard-header">
        <div className="topbar">
          <div className="brand-lockup">
            <div className="brand-mark glow-pulse"><ShieldCheck size={28} color="white" /></div>
            <div><p className="eyebrow">Digital Rights Command Center</p><h1>AssetGuard</h1></div>
          </div>
          <button onClick={() => { setLoggedIn(false); setCreds({ username: '', password: '' }); }} className="btn btn-outline signout-btn">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="status-pill"><span></span> System Operational</span>
            <h2>Protect and monitor premium media assets in real time.</h2>
            <p>Fingerprint original content, discover unauthorized reuse, and audit detections from one secured operations workspace.</p>
          </div>
          <div className="hero-metrics">
            <div><span>{stats.total_assets}</span><p>Assets</p></div>
            <div><span>{stats.total_detections}</span><p>Detections</p></div>
            <div><span>{stats.high_risk_count}</span><p>High Risk</p></div>
          </div>
        </section>
        <nav className="app-nav segmented-nav">
          {[
            { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
            { id: 'scan', label: 'Monitoring', Icon: Search },
            { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`app-nav-btn ${tab === t.id ? 'active' : ''}`}>
              <t.Icon size={17} /> {t.label}
            </button>
          ))}
        </nav>
      </header>
      {/* ── Page Content ── */}
      <main className="dashboard-main">
        <AnimatePresence mode="wait">

          {/* ════════════ DASHBOARD ════════════ */}
          {tab === 'dashboard' && (
            <motion.div key="dashboard" {...fade} className="content-section">
              {/* Stats Row */}
              <div className="stats-grid kpi-grid">
                <div className="glass-card stat-card kpi-card">
                  <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Protected Assets</p>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'white' }}>{stats.total_assets}</span>
                </div>
                <div className="glass-card stat-card kpi-card">
                  <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Total Detections</p>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--red)' }}>{stats.total_detections}</span>
                </div>
                <div className="glass-card stat-card kpi-card">
                  <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>System Status</p>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--green)' }}>OPERATIONAL</span>
                </div>
              </div>

              {/* Section Header */}
              <div className="section-toolbar panel-toolbar">
                <div>
                  <h2>Protected Inventory</h2>
                  <p>Fingerprinted sports media assets.</p>
                </div>
                <label className="btn btn-primary upload-action">
                  <Plus size={16} /> Protect New
                  <input type="file" onChange={handleUpload} disabled={uploading} />
                </label>
              </div>

              {uploading && (
                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '1rem', marginBottom: 20 }}>
                  <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--blue)' }} />
                  <span style={{ fontSize: '0.85rem' }}>Processing fingerprint...</span>
                </div>
              )}

              {/* Asset Grid */}
              <div className="asset-grid inventory-grid">
                {assets.map((a, i) => (
                  <div key={i} className="glass-card asset-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      {a.type === 'video'
                        ? <FileVideo size={20} style={{ color: 'var(--blue)' }} />
                        : <FileImage size={20} style={{ color: 'var(--green)' }} />}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span className="status-badge status-protected">Secure</span>
                        <button onClick={() => handleDeleteAsset(a.filename)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 4 }}
                          title="Remove">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <h3 style={{ marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.filename}</h3>
                    <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{a.type}</p>
                    <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', background: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: 8, color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
                      {a.hashes[0]?.substring(0, 24)}...
                    </div>
                  </div>
                ))}
              </div>

              {assets.length === 0 && !uploading && (
                <div className="empty-state">
                  <p style={{ fontStyle: 'italic' }}>No protected assets yet. Click "Protect New" to get started.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ════════════ MONITORING ════════════ */}
          {tab === 'scan' && (
            <motion.div key="scan" {...fade} className="content-section monitoring-panel">
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <h2 style={{ fontSize: '1.75rem', marginBottom: 8 }}>Content Discovery</h2>
                <p>Simulate an internet crawl by uploading content found on external platforms.</p>
              </div>

              <div className="upload-zone" onClick={() => document.getElementById('scan-input').click()}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <Globe size={40} style={{ color: 'var(--blue)' }} />
                  <h3>Upload Discovered Content</h3>
                  <p style={{ fontSize: '0.8rem' }}>Drag & Drop or click to scan external media</p>
                </div>
                <input id="scan-input" type="file" onChange={handleScan} />
              </div>

              {/* Preview */}
              {scanPreview && (
                <div className="glass-card" style={{ marginBottom: 20, display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                  <div style={{ borderRadius: 10, overflow: 'hidden', maxHeight: 240, border: '1px solid var(--border)' }}>
                    {scanType?.startsWith('video')
                      ? <video src={scanPreview} style={{ maxWidth: '100%', height: 'auto' }} controls />
                      : <img src={scanPreview} style={{ maxWidth: '100%', height: 'auto' }} alt="Preview" />}
                  </div>
                </div>
              )}

              {/* Scanning Loader */}
              {scanning && (
                <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', marginBottom: 20 }}>
                  <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--blue)', marginBottom: 12 }} />
                  <h3>Crawling Platforms...</h3>
                  <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Matching against encrypted fingerprints</p>
                </div>
              )}

              {/* Scan Result */}
              {scanResult && (
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="glass-card"
                  style={{ borderColor: scanResult.matches_found ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)', borderWidth: 2 }}
                >
                  <div style={{ textAlign: 'center', marginBottom: scanResult.matches_found ? 24 : 0 }}>
                    {scanResult.matches_found ? (
                      <>
                        <div style={{ display: 'inline-flex', background: 'var(--red)', padding: 14, borderRadius: '50%', marginBottom: 16, boxShadow: '0 0 25px rgba(239,68,68,0.4)' }}>
                          <AlertTriangle size={36} color="white" />
                        </div>
                        <h2 style={{ color: 'var(--red)', fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                          ⚠️ Unauthorized Usage Detected
                        </h2>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'inline-flex', background: 'var(--green)', padding: 14, borderRadius: '50%', marginBottom: 16, boxShadow: '0 0 25px rgba(16,185,129,0.4)' }}>
                          <CheckCircle size={36} color="white" />
                        </div>
                        <h2 style={{ color: 'var(--green)' }}>Asset Secure & Unique</h2>
                      </>
                    )}
                  </div>

                  {scanResult.matches_found && scanResult.matches.map((m, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 12, padding: '1.25rem', border: '1px solid var(--border)', marginTop: i > 0 ? 12 : 0 }}>
                      {/* Risk badge */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 800, padding: '4px 14px', borderRadius: 20, textTransform: 'uppercase',
                          background: m.risk === 'High' ? 'var(--red)' : m.risk === 'Medium' ? '#eab308' : 'var(--green)',
                          color: m.risk === 'Medium' ? '#000' : '#fff'
                        }}>
                          Risk: {m.risk}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div>
                          <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>Similarity</p>
                          <span style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--red)' }}>{m.similarity}%</span>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>Matched Asset</p>
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>{m.matched_file}</span>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>Platform</p>
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ExternalLink size={14} style={{ color: 'var(--blue)' }} /> {m.platform}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>Detected At</p>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{m.timestamp}</span>
                        </div>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>URL</p>
                        <a href={m.url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: '0.8rem', color: 'var(--blue)', wordBreak: 'break-all' }}>{m.url}</a>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ════════════ ANALYTICS ════════════ */}
          {tab === 'analytics' && (
            <motion.div key="analytics" {...fade} className="content-section">
              {/* Stat Cards */}
              <div className="analytics-grid">
                <div className="glass-card stat-card" style={{ borderLeft: '3px solid var(--blue)', padding: '1.25rem' }}>
                  <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Total Detections</p>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'white' }}>{stats.total_detections}</span>
                </div>
                <div className="glass-card stat-card" style={{ borderLeft: '3px solid var(--red)', padding: '1.25rem' }}>
                  <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>High Risk</p>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--red)' }}>{stats.high_risk_count}</span>
                </div>
                <div className="glass-card stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '1.25rem' }}>
                  {Object.entries(stats.platform_distribution || {}).length > 0
                    ? Object.entries(stats.platform_distribution).map(([plat, count]) => (
                      <div key={plat} style={{ textAlign: 'center' }}>
                        <Globe size={18} style={{ color: 'var(--blue)', marginBottom: 4 }} />
                        <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', opacity: 0.5, fontWeight: 700 }}>{plat}</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>{count}</div>
                      </div>
                    ))
                    : <p style={{ fontSize: '0.75rem', fontStyle: 'italic', opacity: 0.3 }}>No platform data yet</p>
                  }
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <h2>Infringement History</h2>
                <p>Audit log of all digital fingerprint matches.</p>
              </div>

              {/* Detection Table */}
              <div className="glass-card table-card" style={{ padding: 0, overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: 720, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ padding: '12px 16px' }}>Time</th>
                      <th style={{ padding: '12px 16px' }}>Original</th>
                      <th style={{ padding: '12px 16px' }}>Matched</th>
                      <th style={{ padding: '12px 16px' }}>Source</th>
                      <th style={{ padding: '12px 16px' }}>Similarity</th>
                      <th style={{ padding: '12px 16px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_alerts.map((a, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '10px 16px', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {new Date(a.timestamp).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--red)' }}>{a.original_file}</td>
                        <td style={{ padding: '10px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.matched_file}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700 }}>{a.platform}</div>
                          <a href={a.url} style={{ fontSize: '0.6rem', color: 'var(--blue)', opacity: 0.7, display: 'block', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.url}</a>
                        </td>
                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 600 }}>{a.similarity}%</td>
                        <td style={{ padding: '10px 16px' }}>
                          <button onClick={() => handleDeleteDetection(a._id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 4, opacity: 0.4 }}
                            title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {stats.recent_alerts.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', opacity: 0.25, fontStyle: 'italic' }}>
                          No detections recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── Footer ── */}
      <footer className="dashboard-footer">
        &copy; 2026 AssetGuard Sports Media Protection.
      </footer>
    </div>
  );
}

export default App;

