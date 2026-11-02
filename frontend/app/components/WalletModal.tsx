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

  // Connect or switch to a connector
  const handleSelectConnector = async (connector: (typeof connectors)[0]) => {
    try {
      setSelectedConnectorId(connector.id);
      setInstallPrompt(null);
      resetConnect();

      // Check if wallet extension is missing for specific connectors
      const str = (connector.name || connector.id).toLowerCase();
      if (typeof window !== 'undefined') {
        const eth = (window as unknown as {
          ethereum?: {
            isMetaMask?: boolean;
            isCoinbaseWallet?: boolean;
            isRabby?: boolean;
            providers?: Array<{ isMetaMask?: boolean; isCoinbaseWallet?: boolean; isRabby?: boolean }>;
          };
          rabby?: unknown;
          coinbaseWalletExtension?: unknown;
        });

        const hasMM = Boolean(
          eth?.ethereum?.isMetaMask ||
          eth?.ethereum?.providers?.some((p) => p.isMetaMask)
        );

        if (str.includes('metamask') && !hasMM && !hasInjected) {
          setInstallPrompt({
            name: 'MetaMask',
            url: 'https://metamask.io/download/',
          });
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
      } else if (str.includes('coinbase')) {
        const eip6963CB = connectors.find((c) => c.id === 'com.coinbase.wallet');
        const injectedCB = connectors.find((c) => c.id === 'coinbaseWallet');
        targetConnector = eip6963CB || injectedCB || connector;
      } else if (str.includes('rabby')) {
        const eip6963Rabby = connectors.find((c) => c.id === 'io.rabby');
        const injectedRabby = connectors.find((c) => c.id === 'rabby');
        targetConnector = eip6963Rabby || injectedRabby || connector;
      }

      try {
        await connect({ connector: targetConnector });
      } catch (err: unknown) {
        // Fallback: If target connector fails but generic injected exists, try that
        const genericInjected = connectors.find((c) => c.id === 'injected');
        if (genericInjected && genericInjected.id !== targetConnector.id) {
          await connect({ connector: genericInjected });
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
    if (nameLower.includes('coinbase')) {
      return {
        displayName: 'Coinbase Wallet',
        badge: 'Smart Wallet',
        badgeColor: 'bg-[#0052FF]/15 text-[#0052FF] border-[#0052FF]/30',
        description: 'Connect with Coinbase extension, Smart Wallet, or mobile',
        downloadUrl: 'https://www.coinbase.com/wallet/downloads',
      };
    }
    if (nameLower.includes('rabby')) {
      return {
        displayName: 'Rabby Wallet',
        badge: 'Web3 Native',
        badgeColor: 'bg-[#8697FF]/15 text-[#4E61DB] border-[#8697FF]/30',
        description: 'Multi-chain wallet built for DeFi & EVM power users',
        downloadUrl: 'https://rabby.io/',
      };
    }
    if (nameLower.includes('safe')) {
      return {
        displayName: 'Safe (Gnosis Safe)',
        badge: 'Multisig',
        badgeColor: 'bg-[#12FF80]/20 text-[#097339] border-[#12FF80]/40',
        description: 'Connect a Mezo multi-signature contract account',
        downloadUrl: 'https://app.safe.global/',
      };
    }
    if (nameLower.includes('injected') || connector.type === 'injected') {
      return {
        displayName: 'Browser Extension',
        badge: hasInjected ? 'Detected' : 'Injected',
        badgeColor: hasInjected
          ? 'bg-[#258454]/15 text-[#258454] border-[#258454]/30'
          : 'bg-[#77756F]/15 text-[#77756F] border-[#77756F]/30',
        description: 'Brave, Phantom, OKX, or default browser wallet',
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

  // Priority ordering for wallet list (MetaMask #1, Coinbase #2, Rabby #3, etc.)
  const getSortOrder = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('metamask')) return 1;
    if (lower.includes('coinbase')) return 2;
    if (lower.includes('rabby')) return 3;
    if (lower.includes('browser') || lower.includes('injected')) return 4;
    if (lower.includes('safe')) return 5;
    return 6;
  };

  // Deduplicate connectors by display name/ID and sort by popularity
  const displayedConnectors = connectors
    .filter((c, idx, arr) => {
      const meta = getConnectorMetadata(c);
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-[#FBFAF7] border border-[#DEDBD3] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-[#DEDBD3] flex items-center justify-between bg-[#F6F4EF]/70">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#171715] text-[#FBFAF7] flex items-center justify-center font-serif-display font-bold text-lg shadow-sm">
              ₿
            </div>
            <div>
              <h2 className="font-serif-display text-2xl font-bold tracking-tight text-[#171715]">
                {mode === 'manage' && isConnected ? 'Wallet & Account' : 'Connect a Wallet'}
              </h2>
              <p className="text-xs font-mono text-[#77756F]">
                {mode === 'manage' && isConnected
                  ? 'Connected to Mezo Testnet (Chain ID 31611)'
                  : 'Select your preferred wallet for BitStreamfi'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#77756F] hover:text-[#171715] hover:bg-[#DEDBD3]/40 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6">
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

              {/* Status / Error Alert */}
              {connectError && (
                <div className="bg-[#C7473A]/10 border border-[#C7473A]/30 rounded-2xl p-4 flex items-start space-x-3 text-xs text-[#C7473A] font-mono">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold">Connection Request Failed</p>
                    <p className="mt-0.5 text-[11px] opacity-90 break-words">
                      {connectError.message.includes('User rejected')
                        ? 'Connection rejected in your wallet. Please approve the prompt.'
                        : connectError.message}
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
                          ? 'border-[#258454] bg-[#258454]/5 shadow-sm'
                          : 'border-[#DEDBD3] hover:border-[#171715] bg-[#FBFAF7] hover:bg-[#F6F4EF] shadow-sm hover:shadow'
                      } disabled:opacity-75`}
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-xl bg-white border border-[#DEDBD3] flex items-center justify-center p-1.5 shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                          {getWalletIcon(connector.name || connector.id, connector.icon, 'w-7 h-7')}
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm text-[#171715] group-hover:text-[#E66C35] transition-colors">
                              {meta.displayName}
                            </span>
                            {isCurrentActive ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border border-[#258454]/40 bg-[#258454]/15 text-[#258454] flex items-center space-x-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#258454]" />
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
                          <p className="text-xs text-[#77756F] font-mono truncate mt-0.5">
                            {meta.description}
                          </p>
                        </div>
                      </div>

                      {/* Right indicator */}
                      <div className="flex items-center space-x-2 pl-3 shrink-0">
                        {isPendingThis ? (
                          <div className="flex items-center space-x-1.5 text-xs font-mono text-[#E66C35]">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span className="hidden sm:inline">Connecting...</span>
                          </div>
                        ) : isCurrentActive ? (
                          <CheckCircle2 className="w-5 h-5 text-[#258454]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#77756F] group-hover:text-[#171715] group-hover:translate-x-0.5 transition-all" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Security info notice */}
              <div className="bg-[#F6F4EF] border border-[#DEDBD3] rounded-2xl p-3.5 flex items-start space-x-2.5 text-xs text-[#77756F] font-mono">
                <ShieldCheck className="w-4 h-4 text-[#258454] shrink-0 mt-0.5" />
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
              <div className="bg-gradient-to-br from-[#171715] to-[#252522] text-[#FBFAF7] rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-36 h-36 bg-[#E66C35]/15 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-white/10 p-1 flex items-center justify-center">
                        {getWalletIcon(activeConnector?.name || activeConnector?.id, undefined, 'w-5 h-5')}
                      </div>
                      <span className="font-mono text-xs text-white/80 font-semibold">
                        {activeConnector?.name || 'Connected Wallet'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 bg-[#258454]/30 border border-[#258454]/60 px-2.5 py-1 rounded-full text-[11px] font-mono text-[#12FF80]">
                      <span className="w-2 h-2 rounded-full bg-[#12FF80] animate-pulse" />
                      <span>Mezo Testnet</span>
                    </div>
                  </div>

                  {/* Address & Copy */}
                  <div>
                    <span className="text-[11px] font-mono text-white/50 uppercase tracking-wider block">
                      Wallet Address
                    </span>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="font-mono font-bold text-lg tracking-tight text-white select-all break-all">
                        {formattedAddress}
                      </span>
                      <button
                        onClick={handleCopy}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                        title="Copy full address"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-[#12FF80]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={`https://explorer.test.mezo.org/address/${address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                        title="View on Mezo Explorer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Native Balance */}
                  <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs font-mono">
                    <span className="text-white/60">Native Bitcoin (BTC):</span>
                    <strong className="text-white font-mono text-sm">
                      {btcBalance ? Number(formatEther(btcBalance.value)).toFixed(6) : '0.000000'} BTC
                    </strong>
                  </div>
                </div>
              </div>

              {/* SWITCH WALLET SECTION (Direct answer to user prompt: "give option to select what wallet") */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ArrowRightLeft className="w-4 h-4 text-[#E66C35]" />
                    <h3 className="font-serif-display text-lg font-bold text-[#171715]">
                      Switch to Another Wallet
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-[#77756F]">Select to switch</span>
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
                          className="flex items-center space-x-3 p-3 rounded-2xl border border-[#DEDBD3] hover:border-[#E66C35] bg-[#FBFAF7] hover:bg-[#F6F4EF] text-left transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white border border-[#DEDBD3] flex items-center justify-center p-1 shrink-0 group-hover:scale-105 transition-transform">
                            {getWalletIcon(connector.name || connector.id, connector.icon, 'w-6 h-6')}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#171715] group-hover:text-[#E66C35] transition-colors truncate">
                              {meta.displayName}
                            </p>
                            <span className="text-[10px] text-[#77756F] font-mono block truncate">
                              {isPendingThis ? 'Connecting...' : meta.badge || 'Switch'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* DISCONNECT SECTION */}
              <div className="pt-2 border-t border-[#DEDBD3] flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-[#C7473A]/10 hover:bg-[#C7473A] text-[#C7473A] hover:text-white border border-[#C7473A]/30 text-xs font-mono font-bold transition-all flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Disconnect Wallet</span>
                </button>

                <button
                  onClick={() => setMode('select')}
                  className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-[#F6F4EF] hover:bg-[#DEDBD3]/50 text-[#171715] border border-[#DEDBD3] text-xs font-mono font-medium transition-colors"
                >
                  Browse All Wallets
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3.5 bg-[#F6F4EF] border-t border-[#DEDBD3] flex items-center justify-between text-[11px] font-mono text-[#77756F]">
          <span>Mezo Testnet • 31611</span>
          <a
            href="https://explorer.test.mezo.org"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#171715] flex items-center space-x-1 underline"
          >
            <span>Mezo Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
