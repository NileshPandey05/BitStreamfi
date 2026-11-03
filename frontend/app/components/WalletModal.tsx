'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import {
  X,
  Wallet,
  LogOut,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  ArrowRightLeft,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

/* =========================================================================
   VECTOR ICONS FOR SUPPORTED WALLETS
   ========================================================================= */

export function MetaMaskIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M29.07 3L18.47 10.82L20.44 6.13L29.07 3Z" fill="#E2761B" stroke="#E2761B" strokeWidth="0.25" />
      <path d="M2.93 3L13.43 10.9L11.56 6.13L2.93 3Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.25" />
      <path d="M24.84 21.82L22.09 26.04L28.16 27.68L29.89 21.93L24.84 21.82Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.25" />
      <path d="M2.11 21.93L3.84 27.68L9.91 26.04L7.16 21.82L2.11 21.93Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.25" />
      <path d="M9.61 14.1L7.71 16.96L13.71 17.23L13.51 10.74L9.61 14.1Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.25" />
      <path d="M22.39 14.1L18.44 10.66L18.29 17.23L24.29 16.96L22.39 14.1Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.25" />
      <path d="M9.91 26.04L13.25 24.41L10.43 21.97L9.91 26.04Z" fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="0.25" />
      <path d="M18.75 24.41L22.09 26.04L21.57 21.97L18.75 24.41Z" fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="0.25" />
      <path d="M13.25 24.41L18.75 24.41L16 28.5L13.25 24.41Z" fill="#C0AD9E" stroke="#C0AD9E" strokeWidth="0.25" />
      <path d="M21.57 21.97L24.84 21.82L22.39 14.1L18.29 17.23L21.57 21.97Z" fill="#161616" stroke="#161616" strokeWidth="0.25" />
      <path d="M7.16 21.82L10.43 21.97L13.71 17.23L9.61 14.1L7.16 21.82Z" fill="#161616" stroke="#161616" strokeWidth="0.25" />
      <path d="M18.29 17.23L18.44 10.66L20.44 6.13L18.47 10.82L18.29 17.23Z" fill="#763D16" stroke="#763D16" strokeWidth="0.25" />
      <path d="M13.71 17.23L13.51 10.74L11.56 6.13L13.43 10.9L13.71 17.23Z" fill="#763D16" stroke="#763D16" strokeWidth="0.25" />
      <path d="M24.29 16.96L18.29 17.23L21.57 21.97L22.09 26.04L24.84 21.82L29.89 21.93L24.29 16.96Z" fill="#F6851B" stroke="#F6851B" strokeWidth="0.25" />
      <path d="M7.71 16.96L13.71 17.23L10.43 21.97L9.91 26.04L7.16 21.82L2.11 21.93L7.71 16.96Z" fill="#F6851B" stroke="#F6851B" strokeWidth="0.25" />
      <path d="M18.47 10.82L29.07 3L24.29 16.96L22.39 14.1L18.47 10.82Z" fill="#E4751F" stroke="#E4751F" strokeWidth="0.25" />
      <path d="M13.43 10.9L2.93 3L7.71 16.96L9.61 14.1L13.43 10.9Z" fill="#E4751F" stroke="#E4751F" strokeWidth="0.25" />
    </svg>
  );
}

export function PhantomIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="128" height="128" rx="28" fill="#AB9FF2" />
      <path
        d="M104.5 66.5C104.5 44.1325 86.3675 26 64 26C41.6325 26 23.5 44.1325 23.5 66.5V84C23.5 89.5228 27.9772 94 33.5 94C36.2614 94 38.7614 92.8807 40.5607 91.0814L48 83.6421L55.4393 91.0814C57.2386 92.8807 59.7386 94 62.5 94C65.2614 94 67.7614 92.8807 69.5607 91.0814L77 83.6421L84.4393 91.0814C86.2386 92.8807 88.7386 94 91.5 94C97.0228 94 101.5 89.5228 101.5 84L104.5 66.5Z"
        fill="white"
      />
      <circle cx="50" cy="60" r="7" fill="#534BB1" />
      <circle cx="78" cy="60" r="7" fill="#534BB1" />
    </svg>
  );
}

export function CoinbaseIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="16" fill="#0052FF" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 8C11.5817 8 8 11.5817 8 16C8 20.4183 11.5817 24 16 24C20.4183 24 24 20.4183 24 16C24 11.5817 20.4183 8 16 8ZM13.2 13.2H18.8V18.8H13.2V13.2Z"
        fill="white"
      />
    </svg>
  );
}

export function RabbyIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#8697FF" />
      <path
        d="M9 22C9 18 11 13 16 11C21 9 24 12 24 16C24 19 21.5 22 17.5 22C14.5 22 13 21 11.5 22H9Z"
        fill="white"
      />
      <circle cx="19" cy="15" r="1.5" fill="#8697FF" />
    </svg>
  );
}

export function SafeIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#12FF80" />
      <path
        d="M16 7L8 11.5V17C8 21.8 11.4 26.2 16 27.5C20.6 26.2 24 21.8 24 17V11.5L16 7Z"
        fill="#121312"
      />
      <circle cx="16" cy="17" r="3" fill="#12FF80" />
    </svg>
  );
}

export function BrowserWalletIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-lg bg-gradient-to-tr from-[#E66C35] to-[#F59E0B] flex items-center justify-center text-white shadow-sm shrink-0`}
    >
      <Wallet className="w-4 h-4" />
    </div>
  );
}

/**
 * Returns the matching SVG icon for a given wallet connector
 */
export function getWalletIcon(nameOrId?: string, iconUrl?: string, className = 'w-6 h-6') {
  if (iconUrl) {
    return <img src={iconUrl} alt={nameOrId || 'Wallet'} className={`${className} object-contain rounded-md`} />;
  }

  const str = (nameOrId || '').toLowerCase();
  if (str.includes('phantom')) return <PhantomIcon className={className} />;
  if (str.includes('metamask')) return <MetaMaskIcon className={className} />;
  if (str.includes('coinbase')) return <CoinbaseIcon className={className} />;
  if (str.includes('rabby')) return <RabbyIcon className={className} />;
  if (str.includes('safe')) return <SafeIcon className={className} />;
  return <BrowserWalletIcon className={className} />;
}

/* =========================================================================
   WALLET MODAL COMPONENT
   ========================================================================= */

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'select' | 'manage';
}

export function WalletModal({ isOpen, onClose, initialMode = 'select' }: WalletModalProps) {
  const { address, isConnected, connector: activeConnector } = useAccount();
  const { connectors, connect, isPending: isConnecting, error: connectError, reset: resetConnect } = useConnect();
  const { disconnect, isPending: isDisconnecting } = useDisconnect();

  // Fetch live native BTC balance for connected account
  const { data: btcBalance } = useBalance({
    address,
  });

  const [mode, setMode] = useState<'select' | 'manage'>(initialMode);
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasInjected, setHasInjected] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<{ name: string; url: string } | null>(null);

  // Sync mode with connection state or initialMode
  useEffect(() => {
    if (isOpen) {
      if (isConnected && initialMode === 'manage') {
        setMode('manage');
      } else {
        setMode('select');
      }
      setSelectedConnectorId(null);
      setInstallPrompt(null);
      resetConnect();
    }
  }, [isOpen, isConnected, initialMode, resetConnect]);

  // Check window.ethereum for detected wallets on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const eth = (window as unknown as { ethereum?: Record<string, unknown> }).ethereum;
      setHasInjected(Boolean(eth));
    }
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Format address
  const formattedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  // Copy address to clipboard
  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to detect if Phantom is installed in the browser
  const isPhantomInstalled = () => {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as {
      phantom?: { ethereum?: unknown; solana?: unknown };
      ethereum?: { isPhantom?: boolean; providers?: Array<{ isPhantom?: boolean }> };
    };
    return Boolean(
      win.phantom?.ethereum ||
      win.phantom?.solana ||
      win.ethereum?.isPhantom ||
      win.ethereum?.providers?.some((p) => p?.isPhantom)
    );
  };

  // Helper to detect if MetaMask is installed in the browser
  const isMetaMaskInstalled = () => {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as {
      ethereum?: { isMetaMask?: boolean; isPhantom?: boolean; providers?: Array<{ isMetaMask?: boolean }> };
    };
    return Boolean(
      win.ethereum?.isMetaMask ||
      win.ethereum?.providers?.some((p) => p?.isMetaMask) ||
      (win.ethereum && !win.ethereum?.isPhantom)
    );
  };

  // Format and sanitize Wagmi error messages
  const formatErrorMessage = (message?: string) => {
    if (!message) return 'Unable to connect to wallet. Please try again.';
    if (message.includes('User rejected') || message.includes('denied')) {
      return 'Connection rejected in your wallet. Please approve the prompt in your extension.';
    }
    if (message.includes('Provider not found') || message.includes('Connector not found')) {
      return 'Wallet provider not found. Please ensure the extension is installed and active in your browser.';
    }
    if (message.includes('ChainNotConfigured') || message.includes('unsupported chain')) {
      return 'Mezo Testnet is not configured in your wallet. BitStreamfi will request to add network 31611.';
    }
    return message.replace(/\.?\s*Version:\s*@wagmi\/[^\s]+/gi, '').trim();
  };

  // Connect or switch to a connector
  const handleSelectConnector = async (connector: (typeof connectors)[0]) => {
    try {
      setSelectedConnectorId(connector.id);
      setInstallPrompt(null);
      resetConnect();

      const str = (connector.name || connector.id).toLowerCase();

      // Pre-check for Phantom: if not installed, show install guide without triggering Wagmi error
      if (str.includes('phantom')) {
        if (!isPhantomInstalled()) {
          setInstallPrompt({
            name: 'Phantom',
            url: 'https://phantom.app/download',
          });
          setSelectedConnectorId(null);
          return;
        }
      }

      // Pre-check for MetaMask: if not installed, show install guide without triggering Wagmi error
      if (str.includes('metamask')) {
        if (!isMetaMaskInstalled() && !hasInjected) {
          setInstallPrompt({
            name: 'MetaMask',
            url: 'https://metamask.io/download/',
          });
          setSelectedConnectorId(null);
          return;
        }
      }

      // If switching from an existing connected wallet, disconnect first
      if (isConnected && activeConnector?.id !== connector.id) {
        disconnect();
      }

      // Find the best connector if EIP-6963 or direct target is available
      let targetConnector = connector;
      if (str.includes('metamask')) {
        const eip6963MM = connectors.find((c) => c.id === 'io.metamask');
        const injectedMM = connectors.find((c) => c.id === 'metaMask');
        targetConnector = eip6963MM || injectedMM || connector;
      } else if (str.includes('phantom')) {
        const eip6963Phantom = connectors.find((c) => c.id === 'app.phantom');
        const injectedPhantom = connectors.find((c) => c.id === 'phantom');
        targetConnector = eip6963Phantom || injectedPhantom || connector;
      }

      try {
        await connect({ connector: targetConnector });
      } catch (err: unknown) {
        const errMsg = (err as Error)?.message || '';
        // If target connector fails because provider not found, fallback to generic injected
        if (errMsg.includes('Provider not found') || errMsg.includes('Connector not found')) {
          const genericInjected = connectors.find((c) => c.id === 'injected');
          if (genericInjected && genericInjected.id !== targetConnector.id && hasInjected) {
            await connect({ connector: genericInjected });
          } else {
            const walletName = str.includes('phantom') ? 'Phantom' : 'MetaMask';
            const walletUrl = str.includes('phantom') ? 'https://phantom.app/download' : 'https://metamask.io/download/';
            setInstallPrompt({ name: walletName, url: walletUrl });
            return;
          }
        } else {
          throw err;
        }
      }

      // Close modal smoothly once connected
      setTimeout(() => {
        onClose();
      }, 500);
    } catch {
      // Connect error handled by wagmi connectError
    }
  };

  // Disconnect handler
  const handleDisconnect = () => {
    disconnect();
    setMode('select');
  };

  // Helper metadata for known connectors
  const getConnectorMetadata = (connector: (typeof connectors)[0]) => {
    const nameLower = (connector.name || connector.id).toLowerCase();

    if (nameLower.includes('metamask')) {
      return {
        displayName: 'MetaMask',
        badge: 'Popular',
        badgeColor: 'bg-[#E66C35]/15 text-[#E66C35] border-[#E66C35]/30',
        description: 'Connect using MetaMask extension or mobile',
        downloadUrl: 'https://metamask.io/download/',
      };
    }
    if (nameLower.includes('phantom')) {
      return {
        displayName: 'Phantom',
        badge: 'Solana & EVM',
        badgeColor: 'bg-[#AB9FF2]/20 text-[#534BB1] border-[#AB9FF2]/40',
        description: 'Connect with Phantom extension (Multi-chain & EVM)',
        downloadUrl: 'https://phantom.app/download',
      };
    }
    if (nameLower.includes('injected') || connector.type === 'injected') {
      return {
        displayName: 'Browser Extension',
        badge: hasInjected ? 'Detected' : 'Injected',
        badgeColor: hasInjected
          ? 'bg-[#258454]/15 text-[#258454] border-[#258454]/30'
          : 'bg-[#77756F]/15 text-[#77756F] border-[#77756F]/30',
        description: 'Brave, OKX, Rabby, or default browser wallet',
        downloadUrl: null,
      };
    }

    return {
      displayName: connector.name,
      badge: 'EIP-6963',
      badgeColor: 'bg-[#77756F]/15 text-[#77756F] border-[#DEDBD3]',
      description: `Detected provider: ${connector.name}`,
      downloadUrl: null,
    };
  };

  // Priority ordering for wallet list (MetaMask #1, Phantom #2, Browser Extension #3)
  const getSortOrder = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('metamask')) return 1;
    if (lower.includes('phantom')) return 2;
    if (lower.includes('browser') || lower.includes('injected')) return 3;
    return 4;
  };

  // Deduplicate and filter to MetaMask, Phantom, and Browser Extension
  const displayedConnectors = connectors
    .filter((c, idx, arr) => {
      const meta = getConnectorMetadata(c);
      const name = meta.displayName.toLowerCase();
      const isAllowed =
        name.includes('metamask') ||
        name.includes('phantom') ||
        name.includes('browser extension') ||
        name.includes('injected');
      if (!isAllowed) return false;
      return arr.findIndex((item) => getConnectorMetadata(item).displayName === meta.displayName) === idx;
    })
    .sort((a, b) => {
      const nameA = getConnectorMetadata(a).displayName;
      const nameB = getConnectorMetadata(b).displayName;
      return getSortOrder(nameA) - getSortOrder(nameB);
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-[#121216] border border-[#26252C] rounded-3xl shadow-[0_15px_60px_rgba(0,0,0,0.8)] w-full max-w-lg overflow-hidden z-10 flex flex-col max-h-[90vh] text-[#F4F3EF]">
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-[#26252C] flex items-center justify-between bg-[#0A0A0C]/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#D43838] text-white flex items-center justify-center font-serif-display font-bold text-lg shadow-[0_0_12px_rgba(212,56,56,0.35)]">
              ₿
            </div>
            <div>
              <h2 className="font-serif-display text-2xl font-bold tracking-tight text-[#F4F3EF]">
                {mode === 'manage' && isConnected ? 'Wallet & Account' : 'Connect a Wallet'}
              </h2>
              <p className="text-xs font-mono text-[#9A978F]">
                {mode === 'manage' && isConnected
                  ? 'Connected to Mezo Testnet (Chain ID 31611)'
                  : 'Select your preferred wallet for BitStreamfi'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#9A978F] hover:text-[#F4F3EF] hover:bg-[#18181E] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status / Error Alert */}
          {connectError && (
            <div className="bg-[#C7473A]/10 border border-[#C7473A]/30 rounded-2xl p-4 flex items-start space-x-3 text-xs text-[#C7473A] font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-bold">Connection Request Failed</p>
                <p className="mt-0.5 text-[11px] opacity-90 break-words">
                  {formatErrorMessage(connectError.message)}
                </p>
              </div>
              <button
                onClick={() => resetConnect()}
                className="text-[#C7473A] hover:underline font-bold text-[11px]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Install Prompt If Wallet Missing */}
          {installPrompt && (
            <div className="bg-[#B7791F]/10 border border-[#B7791F]/30 rounded-2xl p-4 flex items-center justify-between text-xs font-mono text-[#B7791F]">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{installPrompt.name} extension not detected.</span>
              </div>
              <a
                href={installPrompt.url}
                target="_blank"
                rel="noreferrer"
                className="bg-[#B7791F] text-white px-3 py-1 rounded-lg font-bold hover:bg-[#B7791F]/90 transition-colors flex items-center space-x-1"
              >
                <span>Install</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* =========================================================================
              VIEW 1: CONNECT / SWITCH WALLET SELECTOR
             ========================================================================= */}
          {mode === 'select' && (
            <div className="space-y-4">
              {/* If user is connected and switching, show a switch banner */}
              {isConnected && (
                <div className="bg-[#E66C35]/10 border border-[#E66C35]/30 rounded-2xl p-3.5 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-2 text-[#E66C35]">
                    <ArrowRightLeft className="w-4 h-4 shrink-0" />
                    <span>Currently connected as: <strong>{formattedAddress}</strong></span>
                  </div>
                  <button
                    onClick={() => setMode('manage')}
                    className="text-[#171715] hover:text-[#E66C35] underline font-semibold transition-colors"
                  >
                    View Account
                  </button>
                </div>
              )}

              <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#77756F]">
                Available Wallets ({displayedConnectors.length})
              </p>

              {/* Wallet Connector Cards */}
              <div className="space-y-2.5">
                {displayedConnectors.map((connector) => {
                  const meta = getConnectorMetadata(connector);
                  const isCurrentActive = isConnected && activeConnector?.id === connector.id;
                  const isPendingThis = isConnecting && selectedConnectorId === connector.id;

                  return (
                    <button
                      key={connector.id}
                      onClick={() => handleSelectConnector(connector)}
                      disabled={isPendingThis || isCurrentActive}
                      className={`w-full group p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        isCurrentActive
                          ? 'border-[#34D399] bg-[#34D399]/10 shadow-sm'
                          : 'border-[#26252C] hover:border-[#D43838]/60 bg-[#0A0A0C] hover:bg-[#18181E] shadow-sm'
                      } disabled:opacity-75 cursor-pointer`}
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-xl bg-[#18181E] border border-[#26252C] flex items-center justify-center p-1.5 shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                          {getWalletIcon(connector.name || connector.id, connector.icon, 'w-7 h-7')}
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm text-[#F4F3EF] group-hover:text-[#FF7A7A] transition-colors">
                              {meta.displayName}
                            </span>
                            {isCurrentActive ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border border-[#34D399]/40 bg-[#34D399]/15 text-[#34D399] flex items-center space-x-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                                <span>Active</span>
                              </span>
                            ) : (
                              meta.badge && (
                                <span
                                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${meta.badgeColor}`}
                                >
                                  {meta.badge}
                                </span>
                              )
                            )}
                          </div>
                          <p className="text-xs text-[#9A978F] font-mono truncate mt-0.5">
                            {meta.description}
                          </p>
                        </div>
                      </div>

                      {/* Right indicator */}
                      <div className="flex items-center space-x-2 pl-3 shrink-0">
                        {isPendingThis ? (
                          <div className="flex items-center space-x-1.5 text-xs font-mono text-[#FF7A7A]">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span className="hidden sm:inline">Connecting...</span>
                          </div>
                        ) : isCurrentActive ? (
                          <CheckCircle2 className="w-5 h-5 text-[#34D399]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#9A978F] group-hover:text-[#F4F3EF] group-hover:translate-x-0.5 transition-all" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Security info notice */}
              <div className="bg-[#0A0A0C] border border-[#26252C] rounded-2xl p-3.5 flex items-start space-x-2.5 text-xs text-[#9A978F] font-mono">
                <ShieldCheck className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
                <p>
                  BitStreamfi connects securely to Mezo Testnet (31611). Your private keys remain safely inside your wallet.
                </p>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: CONNECTED ACCOUNT MANAGEMENT & SWITCH / DISCONNECT
             ========================================================================= */}
          {mode === 'manage' && isConnected && (
            <div className="space-y-6">
              {/* Account Overview Card */}
              <div className="bg-gradient-to-br from-[#18181E] via-[#121216] to-[#0A0A0C] text-[#F4F3EF] border border-[#26252C] rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-36 h-36 bg-[#D43838]/15 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-white/10 p-1 flex items-center justify-center">
                        {getWalletIcon(activeConnector?.name || activeConnector?.id, undefined, 'w-5 h-5')}
                      </div>
                      <span className="font-mono text-xs text-[#F4F3EF]/90 font-semibold">
                        {activeConnector?.name || 'Connected Wallet'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 bg-[#34D399]/20 border border-[#34D399]/40 px-2.5 py-1 rounded-full text-[11px] font-mono text-[#34D399]">
                      <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
                      <span>Mezo Testnet</span>
                    </div>
                  </div>

                  {/* Address & Copy */}
                  <div>
                    <span className="text-[11px] font-mono text-[#9A978F] uppercase tracking-wider block">
                      Wallet Address
                    </span>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="font-mono font-bold text-lg tracking-tight text-[#F4F3EF] select-all break-all">
                        {formattedAddress}
                      </span>
                      <button
                        onClick={handleCopy}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#F4F3EF] transition-colors cursor-pointer"
                        title="Copy full address"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-[#34D399]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={`https://explorer.test.mezo.org/address/${address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#F4F3EF] transition-colors"
                        title="View on Mezo Explorer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Native Balance */}
                  <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs font-mono">
                    <span className="text-[#9A978F]">Native Bitcoin (BTC):</span>
                    <strong className="text-[#F4F3EF] font-mono text-sm">
                      {btcBalance ? Number(formatEther(btcBalance.value)).toFixed(6) : '0.000000'} BTC
                    </strong>
                  </div>
                </div>
              </div>

              {/* SWITCH WALLET SECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ArrowRightLeft className="w-4 h-4 text-[#FF7A7A]" />
                    <h3 className="font-serif-display text-lg font-bold text-[#F4F3EF]">
                      Switch to Another Wallet
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-[#9A978F]">Select to switch</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {displayedConnectors
                    .filter((c) => c.id !== activeConnector?.id)
                    .map((connector) => {
                      const meta = getConnectorMetadata(connector);
                      const isPendingThis = isConnecting && selectedConnectorId === connector.id;

                      return (
                        <button
                          key={connector.id}
                          onClick={() => handleSelectConnector(connector)}
                          disabled={isConnecting}
                          className="flex items-center space-x-3 p-3 rounded-2xl border border-[#26252C] hover:border-[#D43838]/60 bg-[#0A0A0C] hover:bg-[#18181E] text-left transition-all group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#18181E] border border-[#26252C] flex items-center justify-center p-1 shrink-0 group-hover:scale-105 transition-transform">
                            {getWalletIcon(connector.name || connector.id, connector.icon, 'w-6 h-6')}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#F4F3EF] group-hover:text-[#FF7A7A] transition-colors truncate">
                              {meta.displayName}
                            </p>
                            <span className="text-[10px] text-[#9A978F] font-mono block truncate">
                              {isPendingThis ? 'Connecting...' : meta.badge || 'Switch'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* DISCONNECT SECTION */}
              <div className="pt-2 border-t border-[#26252C] flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-[#EF4444]/15 hover:bg-[#EF4444] text-[#EF4444] hover:text-white border border-[#EF4444]/40 text-xs font-mono font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Disconnect Wallet</span>
                </button>

                <button
                  onClick={() => setMode('select')}
                  className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-[#18181E] hover:bg-[#22222B] text-[#F4F3EF] border border-[#26252C] text-xs font-mono font-medium transition-colors cursor-pointer"
                >
                  Browse All Wallets
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3.5 bg-[#0A0A0C] border-t border-[#26252C] flex items-center justify-between text-[11px] font-mono text-[#9A978F]">
          <span>Mezo Testnet • 31611</span>
          <a
            href="https://explorer.test.mezo.org"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#FF7A7A] flex items-center space-x-1 underline transition-colors"
          >
            <span>Mezo Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
