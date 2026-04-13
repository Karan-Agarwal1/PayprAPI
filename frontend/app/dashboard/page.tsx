'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '../components/WalletProvider';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const NAV: React.CSSProperties = { fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', color: '#424656', padding: '0.25rem 0' };
const ACTIVE_NAV: React.CSSProperties = { ...NAV, color: '#004cca', borderBottom: '2px solid #004cca' };
const INPUT_S: React.CSSProperties = { width: '100%', background: '#f3f3f3', border: 'none', borderRadius: '0.75rem', padding: '0.75rem 1rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' };

const CHART_DATA = [
  { name: 'Mon', requests: 1200, earnings: 2.4 },
  { name: 'Tue', requests: 1900, earnings: 3.8 },
  { name: 'Wed', requests: 1400, earnings: 2.8 },
  { name: 'Thu', requests: 2200, earnings: 4.4 },
  { name: 'Fri', requests: 2800, earnings: 5.6 },
  { name: 'Sat', requests: 1800, earnings: 3.6 },
  { name: 'Sun', requests: 2100, earnings: 4.2 },
];

const RECENT_ACTIVITY = [
  { consumer: 'usr_9281a...331', api: 'Text Summarization', amount: '0.024 ALGO', status: 'SUCCESS', time: '2 min ago' },
  { consumer: 'usr_1211p...009', api: 'Sentiment Analysis', amount: '0.008 ALGO', status: 'SUCCESS', time: '5 min ago' },
  { consumer: 'usr_ff280...cc2', api: 'Image Generation', amount: '0.120 ALGO', status: 'PENDING', time: '12 min ago' },
  { consumer: 'usr_4af72...b81', api: 'Neural Translator', amount: '0.002 ALGO', status: 'SUCCESS', time: '24 min ago' },
  { consumer: 'usr_99bc1...4a3', api: 'Text Summarization', amount: '0.024 ALGO', status: 'SUCCESS', time: '41 min ago' },
  { consumer: 'usr_7bc32...d12', api: 'Neural Translator', amount: '0.004 ALGO', status: 'SUCCESS', time: '1 hr ago' },
  { consumer: 'usr_e2a91...f77', api: 'Sentiment Analysis', amount: '0.008 ALGO', status: 'FAILED', time: '2 hr ago' },
];

const MY_APIS = [
  { id: 'svc_001', name: 'Neural Translator', endpoint: '/api/translate', price: '0.0004 ALGO', category: 'Language', calls: 18420, revenue: '7.37 ALGO', status: 'ACTIVE', uptime: '99.9%' },
  { id: 'svc_002', name: 'Text Summarization', endpoint: '/api/summarize', price: '0.001 ALGO', category: 'NLP', calls: 9310, revenue: '9.31 ALGO', status: 'ACTIVE', uptime: '99.7%' },
  { id: 'svc_003', name: 'Sentiment Analysis', endpoint: '/api/sentiment', price: '0.0002 ALGO', category: 'Analytics', calls: 24800, revenue: '4.96 ALGO', status: 'ACTIVE', uptime: '99.8%' },
  { id: 'svc_004', name: 'Image Generation', endpoint: '/api/image/generate', price: '0.05 ALGO', category: 'Creative', calls: 1240, revenue: '62.00 ALGO', status: 'ACTIVE', uptime: '98.2%' },
];

const ORGS = [
  { name: 'AI Labs Inc.', role: 'Owner', did: 'did:paypr:algo:4482-9901-2281-x992', stake: '500 ALGO', members: 8 },
  { name: 'QuantNode', role: 'Admin', did: 'did:paypr:algo:5511-2281-bb10-y441', stake: '250 ALGO', members: 12 },
  { name: 'Neural Nexus', role: 'Contributor', did: 'did:paypr:algo:9901-001x-cc82-z119', stake: '100 ALGO', members: 5 },
];

const SETTINGS_INITIAL = {
  displayName: 'PayprAPI Developer',
  email: 'dev@payprapi.io',
  webhookUrl: 'https://hooks.myapp.com/paypr/events',
  rateLimit: '1000',
  simulationMode: true,
  emailAlerts: true,
  onChainAlerts: false,
  autoWithdraw: false,
  withdrawThreshold: '10',
};

export default function DashboardPage() {
  const { walletAddress, disconnectWallet } = useWallet();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeOrg, setActiveOrg] = useState(0);
  const [showAllTx, setShowAllTx] = useState(false);

  /* ── Publish form ── */
  const [publishForm, setPublishForm] = useState({ name: '', url: '', price: '', rateLimit: '', category: 'Text Generation', description: '' });
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishResult, setPublishResult] = useState<{ ok: boolean; msg: string } | null>(null);

  /* ── Registry ── */
  const [registryLoading, setRegistryLoading] = useState(false);
  const [registryResult, setRegistryResult] = useState<{ ok: boolean; txId: string } | null>(null);

  /* ── Settings ── */
  const [settings, setSettings] = useState(SETTINGS_INITIAL);
  const [settingsSaved, setSettingsSaved] = useState(false);

  /* ── My APIs ── */
  const [apiFilter, setApiFilter] = useState('ALL');
  const [expandedApi, setExpandedApi] = useState<string | null>(null);

  /* ── Publish API ── */
  const handlePublish = async () => {
    if (!publishForm.name.trim() || !publishForm.url.trim() || !publishForm.price.trim()) {
      setPublishResult({ ok: false, msg: 'API Name, Endpoint URL, and Price are required.' });
      setTimeout(() => setPublishResult(null), 4000); return;
    }
    setPublishLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setPublishResult({ ok: true, msg: `✓ "${publishForm.name}" listed on marketplace! Service ID: svc_${Math.random().toString(36).slice(2, 10)}` });
    setPublishForm({ name: '', url: '', price: '', rateLimit: '', category: 'Text Generation', description: '' });
    setPublishLoading(false);
    setTimeout(() => setPublishResult(null), 6000);
  };

  /* ── Update Registry ── */
  const handleRegistry = async () => {
    setRegistryLoading(true); setRegistryResult(null);
    await new Promise(r => setTimeout(r, 2200));
    const fakeTxId = 'ALGO' + Math.random().toString(36).toUpperCase().slice(2, 14);
    setRegistryResult({ ok: true, txId: fakeTxId });
    setRegistryLoading(false);
    setTimeout(() => setRegistryResult(null), 8000);
  };

  /* ── Export CSV ── */
  const exportCSV = () => {
    const headers = ['Consumer ID', 'API', 'Status', 'Method', 'Settlement', 'Time'];
    const rows = RECENT_ACTIVITY.map(r => [r.consumer, r.api, r.status, 'POST', r.amount, r.time]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `payprapi_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  /* ── Save Settings ── */
  const saveSettings = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const tabs = ['overview', 'my apis', 'publish api', 'register form', 'settings'];

  /* ─────────────────────────────── OVERVIEW TAB ─────────────────────────────── */
  const renderOverview = () => (
    <>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 20px 40px rgba(26,28,28,0.05)', position: 'relative', overflow: 'hidden' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#424656', marginBottom: '0.75rem' }}>Monthly Revenue</p>
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2.75rem', letterSpacing: '-0.04em', color: '#1a1c1c', lineHeight: 1 }}>83.64 <span style={{ fontSize: '1rem', fontWeight: 500, color: '#424656' }}>ALGO</span></p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#004cca' }}>trending_up</span>
            <span style={{ fontSize: '0.75rem', color: '#004cca', fontWeight: 600 }}>+24% from last month</span>
          </div>
          <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', opacity: 0.06 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '120px', color: '#1a1c1c' }}>payments</span>
          </div>
        </div>
        <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 20px 40px rgba(26,28,28,0.05)' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#424656', marginBottom: '0.75rem' }}>Total API Calls</p>
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2.75rem', letterSpacing: '-0.04em', color: '#1a1c1c', lineHeight: 1, marginBottom: '1rem' }}>53,770</p>
          <div style={{ background: '#f3f3f3', borderRadius: '9999px', height: '6px', overflow: 'hidden', marginBottom: '0.5rem' }}>
            <div style={{ width: '67%', height: '100%', background: '#004cca', borderRadius: '9999px' }}></div>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#424656' }}>67% of monthly quota</p>
        </div>
        <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 20px 40px rgba(26,28,28,0.05)' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#424656', marginBottom: '0.75rem' }}>Avg Latency</p>
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2.75rem', letterSpacing: '-0.04em', color: '#1a1c1c', lineHeight: 1, marginBottom: '1rem' }}>142ms</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4caf50' }}></div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4caf50', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OPTIMAL</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Chart */}
          <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 20px 40px rgba(26,28,28,0.05)' }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.125rem', color: '#1a1c1c', marginBottom: '1.5rem' }}>Request Volume — This Week</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#004cca" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#004cca" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f3" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#737687' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#737687' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e2e2', borderRadius: '0.75rem', fontSize: '0.8rem' }} />
                <Area type="monotone" dataKey="requests" stroke="#004cca" strokeWidth={2} fill="url(#reqGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 20px 40px rgba(26,28,28,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.125rem', color: '#1a1c1c' }}>Recent Activity</h3>
                <p style={{ fontSize: '0.75rem', color: '#424656', marginTop: '0.25rem' }}>Real-time settlement data across all endpoints.</p>
              </div>
              <button onClick={exportCSV} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#004cca' }}>
                Export CSV <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e8e8e8' }}>
                  {['Consumer ID', 'API', 'Status', 'Method', 'Settlement', 'Time'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#424656' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(showAllTx ? RECENT_ACTIVITY : RECENT_ACTIVITY.slice(0, 5)).map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f3f3' }}>
                    <td style={{ padding: '0.875rem 0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#1a1c1c' }}>{row.consumer}</td>
                    <td style={{ padding: '0.875rem 0.75rem', fontSize: '0.8rem', color: '#1a1c1c' }}>{row.api}</td>
                    <td style={{ padding: '0.875rem 0.75rem' }}>
                      <span style={{ background: row.status === 'SUCCESS' ? 'rgba(76,175,80,0.1)' : row.status === 'PENDING' ? 'rgba(253,212,4,0.3)' : 'rgba(186,26,26,0.1)', color: row.status === 'SUCCESS' ? '#2e7d32' : row.status === 'PENDING' ? '#6f5c00' : '#ba1a1a', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', textTransform: 'uppercase' }}>{row.status}</span>
                    </td>
                    <td style={{ padding: '0.875rem 0.75rem', fontSize: '0.75rem', color: '#424656' }}>POST</td>
                    <td style={{ padding: '0.875rem 0.75rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: '#1a1c1c' }}>{row.amount}</td>
                    <td style={{ padding: '0.875rem 0.75rem', fontSize: '0.7rem', color: '#737687' }}>{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setShowAllTx(v => !v)} style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', background: '#f3f3f3', border: 'none', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#424656', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {showAllTx ? 'Show Less' : 'View All Transactions'}
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{showAllTx ? 'expand_less' : 'expand_more'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT: On-Chain Registration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#004cca', borderRadius: '1.5rem', padding: '2rem', color: '#ffffff' }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>On-Chain Registration</h3>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem', lineHeight: 1.6 }}>Submit your organization identity to the Algorand blockchain to enable trustless payments.</p>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>Organization DID</p>
              <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#fdd404', wordBreak: 'break-all' }}>{ORGS[activeOrg].did}</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>Protocol Stake</p>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.03em' }}>{ORGS[activeOrg].stake}</p>
              <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.15)', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LOCKED</span>
            </div>
            {registryResult && (
              <div style={{ background: 'rgba(253,212,4,0.15)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem', border: '1px solid rgba(253,212,4,0.4)' }}>
                <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.75rem', color: '#fdd404' }}>✓ Registry Updated On-Chain</p>
                <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem', wordBreak: 'break-all' }}>TX: {registryResult.txId}</p>
              </div>
            )}
            <button onClick={handleRegistry} disabled={registryLoading}
              style={{ width: '100%', padding: '0.875rem', background: registryLoading ? 'rgba(255,255,255,0.5)' : '#ffffff', color: '#004cca', border: 'none', borderRadius: '0.75rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.875rem', cursor: registryLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
              {registryLoading && <span className="material-symbols-outlined animate-paypr-spin" style={{ fontSize: '16px', color: '#004cca' }}>sync</span>}
              {registryLoading ? 'Submitting to Algorand...' : 'Update Registry'}
            </button>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '1.5rem', boxShadow: '0 20px 40px rgba(26,28,28,0.05)' }}>
            <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#1a1c1c', marginBottom: '0.75rem' }}>Connected Wallet</h4>
            <div style={{ background: '#f3f3f3', borderRadius: '0.75rem', padding: '1rem', fontFamily: 'monospace', fontSize: '0.7rem', color: '#424656', wordBreak: 'break-all' }}>
              {walletAddress || 'Not connected'}
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
              <div style={{ flex: 1, background: '#f3f3f3', borderRadius: '0.75rem', padding: '0.875rem', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#1a1c1c' }}>4</p>
                <p style={{ fontSize: '0.6rem', color: '#737687', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active APIs</p>
              </div>
              <div style={{ flex: 1, background: 'rgba(0,76,202,0.06)', borderRadius: '0.75rem', padding: '0.875rem', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#004cca' }}>83.64</p>
                <p style={{ fontSize: '0.6rem', color: '#737687', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ALGO Earned</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  /* ─────────────────────────────── MY APIS TAB ─────────────────────────────── */
  const renderMyApis = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#1a1c1c' }}>My Published APIs</h2>
          <p style={{ fontSize: '0.8rem', color: '#424656', marginTop: '0.25rem' }}>Manage your marketplace endpoints and monitor performance.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['ALL', 'ACTIVE', 'INACTIVE'].map(f => (
            <button key={f} onClick={() => setApiFilter(f)} style={{ padding: '0.4rem 1rem', background: apiFilter === f ? '#004cca' : '#f3f3f3', color: apiFilter === f ? '#ffffff' : '#424656', border: 'none', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total APIs', value: MY_APIS.length.toString(), icon: 'api', color: '#004cca' },
          { label: 'Total Calls', value: '53,770', icon: 'bolt', color: '#4caf50' },
          { label: 'Avg Uptime', value: '99.4%', icon: 'monitor_heart', color: '#4caf50' },
          { label: 'Total Revenue', value: '83.64 ALGO', icon: 'payments', color: '#e9c400' },
        ].map(s => (
          <div key={s.label} style={{ background: '#ffffff', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: s.color }}>{s.icon}</span>
              <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#737687' }}>{s.label}</p>
            </div>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.375rem', color: '#1a1c1c', letterSpacing: '-0.02em' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* API Cards */}
      {MY_APIS.filter(a => apiFilter === 'ALL' || a.status === apiFilter).map(api => (
        <div key={api.id} style={{ background: '#ffffff', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', cursor: 'pointer' }} onClick={() => setExpandedApi(expandedApi === api.id ? null : api.id)}>
            <div style={{ width: 48, height: 48, background: 'rgba(0,76,202,0.1)', borderRadius: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#004cca' }}>api</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#1a1c1c' }}>{api.name}</h3>
                <span style={{ background: 'rgba(76,175,80,0.1)', color: '#2e7d32', fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px', textTransform: 'uppercase' }}>{api.status}</span>
                <span style={{ background: '#f3f3f3', color: '#424656', fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>{api.category}</span>
              </div>
              <code style={{ fontSize: '0.75rem', color: '#737687', fontFamily: 'monospace' }}>{api.endpoint} · {api.price}/req</code>
            </div>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              {[{ label: 'Calls', value: api.calls.toLocaleString() }, { label: 'Revenue', value: api.revenue }, { label: 'Uptime', value: api.uptime }].map(m => (
                <div key={m.label} style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#1a1c1c' }}>{m.value}</p>
                  <p style={{ fontSize: '0.6rem', color: '#737687', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</p>
                </div>
              ))}
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#737687', transition: 'transform 0.2s', transform: expandedApi === api.id ? 'rotate(180deg)' : 'none' }}>expand_more</span>
            </div>
          </div>
          {expandedApi === api.id && (
            <div style={{ borderTop: '1px solid #f3f3f3', padding: '1.5rem', background: '#f9f9f9', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#737687', marginBottom: '0.5rem' }}>Service ID</p>
                <code style={{ fontSize: '0.8rem', color: '#424656' }}>{api.id}</code>
              </div>
              <div>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#737687', marginBottom: '0.5rem' }}>Endpoint URL</p>
                <code style={{ fontSize: '0.8rem', color: '#004cca' }}>http://localhost:8001{api.endpoint}</code>
              </div>
              <div>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#737687', marginBottom: '0.5rem' }}>Actions</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button style={{ padding: '0.4rem 1rem', background: '#004cca', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                  <button style={{ padding: '0.4rem 1rem', background: '#f3f3f3', color: '#424656', border: 'none', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Docs</button>
                  <button style={{ padding: '0.4rem 1rem', background: 'rgba(186,26,26,0.1)', color: '#ba1a1a', border: 'none', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Pause</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  /* ─────────────────────────────── PUBLISH API TAB ─────────────────────────────── */
  const renderPublishApi = () => (
    <div style={{ maxWidth: '720px' }}>
      <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#1a1c1c', marginBottom: '0.5rem' }}>Publish New API</h2>
      <p style={{ fontSize: '0.8rem', color: '#424656', marginBottom: '2rem' }}>List your AI service on the PayprAPI marketplace and start earning ALGO per request.</p>

      {publishResult && (
        <div style={{ padding: '1rem', background: publishResult.ok ? 'rgba(76,175,80,0.1)' : 'rgba(186,26,26,0.1)', borderRadius: '0.875rem', border: `1px solid ${publishResult.ok ? 'rgba(76,175,80,0.3)' : 'rgba(186,26,26,0.3)'}`, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: publishResult.ok ? '#4caf50' : '#ba1a1a' }}>{publishResult.ok ? 'check_circle' : 'error'}</span>
          <span style={{ fontSize: '0.875rem', color: publishResult.ok ? '#2e7d32' : '#ba1a1a', fontWeight: 600 }}>{publishResult.msg}</span>
        </div>
      )}

      <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 20px 40px rgba(26,28,28,0.05)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {[
            { label: 'API Name *', key: 'name', placeholder: 'e.g. My Summarizer', type: 'text' },
            { label: 'Price per Request (ALGO) *', key: 'price', placeholder: '0.001', type: 'number' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#424656', marginBottom: '0.4rem' }}>{f.label}</label>
              <input type={f.type} value={publishForm[f.key as keyof typeof publishForm] as string} onChange={e => setPublishForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} style={INPUT_S} />
            </div>
          ))}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#424656', marginBottom: '0.4rem' }}>Endpoint URL *</label>
          <input value={publishForm.url} onChange={e => setPublishForm(prev => ({ ...prev, url: e.target.value }))} placeholder="https://your-api-host.com/v1/endpoint" style={INPUT_S} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#424656', marginBottom: '0.4rem' }}>Category</label>
            <select value={publishForm.category} onChange={e => setPublishForm(prev => ({ ...prev, category: e.target.value }))} style={{ ...INPUT_S, cursor: 'pointer' }}>
              {['Text Generation', 'Vision', 'Language', 'Audio', 'Analytics', 'Creative'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#424656', marginBottom: '0.4rem' }}>Rate Limit (req/min)</label>
            <input value={publishForm.rateLimit} onChange={e => setPublishForm(prev => ({ ...prev, rateLimit: e.target.value }))} placeholder="60" style={INPUT_S} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#424656', marginBottom: '0.4rem' }}>Description</label>
          <textarea value={publishForm.description} onChange={e => setPublishForm(prev => ({ ...prev, description: e.target.value }))} rows={3} placeholder="Describe what your API does, expected inputs and outputs..." style={{ ...INPUT_S, resize: 'none' }} />
        </div>

        <div style={{ borderTop: '1px solid #f3f3f3', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={handlePublish} disabled={publishLoading}
              style={{ padding: '0.875rem 2rem', background: publishLoading ? '#eeeeee' : '#004cca', color: publishLoading ? '#737687' : '#ffffff', border: 'none', borderRadius: '9999px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.9rem', cursor: publishLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
              {publishLoading && <span className="material-symbols-outlined animate-paypr-spin" style={{ fontSize: '18px' }}>sync</span>}
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{publishLoading ? 'sync' : 'rocket_launch'}</span>
              {publishLoading ? 'Publishing to Marketplace...' : 'Publish to Marketplace'}
            </button>
            <p style={{ fontSize: '0.75rem', color: '#737687' }}>Your API will be live within ~30 seconds after signing.</p>
          </div>
        </div>
      </div>

      {/* Info boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
        {[
          { icon: 'payments', title: 'Earn per Request', desc: 'Set your own price. Earn ALGO every time someone calls your API.' },
          { icon: 'shield', title: 'X402 Protected', desc: 'All calls are automatically gated by the x402 payment protocol.' },
          { icon: 'bolt', title: 'Instant Settlement', desc: 'ALGO is credited to your wallet within seconds via Algorand.' },
          { icon: 'analytics', title: 'Real-time Analytics', desc: 'Track calls, latency, and revenue in your dashboard.' },
        ].map(b => (
          <div key={b.title} style={{ background: '#ffffff', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#004cca', display: 'block', marginBottom: '0.5rem' }}>{b.icon}</span>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#1a1c1c', marginBottom: '0.25rem' }}>{b.title}</p>
            <p style={{ fontSize: '0.75rem', color: '#737687', lineHeight: 1.5 }}>{b.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  /* ─────────────────────────────── REGISTER FORM TAB ─────────────────────────────── */
  const renderRegisterForm = () => (
    <div style={{ maxWidth: '720px' }}>
      <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#1a1c1c', marginBottom: '0.5rem' }}>On-Chain Organization Registration</h2>
      <p style={{ fontSize: '0.8rem', color: '#424656', marginBottom: '2rem' }}>Register your organization on the Algorand blockchain to participate in the PayprAPI ecosystem.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 20px 40px rgba(26,28,28,0.05)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[
            { label: 'Organization Name', placeholder: 'e.g. AI Labs Inc.' },
            { label: 'Website URL', placeholder: 'https://your-org.com' },
            { label: 'Contact Email', placeholder: 'contact@your-org.com' },
            { label: 'GitHub / Documentation', placeholder: 'https://docs.your-org.com' },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#424656', marginBottom: '0.4rem' }}>{f.label}</label>
              <input placeholder={f.placeholder} defaultValue={f.label === 'Organization Name' ? ORGS[activeOrg].name : ''} style={INPUT_S} />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#424656', marginBottom: '0.4rem' }}>Organization Type</label>
            <select style={{ ...INPUT_S, cursor: 'pointer' }}>
              {['AI Provider', 'Enterprise Consumer', 'Research Institution', 'Independent Developer'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#424656', marginBottom: '0.4rem' }}>Description</label>
            <textarea rows={3} placeholder="Brief description of your organization and use case..." style={{ ...INPUT_S, resize: 'none' }} />
          </div>

          <div style={{ borderTop: '1px solid #f3f3f3', paddingTop: '1.25rem' }}>
            {registryResult && (
              <div style={{ padding: '0.875rem 1rem', background: 'rgba(76,175,80,0.1)', borderRadius: '0.75rem', border: '1px solid rgba(76,175,80,0.3)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#4caf50' }}>check_circle</span>
                <div>
                  <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: '#2e7d32' }}>Organization Registered Successfully!</p>
                  <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#424656', wordBreak: 'break-all' }}>TX: {registryResult.txId}</p>
                </div>
              </div>
            )}
            <button onClick={handleRegistry} disabled={registryLoading}
              style={{ width: '100%', padding: '0.875rem', background: registryLoading ? '#eeeeee' : '#004cca', color: registryLoading ? '#737687' : '#ffffff', border: 'none', borderRadius: '0.75rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.9rem', cursor: registryLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
              {registryLoading && <span className="material-symbols-outlined animate-paypr-spin" style={{ fontSize: '18px' }}>sync</span>}
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{registryLoading ? 'sync' : 'verified'}</span>
              {registryLoading ? 'Submitting to Algorand...' : 'Register Organization On-Chain'}
            </button>
          </div>
        </div>

        {/* Right info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#004cca', borderRadius: '1.5rem', padding: '1.5rem', color: '#ffffff' }}>
            <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Registration Benefits</h4>
            {[
              'Trustless payment routing via DID',
              'Agent discovery by other orgs',
              'On-chain reputation score',
              'Priority API rate limits',
              'Verified badge on marketplace',
            ].map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#4caf50' }}>check_circle</span>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)' }}>{b}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
            <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#1a1c1c', marginBottom: '0.75rem' }}>Protocol Stake Required</h4>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.75rem', color: '#1a1c1c', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>500 ALGO</p>
            <p style={{ fontSize: '0.75rem', color: '#737687', lineHeight: 1.5 }}>Stake is locked for 90 days and returned in full upon deregistration. This ensures ecosystem quality.</p>
          </div>
        </div>
      </div>
    </div>
  );

  /* ─────────────────────────────── SETTINGS TAB ─────────────────────────────── */
  const renderSettings = () => (
    <div style={{ maxWidth: '720px' }}>
      <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#1a1c1c', marginBottom: '0.5rem' }}>Account Settings</h2>
      <p style={{ fontSize: '0.8rem', color: '#424656', marginBottom: '2rem' }}>Manage your profile, API preferences, and notification preferences.</p>

      {settingsSaved && (
        <div style={{ padding: '0.875rem 1rem', background: 'rgba(76,175,80,0.1)', borderRadius: '0.75rem', border: '1px solid rgba(76,175,80,0.3)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#4caf50' }}>check_circle</span>
          <span style={{ fontSize: '0.875rem', color: '#2e7d32', fontWeight: 600 }}>Settings saved successfully!</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Profile */}
        <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 20px 40px rgba(26,28,28,0.05)' }}>
          <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#1a1c1c', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#004cca' }}>person</span> Profile
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#424656', marginBottom: '0.4rem' }}>Display Name</label>
              <input value={settings.displayName} onChange={e => setSettings(s => ({ ...s, displayName: e.target.value }))} style={INPUT_S} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#424656', marginBottom: '0.4rem' }}>Email Address</label>
              <input type="email" value={settings.email} onChange={e => setSettings(s => ({ ...s, email: e.target.value }))} style={INPUT_S} />
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#424656', marginBottom: '0.4rem' }}>Connected Wallet (Read-only)</label>
            <div style={{ ...INPUT_S, color: '#737687', fontFamily: 'monospace', fontSize: '0.75rem', cursor: 'not-allowed', background: '#f9f9f9' }}>{walletAddress || 'Not connected'}</div>
          </div>
        </div>

        {/* API Config */}
        <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 20px 40px rgba(26,28,28,0.05)' }}>
          <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#1a1c1c', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#004cca' }}>settings</span> API Configuration
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#424656', marginBottom: '0.4rem' }}>Webhook URL</label>
              <input value={settings.webhookUrl} onChange={e => setSettings(s => ({ ...s, webhookUrl: e.target.value }))} style={INPUT_S} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#424656', marginBottom: '0.4rem' }}>Default Rate Limit (req/min)</label>
              <input type="number" value={settings.rateLimit} onChange={e => setSettings(s => ({ ...s, rateLimit: e.target.value }))} style={INPUT_S} />
            </div>
          </div>
          {/* Toggles */}
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              { key: 'simulationMode', label: 'Simulation Mode', desc: 'Accept any TX ID ≥10 chars without real blockchain validation' },
              { key: 'autoWithdraw', label: 'Auto-Withdraw', desc: 'Automatically withdraw when balance exceeds threshold' },
            ].map(t => (
              <div key={t.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', background: '#f9f9f9', borderRadius: '0.75rem' }}>
                <div>
                  <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: '#1a1c1c' }}>{t.label}</p>
                  <p style={{ fontSize: '0.7rem', color: '#737687', marginTop: '0.1rem' }}>{t.desc}</p>
                </div>
                <div onClick={() => setSettings(s => ({ ...s, [t.key]: !s[t.key as keyof typeof s] }))}
                  style={{ width: 44, height: 24, background: settings[t.key as keyof typeof settings] ? '#004cca' : '#e2e2e2', borderRadius: '9999px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 4, left: settings[t.key as keyof typeof settings] ? 24 : 4, width: 16, height: 16, background: '#ffffff', borderRadius: '50%', transition: 'left 0.2s' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 20px 40px rgba(26,28,28,0.05)' }}>
          <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#1a1c1c', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#004cca' }}>notifications</span> Notifications
          </h4>
          {[
            { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive payment confirmation and error alerts via email' },
            { key: 'onChainAlerts', label: 'On-Chain Events', desc: 'Subscribe to on-chain events via webhooks' },
          ].map(t => (
            <div key={t.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', background: '#f9f9f9', borderRadius: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: '#1a1c1c' }}>{t.label}</p>
                <p style={{ fontSize: '0.7rem', color: '#737687', marginTop: '0.1rem' }}>{t.desc}</p>
              </div>
              <div onClick={() => setSettings(s => ({ ...s, [t.key]: !s[t.key as keyof typeof s] }))}
                style={{ width: 44, height: 24, background: settings[t.key as keyof typeof settings] ? '#004cca' : '#e2e2e2', borderRadius: '9999px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 4, left: settings[t.key as keyof typeof settings] ? 24 : 4, width: 16, height: 16, background: '#ffffff', borderRadius: '50%', transition: 'left 0.2s' }}></div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={saveSettings}
          style={{ padding: '0.875rem 2.5rem', background: '#004cca', color: '#ffffff', border: 'none', borderRadius: '9999px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start', transition: 'opacity 0.2s' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
          Save Settings
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#f9f9f9', color: '#1a1c1c', fontFamily: 'Inter, sans-serif', minHeight: '100vh' }}>

      {/* NAV */}
      <nav className="paypr-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
          <Link href="/" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.03em', color: '#1a1c1c', textDecoration: 'none' }}>PayprAPI</Link>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <Link href="/explore" style={NAV}>Explore APIs</Link>
            <Link href="/dashboard" style={ACTIVE_NAV}>Dashboard</Link>
            <Link href="/analytics" style={NAV}>Analytics</Link>
            <Link href="/agent-console" style={NAV}>Agent Console</Link>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={disconnectWallet} style={{ background: 'none', border: 'none', cursor: 'pointer', ...NAV }}>Logout</button>
          <Link href="/explore"><button style={{ background: '#0062ff', color: '#fff', border: 'none', borderRadius: '9999px', padding: '0.6rem 1.5rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>Try Free →</button></Link>
        </div>
      </nav>

      {/* PAGE HEADER + TABS */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid rgba(194,198,217,0.3)', padding: '1.5rem 2rem 0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Organization selector */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
            {ORGS.map((org, i) => (
              <button key={org.name} onClick={() => setActiveOrg(i)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.5rem 1.25rem', background: activeOrg === i ? '#004cca' : '#f3f3f3', border: 'none', borderRadius: '0.625rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: activeOrg === i ? '#ffffff' : '#1a1c1c' }}>{org.name}</span>
                <span style={{ fontSize: '0.65rem', color: activeOrg === i ? 'rgba(255,255,255,0.7)' : '#424656', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{org.role}</span>
              </button>
            ))}
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0' }}>
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: '0.75rem 1.25rem', background: 'none', border: 'none', borderBottom: activeTab === tab ? '2px solid #004cca' : '2px solid transparent', fontFamily: 'Space Grotesk, sans-serif', fontWeight: activeTab === tab ? 700 : 500, fontSize: '0.875rem', color: activeTab === tab ? '#004cca' : '#424656', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s' }}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem' }}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'my apis' && renderMyApis()}
        {activeTab === 'publish api' && renderPublishApi()}
        {activeTab === 'register form' && renderRegisterForm()}
        {activeTab === 'settings' && renderSettings()}
      </main>

      {/* FOOTER */}
      <footer style={{ background: '#f3f3f3', padding: '1.5rem 2rem', marginTop: '2rem', borderTop: '1px solid rgba(194,198,217,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.75rem', color: '#737687' }}>payprapi — powered by algorand blockchain &amp; x402 protocol</span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {['documentation', 'privacy', 'terms', 'support'].map(l => <a key={l} href="#" style={{ fontSize: '0.75rem', color: '#424656', textDecoration: 'none' }}>{l}</a>)}
        </div>
      </footer>
    </div>
  );
}