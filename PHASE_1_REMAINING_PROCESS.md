# Phase 1: Remaining Tasks & Process Guide

This document outlines the remaining steps to fully complete **Phase 1 (Wave 1: Core Protocol, Vault, Streamer & Frontend PoC)** of **BitStreamfi**.

---

## 👤 Part 1: Your Action Items (Testnet Deployment & Faucets)

### Step 1: Fund Your Testnet Wallet
1. Visit the [Mezo Testnet Portal / Faucet](https://mezo.org) or join the [Mezo Discord](https://discord.gg/mezo) `#faucet` channel.
2. Request testnet native gas tokens, test `tBTC`, and `MUSD`.
3. Export your deployer private key and configure your environment:
   ```bash
   export PRIVATE_KEY="your_wallet_private_key_here"
   ```

### Step 2: Deploy Smart Contracts to Mezo Testnet
Run the Foundry deployment script against Mezo Testnet (`Chain ID: 31619`):
```bash
forge script script/Deploy.s.sol --rpc-url https://rpc.test.mezo.org --broadcast --verify
```
Save the deployed contract addresses (`MezoFlowVault`, `PayrollStreamer`, `SelfRepayingCreditEngine`).

---

## 🤖 Part 2: What Claude Will Build (Frontend PoC)

Claude will build a mobile-responsive **Next.js Web Dashboard (`BitStreamfi App`)** using Tailwind CSS and Wagmi/Viem:

### 1. Project Setup
- Initialize Next.js project structure under `frontend/`.
- Install dependencies (`viem`, `wagmi`, `@tanstack/react-query`, `lucide-react`, `tailwindcss`).

### 2. Core UI Components & Features
- **Wallet Connection Modal:** Connect via MetaMask / WalletConnect to Mezo Testnet.
- **Vault Interface (`tBTC` & `MUSD`):**
  - Input tBTC collateral amount -> Call `depositCollateral()`.
  - View collateral balance and current LTV ratio (max 60%).
  - Borrow `MUSD` -> Call `borrowMUSD()`.
  - Repay `MUSD` & amortize debt via `SelfRepayingCreditEngine`.
- **Payroll Streaming Interface:**
  - Create second-by-second salary streams (`createStream()`).
  - View active streams, claim/withdraw streamed MUSD (`withdrawFromStream()`).
  - Stream management controls: `topUpStream()` and `cancelStream()`.

---

## 📋 Execution Order
1. You complete testnet funding and contract deployment.
2. Claude builds the Next.js frontend PoC (`BitStreamfi App`).
3. Connect frontend contract addresses to complete Phase 1.
