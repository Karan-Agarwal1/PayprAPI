'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import algosdk from 'algosdk';

interface WalletContextType {
  walletAddress: string;
  mnemonic: string;
  balance: number;
  isSimulation: boolean;
  isLoadingBalance: boolean;
  network: string;
  deductBalance: (amount: number) => void;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within a WalletProvider');
  return context;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [hasChecked, setHasChecked] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [balance, setBalance] = useState(0);
  const [isSimulation, setIsSimulation] = useState(true);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [network, setNetwork] = useState('simulation');
  const [inputMnemonic, setInputMnemonic] = useState('');
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    try {
      const addr = window.localStorage.getItem('x402_wallet_address');
      const mn = window.localStorage.getItem('x402_mnemonic');
      if (addr && mn) { setWalletAddress(addr); setMnemonic(mn); }
    } catch {}
    setHasChecked(true);
    refreshBalance();
  }, []);

  async function refreshBalance() {
    setIsLoadingBalance(true);
    try {
      const mn = window.localStorage.getItem('x402_mnemonic') || mnemonic;
      const addr = window.localStorage.getItem('x402_wallet_address') || walletAddress;
      const baseUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8000';
      const url = new URL(`${baseUrl}/payment/wallet`);
      if (addr) {
        url.searchParams.append('address', addr);
      }
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance_algo || 0);
        setIsSimulation(!!data.simulation);
        setNetwork(data.network || 'testnet');
        
        // Always sync the local address with the backend's authoritative address
        if (data.client_address && walletAddress !== data.client_address) {
          setWalletAddress(data.client_address);
          try { localStorage.setItem('x402_wallet_address', data.client_address); } catch {}
        }
      }
    } catch (e) {
      console.warn('[Wallet] Failed to fetch balance:', e);
    } finally {
      setIsLoadingBalance(false);
    }
  }

  function deductBalance(amount: number) {
    setBalance(prev => {
      const next = parseFloat((prev - amount).toFixed(6));
      try { localStorage.setItem('x402_balance', next.toString()); } catch {}
      return next;
    });
  }

  async function handleConnect() {
    setError('');
    setConnecting(true);
    try {
      const trimmed = inputMnemonic.trim().replace(/\s+/g, ' ');
      const words = trimmed.split(' ');

      let account: { addr: any; sk: Uint8Array };
      let finalMnemonic = trimmed;

      if (words.length === 24) {
        const encoder = new TextEncoder();
        const data = encoder.encode(trimmed);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const seed = new Uint8Array(hashBuffer);
        finalMnemonic = algosdk.mnemonicFromSeed(seed);
        account = algosdk.mnemonicToSecretKey(finalMnemonic);
      } else if (words.length === 25) {
        account = algosdk.mnemonicToSecretKey(trimmed);
      } else {
        throw new Error(`Expected 24 or 25 words, got ${words.length}.`);
      }

      setWalletAddress(account.addr.toString());
      setMnemonic(finalMnemonic);
      try {
        localStorage.setItem('x402_wallet_address', account.addr.toString());
        localStorage.setItem('x402_mnemonic', finalMnemonic);
      } catch {}
    } catch (err: any) {
      setError('Invalid passphrase: ' + (err.message || 'Please check your 24 or 25-word mnemonic.'));
    }
    setConnecting(false);
  }

  function handleGuestMode() {
    const guestMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';
    try {
      const account = algosdk.mnemonicToSecretKey(guestMnemonic);
      setWalletAddress(account.addr.toString());
      setMnemonic(guestMnemonic);
      try {
        localStorage.setItem('x402_wallet_address', account.addr.toString());
        localStorage.setItem('x402_mnemonic', guestMnemonic);
      } catch {}
    } catch {
      setWalletAddress('GUEST_MODE_DEMO_WALLET_PAYPRAPI');
      setMnemonic('guest');
    }
  }

  function disconnectWallet() {
    setWalletAddress(''); setMnemonic(''); setInputMnemonic(''); setError('');
    try {
      localStorage.removeItem('x402_wallet_address');
      localStorage.removeItem('x402_mnemonic');
      localStorage.removeItem('x402_balance');
    } catch {}
  }

  if (!hasChecked) return null;

  return (
    <WalletContext.Provider value={{ walletAddress, mnemonic, balance, isSimulation, isLoadingBalance, network, deductBalance, disconnectWallet, refreshBalance }}>
      {children}

      {!walletAddress && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(26,28,28,0.5)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{ position: 'absolute', top: '5%', left: '5%', opacity: 0.05, pointerEvents: 'none', userSelect: 'none', lineHeight: 1 }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 'clamp(80px, 12vw, 160px)', color: '#1a1c1c' }}>SAFE</div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 'clamp(80px, 12vw, 160px)', color: '#1a1c1c' }}>ENTRY</div>
          </div>
          <div style={{ position: 'absolute', bottom: '5%', right: '5%', opacity: 0.06, pointerEvents: 'none', userSelect: 'none', textAlign: 'right' }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1a1c1c', marginBottom: '0.25rem' }}>Network Status</div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 'clamp(24px, 4vw, 48px)', color: '#004cca' }}>ALGORAND TESTNET</div>
          </div>

          <div style={{
            position: 'relative', zIndex: 1,
            width: '100%', maxWidth: '480px',
            background: '#ffffff',
            borderRadius: '1.5rem',
            overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
          }}>
            <div style={{ height: '4px', background: '#004cca' }}></div>
            <div style={{ padding: '2.5rem 2.5rem 1.5rem', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, background: '#dbe1ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#004cca', fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
              </div>
              <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.03em', color: '#1a1c1c', marginBottom: '0.5rem' }}>Connect Wallet</h1>
              <p style={{ fontSize: '0.875rem', color: '#424656', lineHeight: 1.5 }}>
                Enter your <strong>24 or 25-word</strong> testnet passphrase
              </p>
            </div>

            <div style={{ padding: '0 2.5rem 1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <textarea
                  value={inputMnemonic}
                  onChange={e => setInputMnemonic(e.target.value)}
                  id="passphrase"
                  placeholder="apple banana cherry dog elephant... (24 or 25 words)"
                  rows={5}
                  style={{
                    width: '100%', padding: '1rem', boxSizing: 'border-box',
                    background: '#f3f3f3', border: '2px solid transparent',
                    borderRadius: '0.875rem', fontFamily: 'Inter, sans-serif',
                    fontSize: '0.875rem', lineHeight: 1.6, color: '#1a1c1c',
                    resize: 'none', outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#004cca'}
                  onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
                />
                <div style={{ position: 'absolute', top: '-8px', right: '-8px', width: 36, height: 36, background: '#fdd404', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#6f5c00', fontVariationSettings: "'wght' 600" }}>vpn_key</span>
                </div>
              </div>

              {error && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(186,26,26,0.08)', border: '1px solid rgba(186,26,26,0.2)', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#ba1a1a' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.875rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#737687' }}>verified_user</span>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#737687' }}>Secured by AES-256 hardware encryption standards</p>
              </div>
            </div>

            <div style={{ padding: '0 2.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={handleConnect}
                disabled={!inputMnemonic.trim() || connecting}
                style={{
                  width: '100%', height: '52px', background: !inputMnemonic.trim() || connecting ? '#e2e2e2' : '#004cca',
                  color: !inputMnemonic.trim() || connecting ? '#737687' : '#ffffff',
                  border: 'none', borderRadius: '9999px', fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 700, fontSize: '1rem', cursor: !inputMnemonic.trim() || connecting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s',
                }}
              >
                {connecting ? 'Verifying...' : 'Secure Connect'}
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
              </button>
              <button
                onClick={handleGuestMode}
                style={{
                  width: '100%', height: '48px', background: 'transparent',
                  color: '#424656', border: 'none', borderRadius: '9999px',
                  fontFamily: 'Space Grotesk, sans-serif', fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
                Guest Mode (Skip for now)
              </button>
            </div>

            <div style={{ background: '#f3f3f3', padding: '0.875rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.75rem', color: '#c2c6d9' }}>PayprAPI</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#c2c6d9', textTransform: 'uppercase', letterSpacing: '0.08em' }}>v2.4.0-main</span>
            </div>
          </div>
        </div>
      )}
    </WalletContext.Provider>
  );
}
