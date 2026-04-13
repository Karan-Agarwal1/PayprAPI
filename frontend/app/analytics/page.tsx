'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '../components/WalletProvider';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const NAV: React.CSSProperties = { fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', color: '#424656', padding: '0.25rem 0' };
const ACTIVE_NAV: React.CSSProperties = { ...NAV, color: '#004cca', borderBottom: '2px solid #004cca' };

const AREA_DATA = [
  { day: 'Mon', requests: 8200 }, { day: 'Tue', requests: 14100 }, { day: 'Wed', requests: 11200 },
  { day: 'Thu', requests: 19400 }, { day: 'Fri', requests: 23800 }, { day: 'Sat', requests: 15200 }, { day: 'Sun', requests: 18700 },
];

const PIE_DATA = [
  { name: 'Summarization', value: 38, color: '#004cca' },
  { name: 'Translation', value: 27, color: '#fdd404' },
  { name: 'Sentiment', value: 24, color: '#9e3100' },
  { name: 'Image Gen', value: 11, color: '#eeeeee' },
];

const EARNINGS_DATA = [
  { day: 'Mon', earnings: 16.4 }, { day: 'Tue', earnings: 28.2 }, { day: 'Wed', earnings: 22.4 },
  { day: 'Thu', earnings: 38.8 }, { day: 'Fri', earnings: 47.6 }, { day: 'Sat', earnings: 30.4 }, { day: 'Sun', earnings: 37.4 },
];

const TRANSACTIONS = [
  { id: 'ALGO-8821-XC1', api: 'Summarization', from: 'Agent_004x1', to: 'prov_Kag7', amount: '0.024 ALGO', time: '14:02:08' },
  { id: 'ALGO-8762-XT3', api: 'Translation', from: 'Agent_112ab', to: 'prov_Kag7', amount: '0.0004 ALGO', time: '14:01:22' },
  { id: 'ALGO-8704-X11', api: 'Image Gen', from: 'Agent_891c', to: 'prov_Kag7', amount: '0.050 ALGO', time: '14:00:55' },
  { id: 'ALGO-8629-XB9', api: 'Sentiment', from: 'Agent_229d', to: 'prov_Kag7', amount: '0.0002 ALGO', time: '13:58:41' },
];

export default function AnalyticsPage() {
  const { disconnectWallet } = useWallet();
  const [stats, setStats] = useState({ total_apis: 4, total_providers: 3, total_requests: 0, total_earnings: 0 });

  useEffect(() => {
    fetch('http://localhost:8000/registry/stats/overview')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {});
  }, []);

  return (
    <div style={{ background: '#f9f9f9', color: '#1a1c1c', fontFamily: 'Inter, sans-serif', minHeight: '100vh' }}>

      {/* NAV */}
      <nav className="paypr-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
          <Link href="/" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.03em', color: '#1a1c1c', textDecoration: 'none' }}>PayprAPI</Link>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <Link href="/explore" style={NAV}>Explore APIs</Link>
            <Link href="/dashboard" style={NAV}>Dashboard</Link>
            <Link href="/analytics" style={ACTIVE_NAV}>Analytics</Link>
            <Link href="/agent-console" style={NAV}>Agent Console</Link>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={disconnectWallet} style={{ background: 'none', border: 'none', cursor: 'pointer', ...NAV }}>Logout</button>
          <Link href="/explore"><button style={{ background: '#0062ff', color: '#fff', border: 'none', borderRadius: '9999px', padding: '0.6rem 1.5rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>Try Free →</button></Link>
        </div>
      </nav>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem' }}>

        {/* Page Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2.25rem', letterSpacing: '-0.04em', color: '#1a1c1c', marginBottom: '0.25rem' }}>Marketplace Analytics</h1>
          <p style={{ color: '#424656', fontSize: '0.875rem' }}>Real-time performance metrics and protocol health across the Agentic API economy.</p>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Requests', value: stats.total_requests.toLocaleString() || '0', badge: '+Live', badgeColor: '#4caf50', icon: 'hub', note: 'last 24h' },
            { label: 'Total Earnings', value: `${stats.total_earnings.toLocaleString()} ALGO`, badge: 'Stable', badgeColor: '#004cca', icon: 'account_balance_wallet', note: 'accumulated' },
            { label: 'Total APIs', value: stats.total_apis.toString(), badge: 'Verified', badgeColor: '#004cca', icon: 'api', note: 'active endpoints' },
            { label: 'Providers', value: stats.total_providers.toString(), badge: 'Scaling', badgeColor: '#705d00', icon: 'verified', note: 'global registry' },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: '#ffffff', borderRadius: '1.25rem', padding: '1.5rem', boxShadow: '0 4px 20px rgba(26,28,28,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#424656' }}>{kpi.label}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#004cca' }}>{kpi.icon}</span>
              </div>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.625rem', letterSpacing: '-0.03em', color: '#1a1c1c', marginBottom: '0.75rem' }}>{kpi.value}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: `rgba(${kpi.badgeColor === '#4caf50' ? '76,175,80' : kpi.badgeColor === '#705d00' ? '112,93,0' : '0,76,202'},0.1)`, color: kpi.badgeColor, fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px', textTransform: 'uppercase' }}>{kpi.badge}</span>
                <span style={{ fontSize: '0.7rem', color: '#737687' }}>{kpi.note}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Daily API Requests Chart */}
          <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '1.5rem', boxShadow: '0 4px 20px rgba(26,28,28,0.05)' }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#1a1c1c', marginBottom: '0.25rem' }}>Daily API Requests</h3>
            <p style={{ fontSize: '0.7rem', color: '#737687', marginBottom: '1.5rem' }}>Aggregate traffic across all registered agents</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={AREA_DATA} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#004cca" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#004cca" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f3" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#737687' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#737687' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: 'none', borderRadius: '0.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '0.75rem' }} />
                <Area type="monotone" dataKey="requests" stroke="#004cca" strokeWidth={2} fill="url(#reqGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Earnings Chart */}
          <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '1.5rem', boxShadow: '0 4px 20px rgba(26,28,28,0.05)' }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#1a1c1c', marginBottom: '0.25rem' }}>Earnings by Service</h3>
            <p style={{ fontSize: '0.7rem', color: '#737687', marginBottom: '1.5rem' }}>Revenue generation across protocol layers</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={EARNINGS_DATA} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f3" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#737687' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#737687' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: 'none', borderRadius: '0.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '0.75rem' }} />
                <Bar dataKey="earnings" fill="#fdd404" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Requests by API Pie */}
          <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '1.5rem', boxShadow: '0 4px 20px rgba(26,28,28,0.05)' }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#1a1c1c', marginBottom: '0.25rem' }}>Requests by API</h3>
            <p style={{ fontSize: '0.7rem', color: '#737687', marginBottom: '1rem' }}>Traffic distribution by category</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <PieChart width={160} height={160}>
                <Pie data={PIE_DATA} cx={75} cy={75} innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                  {PIE_DATA.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {PIE_DATA.map(p => (
                <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }}></div>
                    <span style={{ fontSize: '0.7rem', color: '#424656' }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1a1c1c' }}>{p.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Protocol Health */}
        <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(26,28,28,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.125rem', color: '#1a1c1c' }}>Protocol Health</h3>
              <p style={{ fontSize: '0.7rem', color: '#4caf50', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stable Architecture</p>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {[{ label: 'Uptime', value: '99.98%', color: '#4caf50' }, { label: 'Avg TPS', value: '1,284', color: '#004cca' }, { label: 'Node Count', value: '42', color: '#1a1c1c' }].map(m => (
                <div key={m.label} style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: m.color }}>{m.value}</p>
                  <p style={{ fontSize: '0.65rem', color: '#737687', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Health bar */}
          <div style={{ background: '#f3f3f3', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
            <div style={{ width: '99.98%', height: '100%', background: 'linear-gradient(90deg, #004cca, #0062ff)', borderRadius: '9999px' }}></div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '1.5rem', boxShadow: '0 4px 20px rgba(26,28,28,0.05)' }}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.125rem', color: '#1a1c1c', marginBottom: '1.25rem' }}>Recent Transactions</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e8e8e8' }}>
                {['TX ID', 'API', 'From Agent', 'To Provider', 'Amount', 'Time'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#424656' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TRANSACTIONS.map((tx, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f3f3' }}>
                  <td style={{ padding: '0.875rem 0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#004cca' }}>{tx.id}</td>
                  <td style={{ padding: '0.875rem 0.75rem', fontSize: '0.8rem' }}>{tx.api}</td>
                  <td style={{ padding: '0.875rem 0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#424656' }}>{tx.from}</td>
                  <td style={{ padding: '0.875rem 0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#424656' }}>{tx.to}</td>
                  <td style={{ padding: '0.875rem 0.75rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.875rem' }}>{tx.amount}</td>
                  <td style={{ padding: '0.875rem 0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#737687' }}>{tx.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ background: '#f3f3f3', padding: '1.5rem 2rem', marginTop: '2rem', borderTop: '1px solid rgba(194,198,217,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.75rem', color: '#737687' }}>payprapi — powered by algorand blockchain &amp; x402 protocol | built for the agentic ai economy</span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {['documentation', 'privacy', 'terms', 'support'].map(l => <a key={l} href="#" style={{ fontSize: '0.75rem', color: '#424656', textDecoration: 'none' }}>{l}</a>)}
        </div>
      </footer>
    </div>
  );
}