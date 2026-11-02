'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { injected, safe } from 'wagmi/connectors';

export const mezoTestnet = defineChain({
  id: 31611,
  name: 'Mezo Testnet',
  nativeCurrency: { decimals: 18, name: 'Bitcoin', symbol: 'BTC' },
  rpcUrls: {
    default: { http: ['https://rpc.test.mezo.org'] },
  },
  blockExplorers: {
    default: { name: 'Mezo Explorer', url: 'https://explorer.test.mezo.org' },
  },
});

export const wagmiConfig = createConfig({
  chains: [mezoTestnet],
  multiInjectedProviderDiscovery: true,
  connectors: [
    injected({ target: 'metaMask' }),
    injected({ target: 'coinbaseWallet' }),
    injected({
      target: {
        id: 'rabby',
        name: 'Rabby Wallet',
        provider(window) {
          if (typeof window === 'undefined') return undefined;
          const win = window as unknown as { rabby?: unknown; ethereum?: { isRabby?: boolean } };
          return (win.rabby || (win.ethereum?.isRabby ? win.ethereum : undefined)) as any;
        },
      },
    }),
    injected(),
    safe(),
  ],
  transports: {
    [mezoTestnet.id]: http('https://rpc.test.mezo.org'),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
