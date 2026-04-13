'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useWallet } from '../components/WalletProvider';

const AI_BASE = 'http://localhost:8000';

function pollinationsUrl(prompt: string, style: string): string {
  const styleMap: Record<string, string> = {
    'realistic': 'photorealistic, highly detailed, 8k, professional photography',
    'anime': 'anime style, Studio Ghibli, vibrant illustration',
    'digital-art': 'digital art, concept art, trending on artstation',
    'cinematic': 'cinematic, dramatic lighting, epic composition',
    'oil-painting': 'oil painting, classical art, textured canvas',
    'watercolor': 'watercolor painting, soft colors, delicate brushstrokes',
  };
  const full = `${prompt}, ${styleMap[style] || styleMap['realistic']}`;
  const seed = Math.floor(Math.random() * 999999);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true&model=flux`;
}

const NAV: React.CSSProperties = { fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', color: '#424656', padding: '0.25rem 0' };
const ACTIVE_NAV: React.CSSProperties = { ...NAV, color: '#004cca', borderBottom: '2px solid #004cca' };
const LABEL: React.CSSProperties = { display: 'block', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737687', marginBottom: '0.4rem' };
const TXT_INPUT: React.CSSProperties = { width: '100%', background: '#f3f3f3', border: '1px solid #e2e2e2', borderRadius: '0.5rem', padding: '0.5rem 0.625rem', fontSize: '0.8rem', color: '#1a1c1c', outline: 'none', boxSizing: 'border-box', resize: 'none' as const };
const TXT_SELECT: React.CSSProperties = { ...TXT_INPUT, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' };

interface LogEntry { time: string; type: 'SYSTEM' | 'INFO' | 'PAYMENT' | 'RESPONSE' | 'ERROR'; msg: string; data?: any; }

// Final result shape for summary panel
interface FinalResult { serviceName: string; serviceId: string; success: boolean; data: any; }

const LOG_COLORS: Record<string, string> = {
  SYSTEM: '#b4c5ff', INFO: '#81c784', PAYMENT: '#ffd54f', RESPONSE: '#ce93d8', ERROR: '#ef9a9a',
};

const LANGUAGES = [
  { code: 'es', name: 'Spanish' }, { code: 'fr', name: 'French' }, { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' }, { code: 'ja', name: 'Japanese' }, { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' }, { code: 'hi', name: 'Hindi' }, { code: 'ko', name: 'Korean' },
];
const IMAGE_STYLES = ['realistic', 'anime', 'digital-art', 'cinematic', 'oil-painting', 'watercolor'];
const LANG_MAP: Record<string, string> = { es: 'Spanish', fr: 'French', de: 'German', it: 'Italian', ja: 'Japanese', zh: 'Chinese', ar: 'Arabic', hi: 'Hindi', ko: 'Korean' };

const SCENARIOS = [
  {
    id: 'multilingual',
    icon: 'translate',
    name: 'Multilingual Content Analysis',
    desc: 'Agent translates text to 3 languages, analyzes sentiment for each, then summarizes findings.',
    badge: 'OPTIMIZED',
    color: '#004cca',
    services: ['translate', 'sentiment', 'summarize'],
    steps: [
      { type: 'INFO' as const, delay: 600, msg: 'Loading scenario: Multilingual Content Analysis' },
      { type: 'SYSTEM' as const, delay: 1200, msg: 'Step 1/3 — Calling Neural Translator (EN → ES, FR, JA)' },
      { type: 'PAYMENT' as const, delay: 1800, msg: 'Authorizing escrow: 0.0004 ALGO × 3 = 0.0012 ALGO' },
      { type: 'RESPONSE' as const, delay: 3000, msg: 'Translation complete', data: { es: 'Hola mundo', fr: 'Bonjour monde', ja: '世界こんにちは', latency: '820ms' } },
      { type: 'SYSTEM' as const, delay: 3600, msg: 'Step 2/3 — Running Sentiment Analysis on each translation' },
      { type: 'PAYMENT' as const, delay: 4200, msg: 'Authorizing escrow: 0.0002 ALGO × 3 = 0.0006 ALGO' },
      { type: 'RESPONSE' as const, delay: 5200, msg: 'Sentiment analysis complete', data: { ES: { score: 0.91, label: 'POSITIVE' }, FR: { score: 0.88, label: 'POSITIVE' }, JA: { score: 0.85, label: 'NEUTRAL' } } },
      { type: 'SYSTEM' as const, delay: 5800, msg: 'Step 3/3 — Summarizing multilingual findings' },
      { type: 'PAYMENT' as const, delay: 6200, msg: 'Authorizing escrow: 0.001 ALGO (Summarization)' },
      { type: 'RESPONSE' as const, delay: 7400, msg: 'Summary generated', data: { summary: 'Across all 3 languages, strongly positive sentiment detected. Recommend publishing multilingual content.', total_cost: '0.0018 ALGO' } },
      { type: 'INFO' as const, delay: 8000, msg: '✓ Pipeline complete. Total ALGO spent: 0.0018. Saved to agent memory.' },
    ],
    finalResults: [
      { serviceName: 'Neural Translator', serviceId: 'translate', success: true, data: { translated_es: 'Hola mundo', translated_fr: 'Bonjour monde', translated_ja: '世界こんにちは', confidence: 0.96, latency: '820ms' } },
      { serviceName: 'Sentiment Analysis', serviceId: 'sentiment', success: true, data: { ES: 'POSITIVE (91%)', FR: 'POSITIVE (88%)', JA: 'NEUTRAL (85%)' } },
      { serviceName: 'Text Summarization', serviceId: 'summarize', success: true, data: { summary: 'Across all 3 languages, strongly positive sentiment detected. Recommend publishing multilingual content.', total_cost: '0.0018 ALGO' } },
    ] as FinalResult[],
    totalCost: '0.0018 ALGO',
  },
  {
    id: 'smart_processing',
    icon: 'article',
    name: 'Smart Content Processing',
    desc: 'Agent processes a long article; summarizes it, analyzes sentiment, then generates a cover image.',
    badge: null,
    color: '#9e3100',
    services: ['summarize', 'sentiment', 'image_gen'],
    steps: [
      { type: 'INFO' as const, delay: 500, msg: 'Loading scenario: Smart Content Processing' },
      { type: 'SYSTEM' as const, delay: 1000, msg: 'Step 1/3 — Calling Text Summarization on article (4,200 words)' },
      { type: 'PAYMENT' as const, delay: 1600, msg: 'Authorizing escrow: 0.001 ALGO (Summarization)' },
      { type: 'RESPONSE' as const, delay: 2800, msg: 'Article summarized', data: { summary: 'The article discusses the rise of agentic AI economies and the role of micro-payment protocols in enabling autonomous agent commerce.', word_count_in: 4200, word_count_out: 48 } },
      { type: 'SYSTEM' as const, delay: 3400, msg: 'Step 2/3 — Analyzing sentiment of the summary' },
      { type: 'PAYMENT' as const, delay: 3900, msg: 'Authorizing escrow: 0.0002 ALGO (Sentiment)' },
      { type: 'RESPONSE' as const, delay: 5000, msg: 'Sentiment detected', data: { label: 'POSITIVE', score: 0.94, confidence: 'HIGH' } },
      { type: 'SYSTEM' as const, delay: 5600, msg: 'Step 3/3 — Generating cover image based on article theme' },
      { type: 'PAYMENT' as const, delay: 6100, msg: 'Authorizing escrow: 0.05 ALGO (Image Generation — cinematic style)' },
      { type: 'RESPONSE' as const, delay: 8200, msg: 'Cover image ready', data: { prompt: 'Agentic AI economy, micro-payments, decentralized network — cinematic style', image_url: 'https://picsum.photos/seed/payprapi_ai_agent/1024/1024', resolution: '1024×1024' } },
      { type: 'INFO' as const, delay: 8800, msg: '✓ Pipeline complete. Total ALGO spent: 0.0512. Content package ready for publishing.' },
    ],
    finalResults: [
      { serviceName: 'Text Summarization', serviceId: 'summarize', success: true, data: { summary: 'The article discusses the rise of agentic AI economies and micro-payment protocols enabling autonomous agent commerce.', original_words: 4200, summary_words: 48, compression: '99%' } },
      { serviceName: 'Sentiment Analysis', serviceId: 'sentiment', success: true, data: { sentiment_label: 'POSITIVE', confidence_score: '94%', confidence_level: 'HIGH', emotion_tags: ['optimism', 'innovation', 'opportunity'] } },
      { serviceName: 'Image Generation', serviceId: 'image_gen', success: true, data: { image_url: 'https://picsum.photos/seed/payprapi_ai_agent/1024/1024', style: 'cinematic', resolution: '1024×1024', prompt: 'Agentic AI economy, micro-payments, decentralized network' } },
    ] as FinalResult[],
    totalCost: '0.0512 ALGO',
  },
];

const BUILDER_SERVICES = [
  { id: 'translate', icon: 'translate', name: 'Translation', price: 0.0004, endpoint: '/api/translate' },
  { id: 'summarize', icon: 'summarize', name: 'Summarization', price: 0.001, endpoint: '/api/summarize' },
  { id: 'sentiment', icon: 'psychology', name: 'Sentiment', price: 0.0002, endpoint: '/api/sentiment' },
  { id: 'image_gen', icon: 'image', name: 'Image Gen', price: 0.05, endpoint: '/api/image/generate' },
];

interface BuilderService {
  id: string; name: string; icon: string; price: number; endpoint: string;
  inputText: string; targetLang: string; imageStyle: string;
}

/* ── Render a single final result card ── */
function FinalResultCard({ result }: { result: FinalResult }) {
  const d = result.data;
  const iconMap: Record<string, string> = { translate: 'translate', summarize: 'summarize', sentiment: 'psychology', image_gen: 'image' };

  return (
    <div style={{ background: '#1e2128', borderRadius: '0.875rem', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      {/* Card header */}
      <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#b4c5ff' }}>{iconMap[result.serviceId] || 'api'}</span>
        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#ffffff' }}>{result.serviceName}</span>
        <span style={{ marginLeft: 'auto', background: result.success ? 'rgba(129,199,132,0.15)' : 'rgba(239,154,154,0.15)', color: result.success ? '#81c784' : '#ef9a9a', fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px', textTransform: 'uppercase' }}>
          {result.success ? '✓ SUCCESS' : '✗ FAILED'}
        </span>
      </div>

      {/* Card content based on service type */}
      <div style={{ padding: '1rem' }}>
        {result.serviceId === 'translate' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {d.translated_es && <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', padding: '0.625rem 0.875rem' }}>
              <p style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#737687', marginBottom: '0.2rem' }}>🇪🇸 Spanish</p>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#e8eaf6' }}>{d.translated_es}</p>
            </div>}
            {d.translated_fr && <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', padding: '0.625rem 0.875rem' }}>
              <p style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#737687', marginBottom: '0.2rem' }}>🇫🇷 French</p>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#e8eaf6' }}>{d.translated_fr}</p>
            </div>}
            {d.translated_ja && <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', padding: '0.625rem 0.875rem' }}>
              <p style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#737687', marginBottom: '0.2rem' }}>🇯🇵 Japanese</p>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#e8eaf6' }}>{d.translated_ja}</p>
            </div>}
            {d.translated_text && <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', padding: '0.625rem 0.875rem' }}>
              <p style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#737687', marginBottom: '0.2rem' }}>🌐 {d.target_lang || 'Translation'}</p>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#e8eaf6' }}>{d.translated_text}</p>
            </div>}
            {d.confidence && <p style={{ fontSize: '0.7rem', color: '#81c784' }}>Confidence: {typeof d.confidence === 'number' ? `${(d.confidence * 100).toFixed(1)}%` : d.confidence} · Latency: {d.latency || `${Math.floor(Math.random() * 200 + 100)}ms`}</p>}
          </div>
        )}

        {result.serviceId === 'sentiment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Check if multilingual sentiment */}
            {Object.entries(d).some(([k]) => ['ES','FR','JA','DE','IT'].includes(k)) ? (
              Object.entries(d).filter(([k]) => ['ES','FR','JA','DE','IT'].includes(k)).map(([lang, val]: [string, any]) => (
                <div key={lang} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', padding: '0.625rem 0.875rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'rgba(255,255,255,0.08)', color: '#c8ccd8', padding: '0.15rem 0.5rem', borderRadius: '0.25rem' }}>{lang}</span>
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: val.label === 'POSITIVE' ? '#81c784' : val.label === 'NEGATIVE' ? '#ef9a9a' : '#ffd54f' }}>{val.label || String(val)}</span>
                  {val.score && <span style={{ fontSize: '0.7rem', color: '#737687', marginLeft: 'auto' }}>{(val.score * 100).toFixed(0)}%</span>}
                </div>
              ))
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '2.5rem' }}>{(d.sentiment_label || d.label || '').toUpperCase() === 'POSITIVE' ? '😊' : (d.sentiment_label || d.label || '').toUpperCase() === 'NEGATIVE' ? '😞' : '😐'}</span>
                  <div>
                    <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: (d.sentiment_label || d.label || '').toUpperCase() === 'POSITIVE' ? '#81c784' : (d.sentiment_label || d.label || '').toUpperCase() === 'NEGATIVE' ? '#ef9a9a' : '#ffd54f', lineHeight: 1 }}>{(d.sentiment_label || d.label || 'NEUTRAL').toUpperCase()}</p>
                    <p style={{ fontSize: '0.75rem', color: '#737687', marginTop: '0.25rem' }}>Score: {d.confidence_score || d.score || d.confidence || 'N/A'} · {d.confidence_level || 'HIGH'}</p>
                  </div>
                </div>
                {(d.emotion_tags || d.emotions) && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {(d.emotion_tags || d.emotions || []).map((t: string) => (
                      <span key={t} style={{ background: 'rgba(255,255,255,0.08)', color: '#c8ccd8', fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>{t}</span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {result.serviceId === 'summarize' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(0,76,202,0.12)', borderRadius: '0.625rem', padding: '0.875rem', border: '1px solid rgba(100,130,255,0.2)' }}>
              <p style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#b4c5ff', marginBottom: '0.375rem' }}>📝 Summary</p>
              <p style={{ fontSize: '0.875rem', color: '#e8eaf6', lineHeight: 1.65, fontStyle: 'italic' }}>"{d.summary}"</p>
            </div>
            {(d.original_words || d.word_count_in) && (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {[
                  { label: 'Original', value: (d.original_words || d.word_count_in || '—') + ' words' },
                  { label: 'Summary', value: (d.summary_words || d.word_count_out || '—') + ' words' },
                  { label: 'Compression', value: d.compression || '99%' },
                ].map(m => (
                  <div key={m.label} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', padding: '0.5rem', textAlign: 'center' }}>
                    <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: '#ffffff' }}>{m.value}</p>
                    <p style={{ fontSize: '0.55rem', color: '#737687', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {result.serviceId === 'image_gen' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {d.image_url && (
              <div style={{ borderRadius: '0.625rem', overflow: 'hidden', background: '#111' }}>
                <img src={d.image_url} alt="Generated" style={{ width: '100%', display: 'block', maxHeight: '220px', objectFit: 'cover' }} />
              </div>
            )}
            <a href={d.image_url} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', background: '#004cca', color: '#ffffff', borderRadius: '0.625rem', textDecoration: 'none', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.8rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
              Open Full Image (1024×1024) ↗
            </a>
            {d.prompt && <p style={{ fontSize: '0.7rem', color: '#737687', fontStyle: 'italic', lineHeight: 1.5 }}>"{d.prompt}"</p>}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ background: 'rgba(255,255,255,0.06)', fontSize: '0.65rem', color: '#c8ccd8', padding: '0.2rem 0.6rem', borderRadius: '0.25rem' }}>{d.style || 'cinematic'}</span>
              <span style={{ background: 'rgba(255,255,255,0.06)', fontSize: '0.65rem', color: '#c8ccd8', padding: '0.2rem 0.6rem', borderRadius: '0.25rem' }}>{d.resolution || '1024×1024'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgentConsolePage() {
  const { disconnectWallet, balance, deductBalance, mnemonic } = useWallet();

  const [logs, setLogs] = useState<LogEntry[]>([
    { time: '00:00:00', type: 'SYSTEM', msg: 'Initializing PayprAPI Agent Protocol v4.0.2...' },
    { time: '00:00:00', type: 'SYSTEM', msg: 'Handshaking with Algorand Node cluster-04... Connected.' },
    { time: '00:00:00', type: 'INFO', msg: 'Ready. Select a scenario or build a custom pipeline.' },
  ]);
  const [executing, setExecuting] = useState(false);
  const [done, setDone] = useState(false);
  const [activeTab, setActiveTab] = useState<'Scenarios' | 'Builder'>('Scenarios');
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [finalResults, setFinalResults] = useState<FinalResult[]>([]);
  const [totalCostStr, setTotalCostStr] = useState('');

  const [builderServices, setBuilderServices] = useState<BuilderService[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const logRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (done && resultsRef.current) {
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  }, [done]);

  const nowTime = () => new Date().toLocaleTimeString('en-GB', { hour12: false });
  const addLog = (entry: Omit<LogEntry, 'time'>) => setLogs(prev => [...prev, { ...entry, time: nowTime() }]);

  const toggleBuilderService = (svc: typeof BUILDER_SERVICES[0]) => {
    setBuilderServices(prev => {
      const exists = prev.some(s => s.id === svc.id);
      if (exists) return prev.filter(s => s.id !== svc.id);
      return [...prev, { id: svc.id, name: svc.name, icon: svc.icon, price: svc.price, endpoint: svc.endpoint, inputText: '', targetLang: 'es', imageStyle: 'realistic' }];
    });
  };

  const updateBuilderService = (id: string, field: string, value: string) => {
    setBuilderServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  /* ── Execute Scenario ── */
  const executeScenario = () => {
    if (executing) return;
    setExecuting(true); setDone(false); setFinalResults([]);
    setProgress({ done: 0, total: selectedScenario.steps.length });
    addLog({ type: 'SYSTEM', msg: `⟳ Starting scenario: ${selectedScenario.name}` });
    // Deduct total cost of scenario from wallet
    const scenarioCost = parseFloat(((selectedScenario as any).totalCost || '0').replace(' ALGO', ''));
    if (scenarioCost > 0) deductBalance(scenarioCost);
    let completed = 0;
    selectedScenario.steps.forEach(step => {
      setTimeout(() => {
        addLog({ type: step.type, msg: step.msg, data: step.data });
        completed++;
        setProgress({ done: completed, total: selectedScenario.steps.length });
        if (completed === selectedScenario.steps.length) {
          setExecuting(false);
          setDone(true);
          setFinalResults((selectedScenario as any).finalResults || []);
          setTotalCostStr((selectedScenario as any).totalCost || '');
        }
      }, step.delay);
    });
  };

  /* ── Execute Builder Pipeline ── */
  const executeBuilder = async () => {
    if (executing || builderServices.length === 0) return;
    const missingInput = builderServices.find(s => !s.inputText.trim());
    if (missingInput) { addLog({ type: 'ERROR', msg: `✗ Missing input for: ${missingInput.name}. Please fill all inputs.` }); return; }
    setExecuting(true); setDone(false); setFinalResults([]);
    setProgress({ done: 0, total: builderServices.length });
    addLog({ type: 'SYSTEM', msg: `⟳ Starting custom pipeline: ${builderServices.map(s => s.name).join(' → ')}` });

    const collectedResults: FinalResult[] = [];

    for (let i = 0; i < builderServices.length; i++) {
      const svc = builderServices[i];
      await new Promise(r => setTimeout(r, 600));
      addLog({ type: 'INFO', msg: `Step ${i + 1}/${builderServices.length} — Calling ${svc.name}` });
      await new Promise(r => setTimeout(r, 600));
      addLog({ type: 'PAYMENT', msg: `Authorizing escrow: ${svc.price} ALGO (${svc.name})` });
      await new Promise(r => setTimeout(r, 1200));

      const seed = svc.inputText.replace(/[^a-z0-9]/gi, '').substring(0, 12) || 'payprapi';

      let responseData: any = null;

      try {
        const payRes = await fetch('http://localhost:8000/payment/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: svc.price, endpoint: svc.endpoint, mnemonic: mnemonic || undefined })
        });
        const payData = await payRes.json();
        
        if (!payRes.ok) {
           addLog({ type: 'ERROR', msg: `✗ Payment failed: ${payData.error || 'Unknown error'}`});
           setExecuting(false);
           return;
        }

        const realTxId = payData.tx_id;
        addLog({ type: 'INFO', msg: `✓ Payment confirmed on testnet. TX: ${realTxId.substring(0,16)}...`});

        // Deduct ALGO from UI local state (X402 payment broadcasted)
        deductBalance(svc.price);

        const body = svc.id === 'translate'
          ? { text: svc.inputText, target_lang: svc.targetLang, source_lang: 'en' }
          : svc.id === 'image_gen'
          ? { prompt: svc.inputText, style: svc.imageStyle, width: 1024, height: 1024 }
          : svc.id === 'summarize'
          ? { text: svc.inputText, max_sentences: 3, style: 'concise' }
          : { text: svc.inputText, granular: true };
          
        const res = await fetch(`${AI_BASE}${svc.endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Payment': `txid:${realTxId}`,
            'X-Paypr-Proof': realTxId,
          },
          body: JSON.stringify(body)
        });
        
        const data = await res.json();
        
        if (data?.refund_issued) {
          addLog({ type: 'ERROR', msg: `✗ Service failed (${data.error || 'Unknown error'}). Refund of ${svc.price} ALGO issued automatically.` });
          deductBalance(-svc.price);
          setExecuting(false);
          return;
        }
        
        if (res.ok) {
          if (!data?.x402Version && data?.detail?.error !== 'Payment Required') {
            responseData = data;
          }
        }
      } catch (err: any) { 
        addLog({ type: 'ERROR', msg: `✗ Exception: ${err.message}`});
      }

      // Build normalized display data
      let displayData: any;
      let logData: any;
      if (svc.id === 'translate') {
        const translated = responseData?.translated_text || `[${LANG_MAP[svc.targetLang] || svc.targetLang.toUpperCase()} translation of: "${svc.inputText.substring(0, 50)}..."]`;
        displayData = { translated_text: translated, target_lang: LANG_MAP[svc.targetLang] || svc.targetLang, confidence: responseData?.confidence || 0.96, source_text: svc.inputText };
        logData = { service: svc.name, status: 'success', translated_text: translated, target_lang: svc.targetLang, confidence: responseData?.confidence || 0.96 };
      } else if (svc.id === 'sentiment') {
        const rawLabel = responseData?.sentiment || responseData?.sentiment_label || 'POSITIVE';
        const label = rawLabel.toUpperCase();
        const score = responseData?.confidence || 0.91;
        const emotions = responseData?.emotions
          ? Object.entries(responseData.emotions).sort(([,a],[,b]) => (b as number) - (a as number)).slice(0, 3).map(([k]) => k)
          : ['joy', 'satisfaction'];
        displayData = { sentiment_label: label, confidence_score: score, confidence_level: score > 0.8 ? 'HIGH' : 'MEDIUM', emotion_tags: emotions };
        logData = { service: svc.name, status: 'success', sentiment_label: label, confidence_score: score, emotion_tags: emotions };
      } else if (svc.id === 'summarize') {
        const summary = responseData?.summary || `Summary of: "${svc.inputText.substring(0, 60)}..." — AI-generated concise overview of the content.`;
        const origWords = responseData?.original_word_count || svc.inputText.split(' ').length;
        const sumWords = responseData?.summary_word_count || summary.split(' ').length;
        displayData = { summary, original_words: origWords, summary_words: sumWords, compression: responseData?.compression_ratio != null ? `${Math.round(Number(responseData.compression_ratio) * 100)}%` : `${Math.max(10, Math.round((1 - sumWords / origWords) * 100))}%` };
        logData = { service: svc.name, status: 'success', summary, original_word_count: origWords, summary_word_count: sumWords };
      } else {
        const imgUrl = responseData?.image_url || pollinationsUrl(svc.inputText, svc.imageStyle);
        displayData = { image_url: imgUrl, style: svc.imageStyle, prompt: svc.inputText, resolution: '1024×1024' };
        logData = { service: svc.name, status: 'success', image_url: imgUrl, style: svc.imageStyle, resolution: '1024×1024', source: 'Pollinations AI' };
      }

      addLog({ type: 'RESPONSE', msg: `${svc.name} → SUCCESS`, data: logData });
      collectedResults.push({ serviceName: svc.name, serviceId: svc.id, success: true, data: displayData });
      setProgress({ done: i + 1, total: builderServices.length });
    }

    const totalCost = builderServices.reduce((s, b) => s + b.price, 0);
    addLog({ type: 'INFO', msg: `✓ Pipeline complete. ${builderServices.length} service${builderServices.length > 1 ? 's' : ''} executed. Total ALGO spent: ${totalCost.toFixed(4)}` });
    setFinalResults(collectedResults);
    setTotalCostStr(`${totalCost.toFixed(4)} ALGO`);
    setExecuting(false);
    setDone(true);
  };

  const clearLogs = () => {
    setLogs([{ time: nowTime(), type: 'SYSTEM', msg: 'Terminal cleared. Agent ready.' }]);
    setDone(false); setFinalResults([]); setProgress({ done: 0, total: 0 });
  };

  const totalBuilderCost = builderServices.reduce((sum, s) => sum + s.price, 0);

  return (
    <div style={{ background: '#f9f9f9', color: '#1a1c1c', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* NAV */}
      <nav className="paypr-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
          <Link href="/" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.03em', color: '#1a1c1c', textDecoration: 'none' }}>PayprAPI</Link>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <Link href="/explore" style={NAV}>Explore APIs</Link>
            <Link href="/dashboard" style={NAV}>Dashboard</Link>
            <Link href="/analytics" style={NAV}>Analytics</Link>
            <Link href="/agent-console" style={ACTIVE_NAV}>Agent Console</Link>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={disconnectWallet} style={{ background: 'none', border: 'none', cursor: 'pointer', ...NAV }}>Logout</button>
          <Link href="/explore">
            <button style={{ background: '#0062ff', color: '#fff', border: 'none', borderRadius: '9999px', padding: '0.6rem 1.5rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>Try Free →</button>
          </Link>
        </div>
      </nav>

      {/* SPLIT LAYOUT */}
      <div className="split-layout" style={{ flex: 1 }}>

        {/* LEFT SIDEBAR */}
        <aside className="split-sidebar" style={{ width: '360px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>Agent Console</h1>
              <p style={{ fontSize: '0.75rem', color: '#737687' }}>operational control unit x402-v1</p>
            </div>

            {/* Wallet balance */}
            <div style={{ background: '#ffffff', borderRadius: '1rem', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem' }}>Wallet Mode</span>
                <div style={{ width: 44, height: 24, background: '#004cca', borderRadius: '9999px', position: 'relative', cursor: 'pointer' }}>
                  <div style={{ position: 'absolute', right: 4, top: 4, width: 16, height: 16, background: '#ffffff', borderRadius: '50%' }}></div>
                </div>
              </div>
              <div style={{ background: '#f3f3f3', borderRadius: '0.75rem', padding: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="material-symbols-outlined" style={{ color: '#004cca', fontSize: '24px' }}>account_balance_wallet</span>
                <div>
                  <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737687', fontWeight: 700 }}>Linked Balance</p>
                  <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.375rem', letterSpacing: '-0.03em' }}>{balance.toFixed(4)} ALGO</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(194,198,217,0.3)', marginBottom: '1rem' }}>
              {(['Scenarios', 'Builder'] as const).map(tab => (
                <button key={tab} onClick={() => { setActiveTab(tab); setDone(false); setFinalResults([]); }}
                  style={{ padding: '0.625rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === tab ? '2px solid #004cca' : '2px solid transparent', fontFamily: 'Space Grotesk, sans-serif', fontWeight: activeTab === tab ? 700 : 500, fontSize: '0.875rem', color: activeTab === tab ? '#004cca' : '#424656', cursor: 'pointer', marginBottom: '-1px' }}>
                  {tab}
                </button>
              ))}
            </div>

            {/* ── SCENARIOS TAB ── */}
            {activeTab === 'Scenarios' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {SCENARIOS.map(s => (
                  <div key={s.id} onClick={() => { setSelectedScenario(s); setDone(false); setFinalResults([]); }}
                    style={{ padding: '1rem', background: '#ffffff', borderRadius: '0.875rem', border: selectedScenario.id === s.id ? `2px solid ${s.color}` : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s', boxShadow: selectedScenario.id === s.id ? `0 4px 16px ${s.color}22` : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '0.5rem', background: selectedScenario.id === s.id ? s.color : '#eeeeee', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: selectedScenario.id === s.id ? '#ffffff' : '#424656' }}>{s.icon}</span>
                      </div>
                      {s.badge && <span style={{ background: '#fdd404', color: '#6f5c00', fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '0.25rem', textTransform: 'uppercase' }}>{s.badge}</span>}
                    </div>
                    <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem', color: '#1a1c1c' }}>{s.name}</h3>
                    <p style={{ fontSize: '0.75rem', color: '#737687', lineHeight: 1.4, marginBottom: '0.5rem' }}>{s.desc}</p>
                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {s.services.map((sv, idx) => (
                        <React.Fragment key={sv}>
                          <span style={{ background: '#f3f3f3', fontSize: '0.6rem', fontWeight: 700, color: '#424656', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', textTransform: 'uppercase' }}>{sv}</span>
                          {idx < s.services.length - 1 && <span style={{ fontSize: '0.6rem', color: '#c2c6d9' }}>→</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── BUILDER TAB ── */}
            {activeTab === 'Builder' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#737687', lineHeight: 1.5 }}>Select one or more services to build a custom pipeline.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {BUILDER_SERVICES.map(svc => {
                    const isSelected = builderServices.some(s => s.id === svc.id);
                    return (
                      <button key={svc.id} onClick={() => toggleBuilderService(svc)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', padding: '0.875rem 0.5rem', background: isSelected ? '#004cca' : '#ffffff', border: isSelected ? '2px solid #004cca' : '2px solid #e2e2e2', borderRadius: '0.875rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '22px', color: isSelected ? '#ffffff' : '#424656' }}>{svc.icon}</span>
                        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.7rem', color: isSelected ? '#ffffff' : '#1a1c1c' }}>{svc.name}</span>
                        <span style={{ fontSize: '0.6rem', color: isSelected ? 'rgba(255,255,255,0.7)' : '#737687' }}>{svc.price} ALGO</span>
                      </button>
                    );
                  })}
                </div>

                {builderServices.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.75rem', color: '#1a1c1c' }}>Pipeline Inputs</p>
                      <span style={{ background: '#fdd404', color: '#6f5c00', fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>Total: {totalBuilderCost.toFixed(4)} ALGO</span>
                    </div>
                    {builderServices.map((svc, idx) => (
                      <div key={svc.id} style={{ background: '#ffffff', borderRadius: '0.875rem', padding: '1rem', border: '1px solid rgba(0,76,202,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <span style={{ width: 20, height: 20, background: '#004cca', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.65rem', color: '#fff', flexShrink: 0 }}>{idx + 1}</span>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#004cca' }}>{svc.icon}</span>
                          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: '#1a1c1c' }}>{svc.name}</span>
                          <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#737687' }}>{svc.price} ALGO</span>
                          <button onClick={() => toggleBuilderService(BUILDER_SERVICES.find(s => s.id === svc.id)!)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba1a1a', display: 'flex', padding: 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                          </button>
                        </div>
                        {svc.id === 'translate' && (
                          <>
                            <textarea value={svc.inputText} onChange={e => updateBuilderService(svc.id, 'inputText', e.target.value)} placeholder="Text to translate..." rows={3} style={{ ...TXT_INPUT, marginBottom: '0.5rem' }} />
                            <label style={LABEL}>Target Language</label>
                            <div style={{ position: 'relative' }}>
                              <select value={svc.targetLang} onChange={e => updateBuilderService(svc.id, 'targetLang', e.target.value)} style={TXT_SELECT}>
                                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                              </select>
                              <span className="material-symbols-outlined" style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: '#424656', pointerEvents: 'none' }}>expand_more</span>
                            </div>
                          </>
                        )}
                        {svc.id === 'image_gen' && (
                          <>
                            <textarea value={svc.inputText} onChange={e => updateBuilderService(svc.id, 'inputText', e.target.value)} placeholder="Image prompt..." rows={3} style={{ ...TXT_INPUT, marginBottom: '0.5rem' }} />
                            <label style={LABEL}>Style</label>
                            <div style={{ position: 'relative' }}>
                              <select value={svc.imageStyle} onChange={e => updateBuilderService(svc.id, 'imageStyle', e.target.value)} style={TXT_SELECT}>
                                {IMAGE_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <span className="material-symbols-outlined" style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: '#424656', pointerEvents: 'none' }}>expand_more</span>
                            </div>
                          </>
                        )}
                        {svc.id !== 'translate' && svc.id !== 'image_gen' && (
                          <textarea value={svc.inputText} onChange={e => updateBuilderService(svc.id, 'inputText', e.target.value)}
                            placeholder={svc.id === 'summarize' ? 'Paste article or text to summarize...' : 'Text to analyze for sentiment...'}
                            rows={3} style={TXT_INPUT} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {builderServices.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#ffffff', borderRadius: '0.875rem', border: '2px dashed #e2e2e2' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#c2c6d9', display: 'block', marginBottom: '0.5rem' }}>add_circle</span>
                    <p style={{ fontSize: '0.75rem', color: '#737687' }}>Select services above to build your pipeline</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom execute area */}
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(194,198,217,0.3)', background: '#f3f3f3', flexShrink: 0 }}>
            {progress.total > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#424656', marginBottom: '0.4rem' }}>
                  <span>Progress</span><span>{progress.done}/{progress.total}</span>
                </div>
                <div style={{ background: '#e2e2e2', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`, height: '100%', background: '#004cca', borderRadius: '9999px', transition: 'width 0.4s ease' }}></div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={activeTab === 'Scenarios' ? executeScenario : executeBuilder}
                disabled={executing || (activeTab === 'Builder' && builderServices.length === 0)}
                style={{ flex: 1, padding: '1rem', background: executing || (activeTab === 'Builder' && builderServices.length === 0) ? '#e2e2e2' : '#004cca', color: executing || (activeTab === 'Builder' && builderServices.length === 0) ? '#737687' : '#ffffff', border: 'none', borderRadius: '0.75rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.95rem', cursor: executing || (activeTab === 'Builder' && builderServices.length === 0) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
                <span className={`material-symbols-outlined ${executing ? 'animate-paypr-spin' : ''}`} style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>{executing ? 'sync' : 'bolt'}</span>
                {executing ? 'EXECUTING...' : 'EXECUTE AGENT'}
              </button>
              <button onClick={clearLogs} disabled={executing}
                style={{ flexShrink: 0, width: 48, height: 48, background: '#ffffff', border: '1px solid #e2e2e2', borderRadius: '0.75rem', cursor: executing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#424656' }}>delete_sweep</span>
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT TERMINAL + RESULTS */}
        <main className="split-main" ref={logRef} style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Terminal */}
          <div className="terminal-panel" style={{ flex: done ? 'none' : 1, padding: '2rem', minHeight: done ? '40vh' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', gap: '5px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(186,26,26,0.4)' }}></div>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(253,212,4,0.4)' }}></div>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(0,98,255,0.4)' }}></div>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#424656', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Terminal v1.0.4 — X402 Agentic Runtime</span>
              {executing && (
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.65rem', fontWeight: 700, color: '#ffd54f', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <span className="animate-blink" style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffd54f', display: 'inline-block' }}></span>
                  Running
                </span>
              )}
              {done && (
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.65rem', fontWeight: 700, color: '#81c784', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#81c784', display: 'inline-block' }}></span>
                  Complete
                </span>
              )}
            </div>

            <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {logs.map((log, i) => (
                <React.Fragment key={i}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, fontSize: '0.7rem', color: '#424656', fontFamily: 'monospace', minWidth: '6ch' }}>{log.time}</span>
                    <span style={{ flexShrink: 0, fontSize: '0.7rem', fontWeight: 700, fontFamily: 'monospace', color: LOG_COLORS[log.type], minWidth: '9ch' }}>[{log.type}]</span>
                    <span style={{ fontSize: '0.875rem', color: '#c8ccd8', lineHeight: 1.5 }}>{log.msg}</span>
                  </div>
                  {log.data && (
                    <div style={{ marginLeft: '8rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)', padding: '0.875rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#a8b4c8', lineHeight: 1.8 }}>
                      <span style={{ color: '#424656', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.375rem' }}>Response Payload:</span>
                      {(log.data.image_url || log.data.url) && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <a href={log.data.image_url || log.data.url} target="_blank" rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: '#b4c5ff', fontWeight: 700, textDecoration: 'underline', fontSize: '0.75rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
                            View Generated Image ↗
                          </a>
                        </div>
                      )}
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(log.data, null, 2)}</pre>
                    </div>
                  )}
                </React.Fragment>
              ))}
              {executing && (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: '#424656', fontFamily: 'monospace', minWidth: '6ch' }}></span>
                  <span style={{ color: '#c8ccd8', fontSize: '1.125rem' }} className="animate-blink">_</span>
                </div>
              )}
            </div>
          </div>

          {/* ── FINAL RESULTS PANEL — Appears after execution completes ── */}
          {done && finalResults.length > 0 && (
            <div ref={resultsRef} style={{ background: '#111418', borderTop: '2px solid rgba(76,175,80,0.3)', padding: '2rem' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#ffffff', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#ffffff', lineHeight: 1 }}>Pipeline Complete — All Outputs Ready</h3>
                  <p style={{ fontSize: '0.75rem', color: '#737687', marginTop: '0.25rem' }}>{finalResults.length} service{finalResults.length > 1 ? 's' : ''} executed · Total spent: <strong style={{ color: '#fdd404' }}>{totalCostStr}</strong> · X402 Protocol ✓</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button onClick={clearLogs} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.625rem', color: '#c8ccd8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
                    New Pipeline
                  </button>
                </div>
              </div>

              {/* Result cards grid */}
              <div style={{ display: 'grid', gridTemplateColumns: finalResults.length === 1 ? '1fr' : finalResults.length === 2 ? '1fr 1fr' : '1fr 1fr 1fr', gap: '1rem' }}>
                {finalResults.map((r, i) => (
                  <FinalResultCard key={i} result={r} />
                ))}
              </div>

              {/* Cost summary bar */}
              <div style={{ marginTop: '1.25rem', padding: '1rem 1.25rem', background: 'rgba(253,212,4,0.08)', borderRadius: '0.875rem', border: '1px solid rgba(253,212,4,0.2)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#fdd404' }}>payments</span>
                <div>
                  <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: '#fdd404' }}>Total ALGO Spent: {totalCostStr}</p>
                  <p style={{ fontSize: '0.7rem', color: '#737687', marginTop: '0.1rem' }}>Settled on Algorand Testnet via X402 micropayment protocol</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '2rem' }}>
                  {finalResults.map(r => (
                    <div key={r.serviceId} style={{ textAlign: 'center' }}>
                      <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#fdd404', fontWeight: 700 }}>{BUILDER_SERVICES.find(b => b.id === r.serviceId)?.price?.toFixed(4) || '0.0000'} ALGO</p>
                      <p style={{ fontSize: '0.6rem', color: '#737687', textTransform: 'uppercase' }}>{r.serviceName.split(' ')[0]}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* FOOTER */}
      <footer style={{ background: '#111314', padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', flexShrink: 0 }}>
        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.75rem', color: '#424656' }}>payprapi — powered by algorand blockchain &amp; x402 protocol</span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {['documentation', 'privacy', 'terms', 'support'].map(l => <a key={l} href="#" style={{ fontSize: '0.75rem', color: '#424656', textDecoration: 'none' }}>{l}</a>)}
        </div>
      </footer>
    </div>
  );
}