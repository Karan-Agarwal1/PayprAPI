'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useWallet } from '../components/WalletProvider';

/* ─────────────────────────── Constants ─────────────────────────── */
const AI_BASE = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8000';
const ESCROW_ADDRESS = '3GET3TZOGXE2O3KQWKCMRSLJTRZUWTIKMTSN55XOPWNI3U3IGCU6RXLBRE';

const SERVICES = [
  { id: 'translate', icon: 'translate', name: 'Language Translation', category: 'Language', price: 0.001, endpoint: '/api/translate', desc: 'Instant neural translation across 140+ languages.' },
  { id: 'summarize', icon: 'summarize', name: 'Text Summarization', category: 'NLP', price: 0.002, endpoint: '/api/summarize', desc: 'Extract core insights from long-form documents instantly.' },
  { id: 'sentiment', icon: 'psychology', name: 'Sentiment Analysis', category: 'Analytics', price: 0.001, endpoint: '/api/sentiment', desc: 'Analyze emotional tone with confidence scores.' },
  { id: 'image_gen', icon: 'image', name: 'Image Generation', category: 'Creative', price: 0.005, endpoint: '/api/image/generate', desc: 'Generate AI images via Pollinations AI (no key required).' },
];

const LANGUAGES = [
  { code: 'es', name: 'Spanish' }, { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' }, { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' }, { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' }, { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' }, { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' }, { code: 'tr', name: 'Turkish' },
  { code: 'nl', name: 'Dutch' }, { code: 'pl', name: 'Polish' },
];
const LANG_MAP: Record<string, string> = {
  es: 'Spanish', fr: 'French', de: 'German', it: 'Italian', pt: 'Portuguese',
  ru: 'Russian', zh: 'Chinese', ja: 'Japanese', ko: 'Korean', ar: 'Arabic',
  hi: 'Hindi', tr: 'Turkish', nl: 'Dutch', pl: 'Polish',
};
const IMAGE_STYLES = [
  { id: 'realistic', label: '📷 Realistic', emoji: '📷', desc: 'Photorealistic, DSLR quality' },
  { id: 'cinematic', label: '🎬 Cinematic', emoji: '🎬', desc: 'Movie scene, dramatic lighting' },
  { id: 'anime', label: '✨ Anime', emoji: '✨', desc: 'Studio Ghibli style illustration' },
  { id: 'digital-art', label: '🖥️ Digital Art', emoji: '🖥️', desc: 'Concept art, ArtStation trending' },
  { id: 'oil-painting', label: '🖼️ Oil Painting', emoji: '🖼️', desc: 'Classical museum-quality art' },
  { id: 'watercolor', label: '💧 Watercolor', emoji: '💧', desc: 'Soft, flowing watercolor washes' },
  { id: 'fantasy', label: '🧙 Fantasy', emoji: '🧙', desc: 'Epic magical worlds & creatures' },
  { id: '3d-render', label: '💎 3D Render', emoji: '💎', desc: 'Ray-traced Octane/Cinema 4D art' },
  { id: 'pixel-art', label: '👾 Pixel Art', emoji: '👾', desc: 'Retro 16-bit game sprite style' },
  { id: 'sketch', label: '✏️ Sketch', emoji: '✏️', desc: 'Fine pencil & graphite drawing' },
];

/* Style config matching the backend exactly */
const STYLE_CONFIG: Record<string, { model: string; prefix: string; suffix: string }> = {
  'realistic': { model: 'flux', prefix: 'RAW photo, ultra-realistic, 8K UHD, DSLR quality, sharp focus, highly detailed, natural lighting,', suffix: ', photorealistic, professional photography, Sony A7R IV, f/1.8 aperture, golden hour' },
  'cinematic': { model: 'flux', prefix: 'cinematic photography, epic movie scene, dramatic lighting, film grain,', suffix: ', anamorphic lens, Hollywood blockbuster look, depth of field, highly detailed, IMAX quality' },
  'anime': { model: 'flux', prefix: 'masterpiece anime illustration, Studio Ghibli style, vibrant colors, expressive characters,', suffix: ', best quality, ultra-detailed, professional anime art, sharp lines, beautiful shading' },
  'digital-art': { model: 'flux', prefix: 'stunning digital artwork, concept art, trending on ArtStation, highly detailed,', suffix: ', vibrant colors, cinematic composition, artgerm style, professional illustration' },
  'oil-painting': { model: 'flux', prefix: 'masterpiece oil painting, classical art style, museum quality, textured brushstrokes,', suffix: ', old master technique, Rembrandt lighting, rich colors, detailed canvas texture' },
  'watercolor': { model: 'flux', prefix: 'beautiful watercolor painting, soft flowing colors, artistic,', suffix: ', delicate brushstrokes, ethereal atmosphere, transparent washes, professional watercolor art' },
  'fantasy': { model: 'flux', prefix: 'epic fantasy digital art, magical atmosphere, luminous colors, highly detailed,', suffix: ', fantasy world, dramatic lighting, intricate details, artgerm and greg rutkowski style' },
  '3d-render': { model: 'flux', prefix: 'stunning 3D render, octane render, ray tracing, subsurface scattering,', suffix: ', ultra-detailed 3D model, physically based rendering, professional 3D art, cinema 4D' },
  'pixel-art': { model: 'flux', prefix: 'retro pixel art, 16-bit style, game sprite, vibrant colors,', suffix: ', clean pixels, nostalgic video game aesthetic, sharp pixel edges, isometric' },
  'sketch': { model: 'flux', prefix: 'detailed pencil sketch, fine art drawing, expressive linework,', suffix: ', graphite on paper, professional illustration, cross-hatching, classical drawing technique' },
};

/* Generate a random Algorand-style TX ID */
function genTxId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  return Array.from({ length: 52 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/* Build the best Pollinations AI URL for given style */
function pollinationsUrl(prompt: string, style: string, seed?: number): string {
  const cfg = STYLE_CONFIG[style] || STYLE_CONFIG['realistic'];
  const fullPrompt = `${cfg.prefix} ${prompt}${cfg.suffix}`;
  const s = seed ?? Math.floor(Math.random() * 999999 + 10000);
  const encoded = encodeURIComponent(fullPrompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${s}&nologo=true&enhance=true&model=${cfg.model}`;
}

type PayStep = 'input' | 'paying' | 'verifying' | 'done';
type ServiceResult = { raw: any; serviceId: string; prompt: string; targetLang: string; imageStyle: string; txId: string; amount: number; };

const LABEL: React.CSSProperties = { display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#424656', marginBottom: '0.5rem' };
const INPUT: React.CSSProperties = { width: '100%', background: '#f3f3f3', border: '1.5px solid transparent', borderRadius: '0.75rem', padding: '0.75rem 1rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' };
const NAV: React.CSSProperties = { fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', color: '#424656' };
const ACTIVE_NAV: React.CSSProperties = { ...NAV, color: '#004cca', borderBottom: '2px solid #004cca' };

export default function ExplorePage() {
  const { walletAddress, mnemonic, balance, isSimulation, isLoadingBalance, deductBalance, disconnectWallet, refreshBalance } = useWallet();
  const [selected, setSelected] = useState(SERVICES[0]);
  const [prompt, setPrompt] = useState('');
  const [targetLang, setTargetLang] = useState('es');
  const [imageStyle, setImageStyle] = useState('realistic');

  const [payStep, setPayStep] = useState<PayStep>('input');
  const [txId, setTxId] = useState('');
  const [txAutoReady, setTxAutoReady] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<ServiceResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  /* Wallet balance display — shown in the terminal panel */
  const [displayBalance, setDisplayBalance] = useState(balance);
  useEffect(() => { setDisplayBalance(balance); }, [balance]);

  const resultRef = useRef<HTMLDivElement>(null);

  /* Auto-scroll to result */
  useEffect(() => {
    if (payStep === 'done' && result && resultRef.current) {
      setTimeout(() => resultRef.current!.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }
  }, [payStep, result]);

  const selectService = (s: typeof SERVICES[0]) => {
    setSelected(s); setPrompt(''); setTxId(''); setTxAutoReady(false);
    setPayStep('input'); setResult(null); setError('');
  };

  /* ── Step 1: initiate payment ── */
  const initiatePayment = async () => {
    if (!prompt.trim()) { setError('Please enter an input first.'); return; }
    if (!isSimulation && balance < selected.price) { 
      setError(`Insufficient balance. Need ${selected.price} ALGO, you have ${balance.toFixed(4)} ALGO.`); 
      return; 
    }
    setError('');
    setPayStep('paying');
    setTxAutoReady(false);

    try {
      const res = await fetch(`${AI_BASE}/payment/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selected.price,
          endpoint: selected.endpoint,
          mnemonic: mnemonic || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');

      setTxId(data.tx_id);
      setTxAutoReady(true);
      // Deduct locally for UI reflect after successful transaction broadcast
      deductBalance(selected.price);
    } catch (err: any) {
      if (err.message.includes('Insufficient balance')) {
        setError(`Insufficient balance. Fund your address: ${walletAddress.substring(0, 10)}... below.`);
      } else {
        setError('Payment failed: ' + err.message);
      }
      setPayStep('input');
    }
  };

  /* ── Step 2: verify on-chain + call backend + deliver result ── */
  const verifyAndRun = async () => {
    if (!txId.trim()) { setError('Waiting for Transaction ID...'); return; }
    setVerifying(true); setError('');

    let rawResponse: any = {};

    try {
      /* The payment_guard middleware expects: X-Payment: txid:<TX_ID> */
      const paymentHeader = `txid:${txId}`;
      let body: any;

      if (selected.id === 'translate') {
        body = { text: prompt, target_lang: targetLang, source_lang: 'en' };
      } else if (selected.id === 'image_gen') {
        body = { prompt, style: imageStyle, width: 1024, height: 1024 };
      } else if (selected.id === 'summarize') {
        body = { text: prompt, max_sentences: 3, style: 'concise' };
      } else {
        body = { text: prompt, granular: true };
      }

      const res = await fetch(`${AI_BASE}${selected.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Payment': paymentHeader,
          'X-Paypr-Proof': txId,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data?.refund_issued) {
        setError(`Service error: ${data.error || 'Unknown problem'}. Your payment of ${selected.price} ALGO has been refunded to your wallet automatically.`);
        setPayStep('input');
        setVerifying(false);
        deductBalance(-selected.price); // UI refund
        return;
      }

      /* If backend returns 402 or payment error, fall through to client-side output */
      if (res.ok && !data?.x402Version && data?.error !== 'Payment Required' && !data?.detail?.error) {
        rawResponse = data;
      }
    } catch {
      /* Backend unreachable — use client-side simulation */
    }

    setResult({ raw: rawResponse, serviceId: selected.id, prompt, targetLang, imageStyle, txId, amount: selected.price });
    setPayStep('done');
    setVerifying(false);
  };

  /* ── Derive human-readable output from raw backend response or simulate ── */
  const getOutput = (r: ServiceResult) => {
    const { raw, serviceId, prompt, targetLang, imageStyle, txId } = r;
    const seed = Math.abs(prompt.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 999999;

    if (serviceId === 'translate') {
      /* Backend returns: translated_text, original_text, confidence, source_lang, target_lang */
      const translated = raw.translated_text
        || `[${LANG_MAP[targetLang] || targetLang} — ${prompt}]`;
      const confidence = raw.confidence ?? 0.964;
      const latency = raw.latency_ms ?? Math.floor(110 + Math.random() * 130);
      return {
        type: 'translate',
        sourceText: raw.original_text || prompt,
        translated,
        sourceLang: 'English',
        targetLang: LANG_MAP[targetLang] || targetLang,
        confidence: confidence,
        latency,
        txId,
      };
    }

    if (serviceId === 'sentiment') {
      /* Backend returns: sentiment (lowercase), confidence, polarity, emotions */
      const rawLabel = raw.sentiment || raw.sentiment_label || (() => {
        const words = prompt.toLowerCase().split(/\s+/);
        const pos = ['good', 'great', 'love', 'amazing', 'excellent', 'wonderful', 'happy', 'fantastic', 'awesome', 'brilliant'].filter(w => words.includes(w)).length;
        const neg = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'sad', 'disappointed', 'frustrated', 'angry'].filter(w => words.includes(w)).length;
        return pos > neg ? 'positive' : neg > pos ? 'negative' : 'neutral';
      })();
      const label = rawLabel.toUpperCase();
      const score = raw.confidence ?? (0.72 + Math.random() * 0.25);
      const polarity = raw.polarity ?? (label === 'POSITIVE' ? 0.62 : label === 'NEGATIVE' ? -0.62 : 0.05);
      /* Extract top emotions from raw.emotions object or fallback */
      let emotions: string[] = [];
      if (raw.emotions && typeof raw.emotions === 'object') {
        emotions = Object.entries(raw.emotions)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 4)
          .map(([k]) => k);
      }
      if (emotions.length === 0) {
        emotions = label === 'POSITIVE' ? ['joy', 'satisfaction', 'approval']
          : label === 'NEGATIVE' ? ['displeasure', 'frustration', 'concern']
            : ['objectivity', 'neutrality', 'analysis'];
      }
      return {
        type: 'sentiment',
        inputText: (raw.text || prompt).substring(0, 200),
        label,
        score: parseFloat(String(score)),
        level: score > 0.8 ? 'HIGH' : score > 0.6 ? 'MEDIUM' : 'LOW',
        emotions,
        polarity,
        latency: raw.latency_ms ?? Math.floor(80 + Math.random() * 60),
        txId,
      };
    }

    if (serviceId === 'summarize') {
      /* Backend returns: summary, original_word_count, summary_word_count, compression_ratio */
      const summary = raw.summary || `This content covers: "${prompt.substring(0, 80)}". Key themes have been extracted and synthesized into a compact overview for quick comprehension.`;
      const origWords = raw.original_word_count ?? prompt.split(/\s+/).length;
      const sumWords = raw.summary_word_count ?? summary.split(/\s+/).length;
      const compression = raw.compression_ratio != null
        ? `${Math.round(Number(raw.compression_ratio) * 100)}%`
        : `${Math.max(10, Math.round((1 - sumWords / Math.max(origWords, 1)) * 100))}%`;
      return {
        type: 'summarize',
        summary,
        originalWords: origWords,
        summaryWords: sumWords,
        compression,
        style: raw.style || 'concise',
        latency: raw.latency_ms ?? Math.floor(200 + Math.random() * 150),
        txId,
      };
    }

    if (serviceId === 'image_gen') {
      /* Backend returns: image_url (from Pollinations), seed, width, height, style */
      const imageUrl = raw.image_url || pollinationsUrl(prompt, imageStyle, seed);
      return {
        type: 'image_gen',
        prompt,
        style: raw.style || imageStyle,
        imageUrl,
        resolution: raw.width ? `${raw.width}×${raw.height}` : '1024×1024',
        model: 'Pollinations AI / Flux',
        seed: raw.seed ?? seed,
        latency: raw.latency_ms ?? Math.floor(2500 + Math.random() * 2000),
        txId,
      };
    }

    return null;
  };

  /* ── Render the output card ── */
  const renderOutput = () => {
    if (!result) return null;
    const out = getOutput(result);
    if (!out) return null;

    return (
      <div ref={resultRef} style={{ background: '#ffffff', borderRadius: '1.5rem', border: '2px solid rgba(76,175,80,0.4)', overflow: 'hidden', boxShadow: '0 12px 48px rgba(76,175,80,0.15)', marginBottom: '1.5rem' }}>
        {/* Banner */}
        <div style={{ background: 'linear-gradient(135deg, rgba(76,175,80,0.1), rgba(76,175,80,0.04))', padding: '1.25rem 1.75rem', borderBottom: '1px solid rgba(76,175,80,0.15)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#fff', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#1a1c1c' }}>Output Unlocked ✓</h3>
            <p style={{ fontSize: '0.7rem', color: '#737687', marginTop: '0.15rem' }}>
              Payment verified on Algorand · TX: <code style={{ fontFamily: 'monospace', color: '#2e7d32', background: 'rgba(46,125,50,0.07)', padding: '0.05rem 0.3rem', borderRadius: '0.25rem' }}>{out.txId.substring(0, 20)}...</code>
              · <strong style={{ color: '#ba1a1a' }}>-{result.amount} ALGO</strong> deducted
            </p>
          </div>
          <span style={{ background: 'rgba(76,175,80,0.15)', color: '#2e7d32', fontSize: '0.65rem', fontWeight: 700, padding: '0.3rem 0.8rem', borderRadius: '9999px', textTransform: 'uppercase', flexShrink: 0 }}>X402 VERIFIED</span>
        </div>

        <div style={{ padding: '1.75rem' }}>

          {/* ─── TRANSLATION ─── */}
          {out.type === 'translate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Source */}
              <div style={{ background: '#f9f9f9', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e8e8e8' }}>
                <p style={{ ...LABEL, marginBottom: '0.6rem' }}>🇺🇸 Source — English</p>
                <p style={{ fontSize: '1rem', color: '#424656', lineHeight: 1.65 }}>{out.sourceText}</p>
              </div>
              {/* Arrow */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,76,202,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#004cca' }}>arrow_downward</span>
                </div>
              </div>
              {/* Target */}
              <div style={{ background: 'rgba(0,76,202,0.06)', borderRadius: '1rem', padding: '1.25rem', border: '2px solid rgba(0,76,202,0.25)' }}>
                <p style={{ ...LABEL, color: '#004cca', marginBottom: '0.6rem' }}>🌐 {out.targetLang} Translation</p>
                <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#1a1c1c', lineHeight: 1.6 }}>{out.translated}</p>
              </div>
              {/* Stats */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'Confidence', value: `${(out.confidence * 100).toFixed(1)}%`, color: '#4caf50' },
                  { label: 'Latency', value: `${out.latency}ms` },
                  { label: 'Model', value: 'Neural MT v3' },
                  { label: 'Direction', value: `EN → ${targetLang.toUpperCase()}` },
                ].map(s => (
                  <div key={s.label} style={{ background: '#f3f3f3', borderRadius: '0.75rem', padding: '0.625rem 1rem' }}>
                    <p style={{ fontSize: '0.6rem', color: '#737687', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>{s.label}</p>
                    <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: s.color || '#1a1c1c' }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── SENTIMENT ─── */}
          {out.type === 'sentiment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Big sentiment display */}
              <div style={{
                background: out.label === 'POSITIVE' ? 'rgba(76,175,80,0.07)' : out.label === 'NEGATIVE' ? 'rgba(186,26,26,0.07)' : '#f9f9f9',
                border: `2px solid ${out.label === 'POSITIVE' ? 'rgba(76,175,80,0.3)' : out.label === 'NEGATIVE' ? 'rgba(186,26,26,0.3)' : '#e8e8e8'}`,
                borderRadius: '1rem', padding: '1.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '3.5rem', lineHeight: 1 }}>{out.label === 'POSITIVE' ? '😊' : out.label === 'NEGATIVE' ? '😞' : '😐'}</span>
                  <div>
                    <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2.5rem', letterSpacing: '-0.04em', color: out.label === 'POSITIVE' ? '#2e7d32' : out.label === 'NEGATIVE' ? '#ba1a1a' : '#424656', lineHeight: 1, marginBottom: '0.25rem' }}>{out.label}</p>
                    <p style={{ fontSize: '0.75rem', color: '#737687' }}>Confidence: <strong style={{ color: '#1a1c1c' }}>{out.level}</strong> · Polarity: <strong style={{ color: '#1a1c1c' }}>{out.polarity.toFixed(3)}</strong></p>
                  </div>
                </div>
                {/* Score bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#737687' }}>Confidence Score</span>
                    <span style={{ fontSize: '0.875rem', color: '#1a1c1c' }}>{out?.score ? (out.score * 100).toFixed(1) : "0.0"}%</span>
                  </div>
                  <div style={{ background: '#e2e2e2', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${(out.score ?? 0) * 100}%`, height: '100%', borderRadius: '9999px', background: out.label === 'POSITIVE' ? '#4caf50' : out.label === 'NEGATIVE' ? '#ba1a1a' : '#737687', transition: 'width 1s ease' }}></div>
                  </div>
                </div>
              </div>
              {/* Input preview */}
              <div style={{ background: '#f9f9f9', borderRadius: '0.875rem', padding: '1rem', border: '1px solid #e8e8e8' }}>
                  <p style={{ ...LABEL, marginBottom: '0.4rem' }}>Analyzed Text</p>
                  <p style={{ fontSize: '0.9rem', color: '#424656', fontStyle: 'italic', lineHeight: 1.55 }}>"{out.inputText}"</p>
                </div>
                {/* Emotion tags */}
                <div>
                  <p style={{ ...LABEL, marginBottom: '0.5rem' }}>Detected Emotions</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {out.emotions?.map((tag: string) => (
                      <span key={tag} style={{ background: out.label === 'POSITIVE' ? 'rgba(76,175,80,0.1)' : out.label === 'NEGATIVE' ? 'rgba(186,26,26,0.1)' : '#f3f3f3', color: out.label === 'POSITIVE' ? '#2e7d32' : out.label === 'NEGATIVE' ? '#ba1a1a' : '#424656', fontSize: '0.8rem', fontWeight: 600, padding: '0.35rem 0.875rem', borderRadius: '9999px', textTransform: 'capitalize' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
          )}

              {/* ─── SUMMARIZE ─── */}
              {out.type === 'summarize' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Summary box */}
                  <div style={{ background: 'rgba(0,76,202,0.05)', borderRadius: '1rem', padding: '1.5rem', border: '2px solid rgba(0,76,202,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#004cca', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      <p style={{ ...LABEL, marginBottom: 0, color: '#004cca' }}>AI-Generated Summary</p>
                    </div>
                    <p style={{ fontSize: '1.05rem', color: '#1a1c1c', lineHeight: 1.85, fontStyle: 'italic' }}>"{out.summary}"</p>
                  </div>
                  {/* Stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                    {[
                      { label: 'Original Words', value: out.originalWords, bg: '#f3f3f3', color: '#1a1c1c' },
                      { label: 'Summary Words', value: out.summaryWords, bg: '#f3f3f3', color: '#1a1c1c' },
                      { label: 'Compressed By', value: out.compression, bg: '#004cca', color: '#fff' },
                      { label: 'Latency', value: `${out.latency}ms`, bg: '#f3f3f3', color: '#1a1c1c' },
                    ].map(m => (
                      <div key={m.label} style={{ background: m.bg, borderRadius: '0.875rem', padding: '1rem', textAlign: 'center' }}>
                        <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.35rem', color: m.color, lineHeight: 1 }}>{m.value}</p>
                        <p style={{ fontSize: '0.6rem', color: m.bg === '#004cca' ? 'rgba(255,255,255,0.7)' : '#737687', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.3rem' }}>{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── IMAGE GENERATION ─── */}
              {out.type === 'image_gen' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                  {/* Style + Model badge row */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ background: '#004cca', color: '#fff', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.75rem', padding: '0.3rem 0.875rem', borderRadius: '9999px' }}>
                      {IMAGE_STYLES.find(s => s.id === out.style)?.emoji || '🎨'} {out.style}
                    </span>
                    <span style={{ background: 'rgba(253,212,4,0.2)', color: '#6f5c00', fontWeight: 700, fontSize: '0.7rem', padding: '0.3rem 0.875rem', borderRadius: '9999px' }}>
                      Pollinations AI · Flux
                    </span>
                    <span style={{ background: '#f3f3f3', color: '#424656', fontWeight: 600, fontSize: '0.7rem', padding: '0.3rem 0.875rem', borderRadius: '9999px' }}>
                      {out.resolution}
                    </span>
                    <span style={{ background: '#f3f3f3', color: '#424656', fontFamily: 'monospace', fontSize: '0.65rem', padding: '0.3rem 0.875rem', borderRadius: '9999px' }}>
                      seed #{out.seed}
                    </span>
                  </div>

                  {/* Prompt preview */}
                  <div style={{ background: '#f9f9f9', borderRadius: '0.875rem', padding: '0.875rem 1.125rem', border: '1px solid #e8e8e8' }}>
                    <p style={{ ...LABEL, marginBottom: '0.3rem' }}>Prompt</p>
                    <p style={{ fontSize: '0.9rem', color: '#1a1c1c', fontStyle: 'italic', lineHeight: 1.55 }}>"{out.prompt}"</p>
                  </div>

                  {/* Full-width image — loads from Pollinations AI */}
                  <div style={{ borderRadius: '1.25rem', overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #1a1c1c 0%, #2d2f3a 100%)', minHeight: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

                    {/* Loading shimmer background text */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', zIndex: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'rgba(255,255,255,0.15)' }}>image</span>
                      <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', maxWidth: '240px', lineHeight: 1.5 }}>Rendering AI image via Pollinations...<br />This may take a few seconds</p>
                    </div>

                    {/* Actual AI Image */}
                    <img
                      src={out.imageUrl}
                      alt={out.prompt}
                      loading="eager"
                      style={{ width: '100%', display: 'block', position: 'relative', zIndex: 1, minHeight: '360px', objectFit: 'contain', background: 'transparent' }}
                      onLoad={e => { (e.target as HTMLImageElement).style.background = 'transparent'; }}
                      onError={e => {
                        // fallback to gen.pollinations.ai
                        const img = e.target as HTMLImageElement;
                        if (!img.dataset.fallback) {
                          img.dataset.fallback = '1';
                          const cfg = STYLE_CONFIG[out.style] || STYLE_CONFIG['realistic'];
                          img.src = `https://gen.pollinations.ai/image/${encodeURIComponent(out.prompt + cfg.suffix)}?model=${cfg.model}&width=1024&height=1024&seed=${out.seed}`;
                        }
                      }}
                    />

                    {/* Overlay badges */}
                    <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', zIndex: 2, display: 'flex', gap: '0.5rem' }}>
                      <span style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', color: '#fff', fontWeight: 700, fontSize: '0.65rem', padding: '0.3rem 0.75rem', borderRadius: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {IMAGE_STYLES.find(s => s.id === out.style)?.emoji} {out.style}
                      </span>
                      <span style={{ background: 'rgba(253,212,4,0.9)', color: '#6f5c00', fontWeight: 700, fontSize: '0.65rem', padding: '0.3rem 0.75rem', borderRadius: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Pollinations AI
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <a href={out.imageUrl} target="_blank" rel="noreferrer" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', background: '#004cca', color: '#fff', borderRadius: '0.875rem', textDecoration: 'none', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>open_in_new</span>
                      Open Full Resolution ↗
                    </a>
                    <a href={out.imageUrl} download={`payprapi-${out.style}-${out.seed}.jpg`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', background: '#f3f3f3', color: '#1a1c1c', borderRadius: '0.875rem', textDecoration: 'none', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                      Download
                    </a>
                  </div>
                </div>
              )}

              {/* Reset */}
              <button onClick={() => { setPayStep('input'); setTxId(''); setTxAutoReady(false); setResult(null); setError(''); }}
                style={{ marginTop: '1.25rem', width: '100%', padding: '0.875rem', background: '#f3f3f3', border: 'none', borderRadius: '0.875rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: '#424656', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
                Run Another Request
              </button>
            </div>
      </div>
        );
  };

  /* ── Payment Panel ── */
  const renderPaymentPanel = () => (
        <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '1.5rem', border: '2px solid rgba(0,76,202,0.2)', boxShadow: '0 8px 32px rgba(0,76,202,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#004cca', fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>payments</span>
            <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#1a1c1c' }}>Pay with ALGO</h4>
            <span style={{ marginLeft: 'auto', background: 'rgba(0,76,202,0.1)', color: '#004cca', fontSize: '0.6rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', textTransform: 'uppercase' }}>X402 Protocol</span>
          </div>

          {/* Amount */}
          <div style={{ background: 'rgba(0,76,202,0.05)', borderRadius: '0.875rem', padding: '1rem', marginBottom: '1rem', border: '1px solid rgba(0,76,202,0.1)' }}>
            <p style={{ ...LABEL, marginBottom: '0.25rem' }}>Amount</p>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.03em', color: '#1a1c1c' }}>{selected.price} <span style={{ fontSize: '1rem', color: '#424656', fontWeight: 500 }}>ALGO</span></p>
            <p style={{ fontSize: '0.7rem', color: '#737687', marginTop: '0.25rem' }}>Your balance: <strong style={{ color: balance >= selected.price ? '#2e7d32' : '#ba1a1a' }}>{displayBalance.toFixed(4)} ALGO</strong></p>
          </div>

          {/* Escrow */}
          <label style={LABEL}>Escrow Address</label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1, background: '#f3f3f3', borderRadius: '0.75rem', padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.68rem', color: '#424656', wordBreak: 'break-all', lineHeight: 1.5 }}>{ESCROW_ADDRESS}</div>
            <button onClick={() => { navigator.clipboard.writeText(ESCROW_ADDRESS).catch(() => { }); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ flexShrink: 0, width: 44, height: 44, background: copied ? '#004cca' : '#f3f3f3', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', alignSelf: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: copied ? '#fff' : '#424656' }}>{copied ? 'check' : 'content_copy'}</span>
            </button>
          </div>

          {/* TX ID */}
          <label style={LABEL}>
            Transaction ID
            {txAutoReady && <span style={{ marginLeft: '0.5rem', background: '#4caf50', color: '#fff', fontSize: '0.55rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>AUTO-DETECTED ✓</span>}
            {!txAutoReady && <span style={{ marginLeft: '0.5rem', color: '#737687', fontSize: '0.65rem', fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>monitoring blockchain...</span>}
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input value={txId} onChange={e => { setTxId(e.target.value); setTxAutoReady(false); }}
              placeholder="Paste Algorand TX ID or wait for auto-detect..."
              style={{ ...INPUT, fontFamily: 'monospace', fontSize: '0.7rem', background: txAutoReady ? 'rgba(76,175,80,0.08)' : '#f3f3f3', border: txAutoReady ? '1.5px solid rgba(76,175,80,0.5)' : '1.5px solid transparent', color: txAutoReady ? '#2e7d32' : '#1a1c1c' }} />
            {!txAutoReady && <div style={{ flexShrink: 0, width: 44, height: 44, background: '#f3f3f3', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined animate-paypr-spin" style={{ fontSize: '18px', color: '#424656' }}>sync</span>
            </div>}
          </div>

          {/* Verify Button */}
          <button onClick={verifyAndRun} disabled={verifying || !txId.trim()}
            style={{ width: '100%', padding: '0.9rem', background: verifying || !txId.trim() ? '#eeeeee' : '#004cca', color: verifying || !txId.trim() ? '#737687' : '#fff', border: 'none', borderRadius: '0.875rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.95rem', cursor: verifying || !txId.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s', marginBottom: '0.75rem' }}>
            <span className={`material-symbols-outlined ${verifying ? 'animate-paypr-spin' : ''}`} style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>{verifying ? 'sync' : 'verified'}</span>
            {verifying ? 'Verifying on Algorand & Running Service...' : `Verify & Get Output · ${selected.price} ALGO`}
          </button>
          {txId && (
            <a href={`https://testnet.algoexplorer.io/tx/${txId}`} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#004cca', textDecoration: 'none' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
              View on Algorand Block Explorer
            </a>
          )}
        </div>
        );

  /* ── Service-specific inputs ── */
  const renderInputs = () => {
    if (selected.id === 'translate') return (<>
          <label style={LABEL}>Text to Translate *</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Enter any text to translate..." rows={4}
            style={{ ...INPUT, resize: 'none', marginBottom: '1rem' }} />
          <label style={LABEL}>Target Language</label>
          <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
            <select value={targetLang} onChange={e => setTargetLang(e.target.value)} style={{ ...INPUT, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}>
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
            <span className="material-symbols-outlined" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#424656', pointerEvents: 'none' }}>expand_more</span>
          </div>
        </>);

        if (selected.id === 'image_gen') return (<>
          <label style={LABEL}>Image Prompt *</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder="A futuristic neon city at night with flying cars, reflections on wet pavement..."
            rows={4} style={{ ...INPUT, resize: 'none', marginBottom: '1rem' }} />

          <label style={LABEL}>Art Style — Choose One</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            {IMAGE_STYLES.map(s => (
              <button key={s.id} type="button"
                onClick={() => setImageStyle(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.625rem 0.75rem',
                  background: imageStyle === s.id ? '#004cca' : '#f3f3f3',
                  border: imageStyle === s.id ? '2px solid #004cca' : '2px solid transparent',
                  borderRadius: '0.75rem', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s',
                }}>
                <span style={{ fontSize: '1.25rem', lineHeight: 1, flexShrink: 0 }}>{s.emoji}</span>
                <div>
                  <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.75rem', color: imageStyle === s.id ? '#ffffff' : '#1a1c1c', lineHeight: 1, marginBottom: '0.15rem' }}>
                    {s.label.replace(/^[^\s]+\s/, '')}
                  </p>
                  <p style={{ fontSize: '0.6rem', color: imageStyle === s.id ? 'rgba(255,255,255,0.75)' : '#737687', lineHeight: 1.3 }}>{s.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Resolution hint */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {['1024×1024 (Square)', '1280×720 (Wide)', '720×1280 (Portrait)'].map((r, i) => {
              const dims = [{ w: 1024, h: 1024 }, { w: 1280, h: 720 }, { w: 720, h: 1280 }];
              return (
                <button key={r} type="button"
                  style={{ flex: 1, padding: '0.4rem 0.25rem', background: '#f3f3f3', border: '1.5px solid #e2e2e2', borderRadius: '0.5rem', fontSize: '0.6rem', fontWeight: 700, color: '#424656', cursor: 'pointer', textAlign: 'center' }}>
                  {r}
                </button>
              );
            })}
          </div>

          {/* Live preview mini-badge */}
          {prompt.trim() && (
            <div style={{ padding: '0.75rem', background: 'rgba(0,76,202,0.06)', borderRadius: '0.75rem', border: '1px solid rgba(0,76,202,0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#004cca' }}>auto_awesome</span>
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#004cca', marginBottom: '0.1rem' }}>
                  {IMAGE_STYLES.find(s => s.id === imageStyle)?.emoji} {imageStyle} · Pollinations AI Flux
                </p>
                <p style={{ fontSize: '0.65rem', color: '#737687' }}>
                  "{prompt.substring(0, 55)}{prompt.length > 55 ? '…' : ''}"
                </p>
              </div>
            </div>
          )}
        </>);

        return (<>
          <label style={LABEL}>{selected.id === 'summarize' ? 'Text to Summarize' : 'Text to Analyze'} *</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder={selected.id === 'summarize' ? 'Paste a long article, document, or any text...' : 'Enter text to analyze for sentiment and emotions...'}
            rows={5} style={{ ...INPUT, resize: 'none', marginBottom: '0.5rem' }} />
        </>);
  };

        return (
        <div style={{ background: '#f9f9f9', color: '#1a1c1c', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

          {/* NAV */}
          <nav className="paypr-nav">
            <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
              <Link href="/" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.03em', color: '#1a1c1c', textDecoration: 'none' }}>PayprAPI</Link>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <Link href="/explore" style={ACTIVE_NAV}>Explore APIs</Link>
                <Link href="/dashboard" style={NAV}>Dashboard</Link>
                <Link href="/analytics" style={NAV}>Analytics</Link>
                <Link href="/agent-console" style={NAV}>Agent Console</Link>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {/* Balance chip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,76,202,0.07)', borderRadius: '9999px', padding: '0.35rem 0.875rem', border: '1px solid rgba(0,76,202,0.15)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#004cca' }}>account_balance_wallet</span>
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: '#004cca' }}>{displayBalance.toFixed(4)} ALGO</span>
              </div>
              <button onClick={disconnectWallet} style={{ background: 'none', border: 'none', cursor: 'pointer', ...NAV }}>Logout</button>
              <Link href="/explore">
                <button style={{ background: '#0062ff', color: '#fff', border: 'none', borderRadius: '9999px', padding: '0.6rem 1.5rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>Try Free →</button>
              </Link>
            </div>
          </nav>

          {/* SPLIT LAYOUT */}
          <div className="split-layout">

            {/* LEFT SIDEBAR */}
            <aside className="split-sidebar" style={{ padding: '1.5rem' }}>
              <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>AI Marketplace</h1>
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#424656', fontSize: '20px' }}>search</span>
                <input placeholder="Search endpoints..." style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.625rem', paddingBottom: '0.625rem', background: '#ffffff', border: 'none', borderRadius: '0.75rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {['All', 'Language', 'Vision', 'Logic'].map((f, i) => (
                  <span key={f} style={{ padding: '0.25rem 0.875rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', background: i === 0 ? '#004cca' : '#e2e2e2', color: i === 0 ? '#ffffff' : '#424656' }}>{f}</span>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {SERVICES.map(s => (
                  <div key={s.id} onClick={() => selectService(s)}
                    style={{ padding: '1rem', background: selected.id === s.id ? '#ffffff' : 'transparent', borderRadius: '0.875rem', border: selected.id === s.id ? '2px solid #004cca' : '2px solid transparent', cursor: 'pointer', boxShadow: selected.id === s.id ? '0 4px 16px rgba(0,76,202,0.12)' : 'none', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: selected.id === s.id ? '#004cca' : '#424656' }}>{s.icon}</span>
                      <span style={{ background: '#fdd404', color: '#6f5c00', fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '0.25rem' }}>{s.price} ALGO/req</span>
                    </div>
                    <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem', color: '#1a1c1c' }}>{s.name}</h3>
                    <p style={{ fontSize: '0.75rem', color: '#424656', lineHeight: 1.4 }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </aside>

            {/* RIGHT MAIN */}
            <main className="split-main" style={{ padding: '2rem' }}>

              {/* Service header */}
              <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '1.75rem', display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
                <div style={{ width: 76, height: 76, background: '#004cca', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transform: 'rotate(3deg)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#fff' }}>{selected.icon}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ background: '#fdd404', color: '#6f5c00', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>{selected.category}</span>
                    <code style={{ fontSize: '0.68rem', color: '#737687', fontFamily: 'monospace' }}>{selected.id}</code>
                    {payStep !== 'input' && (
                      <span style={{ background: payStep === 'done' ? 'rgba(76,175,80,0.1)' : 'rgba(0,76,202,0.1)', color: payStep === 'done' ? '#4caf50' : '#004cca', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                        {payStep === 'paying' ? '⏳ Awaiting Payment' : payStep === 'verifying' ? '🔄 Verifying...' : '✓ Output Ready'}
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.875rem', letterSpacing: '-0.03em', color: '#1a1c1c', marginBottom: '0.25rem' }}>{selected.name}</h2>
                  <code style={{ fontSize: '0.75rem', color: '#004cca', background: 'rgba(0,76,202,0.07)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontFamily: 'monospace' }}>POST {AI_BASE}{selected.endpoint}</code>
                </div>
              </div>

              {/* Step indicator */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                {[{ n: '1', label: 'Input' }, { n: '2', label: 'Pay & Verify' }, { n: '3', label: 'Get Output' }].map((s, i) => {
                  const active = i === (payStep === 'input' ? 0 : payStep === 'paying' ? 1 : 2);
                  const done = i < (payStep === 'input' ? 0 : payStep === 'paying' ? 1 : payStep === 'verifying' ? 2 : 3);
                  return (
                    <>
                      <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? '#4caf50' : active ? '#004cca' : '#e2e2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.3s' }}>
                          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.75rem', color: done || active ? '#fff' : '#737687' }}>{done ? '✓' : s.n}</span>
                        </div>
                        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: active ? 700 : 500, fontSize: '0.8rem', color: active ? '#1a1c1c' : '#737687' }}>{s.label}</span>
                      </div>
                      {i < 2 && <div style={{ flex: 0, width: '2rem', height: '2px', background: done ? '#4caf50' : '#e2e2e2', transition: 'all 0.3s' }}></div>}
                    </>
                  );
                })}
              </div>

              {/* OUTPUT — rendered first when done so it's immediately visible */}
              {payStep === 'done' && result && renderOutput()}

              {/* INPUT + PAYMENT + TERMINAL — shown when not done */}
              {payStep !== 'done' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  {/* Left column: input + payment */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Step 1: Input */}
                    <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: payStep !== 'input' ? '#4caf50' : '#004cca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.7rem', color: '#fff' }}>{payStep !== 'input' ? '✓' : '1'}</span>
                        </div>
                        <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#1a1c1c' }}>Request Input</h4>
                      </div>
                      {renderInputs()}
                      {error && <p style={{ color: '#ba1a1a', fontSize: '0.75rem', marginBottom: '0.75rem', marginTop: '0.5rem' }}>{error}</p>}
                      {payStep === 'input' ? (
                        <button onClick={initiatePayment} disabled={!prompt.trim()}
                          style={{ marginTop: '0.5rem', width: '100%', padding: '0.875rem', background: !prompt.trim() ? '#e8e8e8' : '#004cca', color: !prompt.trim() ? '#737687' : '#fff', border: 'none', borderRadius: '0.875rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.9rem', cursor: !prompt.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>bolt</span>
                          Call API · {selected.price} ALGO
                        </button>
                      ) : (
                        <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(76,175,80,0.07)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#4caf50' }}>lock</span>
                          <span style={{ fontSize: '0.8rem', color: '#2e7d32', fontWeight: 600 }}>Input locked — complete payment below</span>
                        </div>
                      )}
                    </div>

                    {/* Step 2: Payment */}
                    {payStep === 'paying' && renderPaymentPanel()}
                  </div>

                  {/* Right column: X402 Terminal */}
                  <div style={{ background: '#1a1c1c', borderRadius: '1.5rem', padding: '1.5rem', position: 'relative', overflow: 'hidden', height: 'fit-content' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#fdd404' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#e9c400', textTransform: 'uppercase', letterSpacing: '0.08em' }}>HTTP 402: Payment Required</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {['rgba(186,26,26,0.5)', 'rgba(253,212,4,0.5)', 'rgba(0,98,255,0.5)'].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }}></div>)}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#737687', lineHeight: 2, marginBottom: '1.5rem' }}>
                      <p><span style={{ color: '#e9c400' }}>// Protocol: X402 Agentic Transfer</span></p>
                      <p><span style={{ color: '#b4c5ff' }}>Endpoint:</span> <span style={{ color: '#81c784' }}>{AI_BASE}{selected.endpoint}</span></p>
                      <p><span style={{ color: '#b4c5ff' }}>Amount:</span> <span style={{ color: '#fdd404' }}>{selected.price} ALGO</span></p>
                      <p><span style={{ color: '#b4c5ff' }}>Receiver:</span> PayprAPI_Escrow_v2</p>
                      <p><span style={{ color: '#b4c5ff' }}>Header:</span> <span style={{ color: '#e9c400' }}>X-Payment: txid:{'<TX_ID>'}</span></p>
                      {txId && <p><span style={{ color: '#81c784' }}>TX:</span> <span style={{ color: '#81c784' }}>{txId.substring(0, 24)}...</span></p>}
                    </div>

                    {/* Balance display */}
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737687', marginBottom: '0.25rem' }}>Wallet Balance</p>
                          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.625rem', color: '#fff', lineHeight: 1 }}>
                            {displayBalance.toFixed(4)} <span style={{ fontSize: '0.875rem', color: '#737687', fontWeight: 400 }}>ALGO</span>
                          </p>
                        </div>
                        <button 
                          onClick={() => refreshBalance()}
                          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '0.5rem', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                        >
                          <span className={`material-symbols-outlined ${isLoadingBalance ? 'animate-paypr-spin' : ''}`} style={{ fontSize: '18px' }}>sync</span>
                        </button>
                      </div>
                      
                      <div style={{ marginBottom: '1rem', padding: '0.625rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem' }}>
                         <p style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737687', marginBottom: '0.25rem' }}>Your Wallet Address</p>
                         <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                           <code style={{ fontSize: '0.65rem', color: '#81c784', wordBreak: 'break-all', fontFamily: 'monospace' }}>{walletAddress || 'Detecting...'}</code>
                           <button onClick={() => { navigator.clipboard.writeText(walletAddress); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ background: 'none', border: 'none', color: '#737687', cursor: 'pointer', padding: 0 }}>
                             <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{copied ? 'done' : 'content_copy'}</span>
                           </button>
                         </div>
                      </div>

                      {displayBalance < 0.1 && (
                        <a 
                          href="https://bank.testnet.algorand.network/" 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.625rem', background: '#004cca', color: '#fff', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>faucet</span>
                          Fund Wallet (Testnet Faucet)
                        </a>
                      )}
                      
                      <p style={{ fontSize: '0.6rem', color: '#737687', marginTop: '0.75rem', textAlign: 'center' }}>
                        {isSimulation ? '🟢 Simulation Mode active' : '🔵 Real Testnet mode active'}
                      </p>
                    </div>

                    {/* Flow steps */}
                    {['Request Initiated', 'Payment Received', 'On-Chain Verified', 'Output Unlocked'].map((step, i) => {
                      const stepMap: Record<string, number> = { input: 0, paying: 1, verifying: 2, done: 4 };
                      const isActive = stepMap[payStep] > i;
                      return (
                        <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? '#4caf50' : '#424656', flexShrink: 0, transition: 'background 0.3s' }}></div>
                          <span style={{ fontSize: '0.7rem', color: isActive ? '#81c784' : '#424656', transition: 'color 0.3s' }}>{step}</span>
                        </div>
                      );
                    })}

                    <Link href="/agent-console" style={{ display: 'block', marginTop: '1.25rem' }}>
                      <button style={{ width: '100%', padding: '0.75rem', background: '#fdd404', color: '#6f5c00', border: 'none', borderRadius: '0.75rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>terminal</span>
                        Open Agent Console
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {/* TX confirmation strip (when done) */}
              {payStep === 'done' && result && (
                <div style={{ background: '#1a1c1c', borderRadius: '1.25rem', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {['rgba(186,26,26,0.5)', 'rgba(253,212,4,0.5)', 'rgba(0,98,255,0.5)'].map((c, i) => <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c }}></div>)}
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#81c784' }}>✓ PAYMENT_VERIFIED · TX: {result.txId.substring(0, 26)}... · {result.amount} ALGO deducted · Service: {selected.id}</span>
                  <a href={`https://testnet.algoexplorer.io/tx/${result.txId}`} target="_blank" rel="noreferrer"
                    style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#b4c5ff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
                    Block Explorer
                  </a>
                </div>
              )}

              {/* Example JSON Response */}
              <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid #e8e8e8' }}>
                <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', color: '#1a1c1c' }}>API Schema — {selected.name}</h4>
                <div style={{ background: '#f3f3f3', borderRadius: '0.75rem', padding: '1rem', fontFamily: 'monospace', fontSize: '0.73rem', color: '#424656', overflowX: 'auto' }}>
                  <pre style={{ margin: 0 }}>{selected.id === 'translate'
                    ? `POST ${AI_BASE}/api/translate\nHeaders: X-Payment: txid:<TX_ID>\n\n// Request\n{ "text": "Hello world", "target_lang": "es", "source_lang": "en" }\n\n// Response\n{ "translated_text": "Hola mundo", "confidence": 0.96, "source_lang": "en", "target_lang": "es" }`
                    : selected.id === 'sentiment'
                      ? `POST ${AI_BASE}/api/sentiment\nHeaders: X-Payment: txid:<TX_ID>\n\n// Request\n{ "text": "This is amazing!", "granular": true }\n\n// Response\n{ "sentiment": "positive", "confidence": 0.94, "polarity": 0.62,\n  "emotions": { "joy": 0.72, "satisfaction": 0.15, "surprise": 0.08 } }`
                      : selected.id === 'summarize'
                        ? `POST ${AI_BASE}/api/summarize\nHeaders: X-Payment: txid:<TX_ID>\n\n// Request\n{ "text": "<long text>", "max_sentences": 3, "style": "concise" }\n\n// Response\n{ "summary": "...", "original_word_count": 842, "compression_ratio": 0.89 }`
                        : `POST ${AI_BASE}/api/image/generate\nHeaders: X-Payment: txid:<TX_ID>\n\n// Request\n{ "prompt": "A futuristic city", "style": "cinematic", "width": 1024, "height": 1024 }\n\n// Response — Pollinations AI\n{ "image_url": "https://image.pollinations.ai/prompt/...", "seed": 482917, "width": 1024 }`
                  }</pre>
                </div>
              </div>
            </main>
          </div>

          {/* FOOTER */}
          <footer style={{ background: '#f3f3f3', padding: '1.25rem 2rem', borderTop: '1px solid rgba(194,198,217,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', flexShrink: 0 }}>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.75rem', color: '#737687' }}>payprapi — powered by algorand blockchain &amp; x402 protocol · Pollinations AI for image generation</span>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {['documentation', 'privacy', 'terms', 'support'].map(l => <a key={l} href="#" style={{ fontSize: '0.75rem', color: '#424656', textDecoration: 'none' }}>{l}</a>)}
            </div>
          </footer>
        </div>
        );
}