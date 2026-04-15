'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from './components/WalletProvider';

export default function LandingPage() {
  const { disconnectWallet } = useWallet();
  const [stats, setStats] = useState({ total_apis: 4, total_providers: 3, total_requests: 0, total_earnings: 0 });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8000'}/registry/stats/overview`)
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {});
  }, []);

  return (
    <div style={{ background: '#f9f9f9', color: '#1a1c1c', fontFamily: 'Inter, sans-serif' }}>

      {/* ── NAVIGATION ── */}
      <nav className="paypr-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
          <Link href="/" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.03em', color: '#1a1c1c', textDecoration: 'none' }}>
            PayprAPI
          </Link>
          <div className="hidden md:flex" style={{ gap: '2rem', alignItems: 'center' }}>
            <Link href="/explore" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.875rem', fontWeight: 500, color: '#004cca', textDecoration: 'none', borderBottom: '2px solid #004cca', paddingBottom: '2px' }}>Explore APIs</Link>
            <Link href="/dashboard" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.875rem', fontWeight: 500, color: '#424656', textDecoration: 'none' }}>Dashboard</Link>
            <Link href="/analytics" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.875rem', fontWeight: 500, color: '#424656', textDecoration: 'none' }}>Analytics</Link>
            <Link href="/agent-console" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.875rem', fontWeight: 500, color: '#424656', textDecoration: 'none' }}>Agent Console</Link>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={disconnectWallet} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.875rem', color: '#424656', padding: '0.5rem 1rem' }}>
            Logout
          </button>
          <Link href="/explore">
            <button style={{ background: '#0062ff', color: '#fff', border: 'none', borderRadius: '9999px', padding: '0.6rem 1.5rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
              Try Free →
            </button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: '#ffffff', padding: '6rem 2rem 4rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#fdd404', color: '#6f5c00', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, width: 'fit-content' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>bolt</span>
              Live on Algorand Testnet
            </div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(3rem, 5vw, 5rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.04em', color: '#1a1c1c' }}>
              Pay-Per-Request<br />AI APIs. No<br />Subscriptions. Ever.
            </h1>
            <p style={{ fontSize: '1.125rem', color: '#424656', maxWidth: '36rem', lineHeight: 1.6 }}>
              Scale your AI-driven apps with the world's first agentic economy gateway. Pay only when you call. No monthly minimums. No lock-ins.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/explore">
                <button style={{ background: '#004cca', color: '#fff', border: 'none', borderRadius: '9999px', padding: '1rem 2rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
                  Explore APIs →
                </button>
              </Link>
              <Link href="/agent-console">
                <button style={{ background: 'transparent', color: '#1a1c1c', border: '1px solid #c2c6d9', borderRadius: '9999px', padding: '1rem 2rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
                  Try AI Agent →
                </button>
              </Link>
            </div>
          </div>

          {/* Right — Transaction Mockup Card */}
          <div style={{ position: 'relative' }}>
            <div className="glass-card" style={{ borderRadius: '2rem', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#424656' }}>Transaction Gateway</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ba1a1a' }}></div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fdd404' }}></div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#004cca' }}></div>
                </div>
              </div>
              <div style={{ background: '#eeeeee', borderRadius: '1rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#424656', marginBottom: '0.25rem' }}>Requesting Service</p>
                <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#1a1c1c' }}>GPT-4o Summarization</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#424656', marginBottom: '0.25rem' }}>Price per Request</p>
                  <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2.5rem', lineHeight: 1, color: '#1a1c1c' }}>0.001 <span style={{ color: '#004cca', fontSize: '1.25rem' }}>ALGO</span></p>
                </div>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#ffffff', border: '1px solid #c2c6d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: '#004cca' }}>key</span>
                </div>
              </div>
              <div style={{ height: 1, background: '#c2c6d9', marginBottom: '1.5rem', opacity: 0.3 }}></div>
              <button style={{ width: '100%', padding: '1rem', background: '#1a1c1c', color: '#ffffff', border: 'none', borderRadius: '0.75rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                Confirm Payment
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ROW ── */}
      <section style={{ background: '#ffffff', padding: '0 2rem 4rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
          {[
            { value: '2.4M+', label: 'requests/day' },
            { value: '140ms', label: 'avg latency' },
            { value: '$0.00', label: 'subscription fees' },
            { value: '12k+', label: 'active agents' },
          ].map((stat) => (
            <div key={stat.label} style={{ padding: '2rem', background: '#f3f3f3', borderRadius: '1.5rem' }}>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.875rem', color: '#1a1c1c', marginBottom: '0.25rem' }}>{stat.value}</p>
              <p style={{ fontSize: '0.875rem', color: '#424656' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: '#eeeeee', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '3rem', letterSpacing: '-0.03em', color: '#1a1c1c', marginBottom: '0.5rem' }}>How PayprAPI Works</h2>
            <p style={{ fontSize: '1.125rem', color: '#424656' }}>The 402 protocol: demand, pay, receive.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '4rem', alignItems: 'start' }}>
            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              {[
                { num: '01', title: 'Request Call', desc: 'Your agent makes a standard REST call to our endpoint without any prior auth.' },
                { num: '02', title: '402 Required', desc: 'We return a 402 Payment Required status with a specific Algorand transaction hash.' },
                { num: '03', title: 'Instant Settlement', desc: 'Agent sends the tiny micro-payment. Verified instantly via blockchain finality.' },
                { num: '04', title: 'Result Delivery', desc: 'API content is unlocked and delivered with zero latency overhead.' },
              ].map((step) => (
                <div key={step.num} style={{ display: 'flex', gap: '1.5rem' }}>
                  <span style={{ flexShrink: 0, width: 48, height: 48, borderRadius: '50%', border: '1px solid #737687', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#1a1c1c', fontSize: '0.875rem' }}>{step.num}</span>
                  <div>
                    <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem', color: '#1a1c1c' }}>{step.title}</h3>
                    <p style={{ color: '#424656', fontSize: '0.875rem', lineHeight: 1.6 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Code Block */}
            <div style={{ background: '#1a1c1c', borderRadius: '1.5rem', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(186,26,26,0.4)' }}></div>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(253,212,4,0.4)' }}></div>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(0,98,255,0.4)' }}></div>
                <span style={{ marginLeft: '1rem', fontSize: '0.65rem', fontFamily: 'monospace', color: '#737687', textTransform: 'uppercase', letterSpacing: '0.1em' }}>protocol_impl.py</span>
              </div>
              <pre style={{ fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.7, color: '#c8ccd8', overflow: 'auto', whiteSpace: 'pre' }}>{`import requests

# The agent requests the resource
response = requests.post(
    "https://api.payprapi.ai/v1/summary"
)

if response.status_code == 402:
    # Get invoice from headers
    invoice = response.headers["X-Paypr-Invoice"]
    
    # Send micro-payment via Algorand SDK
    tx_id = wallet.send_micro_payment(
        invoice.amount, invoice.address
    )
    
    # Retry with transaction proof
    final_response = requests.post(
        "https://api.payprapi.ai/v1/summary",
        headers={"X-Paypr-Proof": tx_id}
    )
    print(final_response.json())`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── AVAILABLE SERVICES ── */}
      <section style={{ background: '#ffffff', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}>
            <div>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '3rem', letterSpacing: '-0.03em', color: '#1a1c1c', marginBottom: '0.5rem' }}>Available AI Services</h2>
              <p style={{ fontSize: '1.125rem', color: '#424656' }}>plug and play high-performance models instantly.</p>
            </div>
            <Link href="/explore" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#004cca', textDecoration: 'none', fontSize: '0.9rem' }}>See all 48 models →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            {[
              { icon: 'translate', name: 'Translation', desc: 'Neural translation in 95+ languages with context awareness.', price: '0.0004' },
              { icon: 'summarize', name: 'Summarization', desc: 'Extract core insights from long-form documents instantly.', price: '0.001' },
              { icon: 'psychology', name: 'Sentiment', desc: 'Advanced emotional analysis for brand monitoring.', price: '0.0002' },
              { icon: 'image', name: 'Image Gen', desc: 'Stable Diffusion XL powered high-res generation.', price: '0.05' },
            ].map((service) => (
              <Link key={service.name} href="/explore" style={{ textDecoration: 'none' }}>
                <div style={{ background: '#f3f3f3', borderRadius: '1.5rem', padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s', color: '#1a1c1c' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-8px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                  <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#004cca', marginBottom: '1.5rem', display: 'block' }}>{service.icon}</span>
                  <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>{service.name}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#424656', marginBottom: '2rem', lineHeight: 1.5 }}>{service.desc}</p>
                  <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#1a1c1c' }}>{service.price} <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#424656' }}>ALGO / req</span></p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY PAYPRAPI (BENTO GRID) ── */}
      <section style={{ background: '#f9f9f9', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '3rem', letterSpacing: '-0.03em', color: '#1a1c1c', marginBottom: '0.5rem' }}>Why PayprAPI?</h2>
            <p style={{ fontSize: '1.125rem', color: '#424656' }}>designed for the autonomy of agentic ai.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'auto auto', gap: '1.5rem' }}>
            {/* Large card */}
            <div style={{ gridColumn: 'span 2', gridRow: 'span 2', background: '#1a1c1c', borderRadius: '2rem', padding: '3rem', position: 'relative', overflow: 'hidden' }}>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.03em', color: '#ffffff', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>Absolute Financial Independence for Agents.</h3>
              <p style={{ fontSize: '1rem', color: '#737687', lineHeight: 1.6, position: 'relative', zIndex: 1 }}>Autonomous agents can now manage their own budgets directly through wallet balance without needing human credit cards.</p>
              <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60%', aspectRatio: '1', borderRadius: '50%', background: 'rgba(0,98,255,0.1)', filter: 'blur(60px)' }}></div>
            </div>
            {/* Security card */}
            <div style={{ gridColumn: 'span 2', background: '#0062ff', borderRadius: '2rem', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#ffffff' }}>shield</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)' }}>security</span>
              </div>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#ffffff', marginTop: '1rem' }}>Stateless & Anonymous.<br />No User Accounts Needed.</h3>
            </div>
            {/* 0% card */}
            <div style={{ background: '#fdd404', borderRadius: '2rem', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#6f5c00', marginBottom: '0.25rem' }}>0% Platform Surcharge.</h3>
              <p style={{ fontSize: '0.75rem', color: '#6f5c00', fontStyle: 'italic' }}>pure model cost passing.</p>
            </div>
            {/* Audit card */}
            <div style={{ background: '#ffffff', borderRadius: '2rem', padding: '2rem', border: '1px solid rgba(194,198,217,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid #c2c6d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: '#004cca' }}>history</span>
              </div>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.125rem', color: '#1a1c1c', marginTop: '1rem' }}>Immutable Audit Logs.</h3>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: '#ffffff', padding: '8rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60%', height: '60%', background: 'rgba(0,76,202,0.04)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 'clamp(3rem, 7vw, 5.5rem)', letterSpacing: '-0.04em', color: '#1a1c1c', lineHeight: 0.9, marginBottom: '2rem' }}>Ready to build?</h2>
          <p style={{ fontSize: '1.25rem', color: '#424656', marginBottom: '3rem' }}>Start integrating the future of AI commerce today. no commitment. no credit cards.</p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/explore">
              <button style={{ background: '#1a1c1c', color: '#ffffff', border: 'none', borderRadius: '9999px', padding: '1.25rem 3rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.125rem', cursor: 'pointer' }}>Get Started</button>
            </Link>
            <button style={{ background: 'transparent', color: '#1a1c1c', border: '2px solid #c2c6d9', borderRadius: '9999px', padding: '1.25rem 3rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.125rem', cursor: 'pointer' }}>Docs</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#f3f3f3', padding: '3rem 2rem', borderTop: '1px solid rgba(194,198,217,0.3)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, marginBottom: '0.25rem', color: '#1a1c1c' }}>PayprAPI</p>
            <p style={{ fontSize: '0.875rem', color: '#424656' }}>PayprAPI — Powered by Algorand Blockchain &amp; X402 Protocol</p>
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            {['Documentation', 'Privacy', 'Terms', 'Support'].map(link => (
              <a key={link} href="#" style={{ fontSize: '0.875rem', color: '#424656', textDecoration: 'none' }}>{link}</a>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: '1280px', margin: '1.5rem auto 0', paddingTop: '1.5rem', borderTop: '1px solid rgba(194,198,217,0.2)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: '#737687', textTransform: 'uppercase', letterSpacing: '0.1em' }}>© 2024 PayprAPI. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}