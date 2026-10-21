# BitStreamfi: Comprehensive Project Overview & Architecture

**BitStreamfi** is a decentralized, Bitcoin-backed payroll and merchant settlement protocol built on the **Mezo Network** (Bitcoin Layer 2). It unlocks productive utility for idle Bitcoin (`tBTC`) by enabling users to borrow stablecoins (`MUSD`), stream salaries second-by-second, and automatically amortize debt using staking yields.

---

## 🏗️ 1. Core Architecture & Smart Contracts (`src/`)

### A. `MezoFlowVault.sol`
- **Purpose**: Manages `tBTC` collateral deposits and `MUSD` stablecoin borrowing.
- **Key Features**:
  - **Collateral Management**: Users deposit `tBTC` as collateral.
  - **Strict Max LTV**: Enforces a strict 60% Maximum Loan-to-Value (`MAX_LTV_BPS = 6000`) based on collateral valuation models ($60,000 / tBTC).
  - **Security**: Protected with OpenZeppelin `ReentrancyGuard` (`nonReentrant` modifier) to prevent reentrancy attacks.

### B. `PayrollStreamer.sol`
- **Purpose**: Enables continuous, second-by-second `MUSD` salary and payment streaming.
- **Key Features**:
  - **Stream Creation (`createStream`)**: Employers deposit `MUSD` for a specified duration and designate a recipient.
  - **Claim & Withdraw (`withdrawFromStream`)**: Recipients can withdraw streamed funds at any second.
  - **Streaming Controls**:
    - `topUpStream`: Allows employers to add additional `MUSD` liquidity to existing streams.
    - `cancelStream`: Allows premature cancellation with proportional refunds.

### C. `SelfRepayingCreditEngine.sol`
- **Purpose**: Automates debt repayment for vault borrowers by channeling staking yields.
- **Key Features**:
  - **Yield Tracking**: Tracks staking yields per user (`stakingYieldBalances`).
  - **Automated Amortization (`amortizeDebt`)**: Directs yield earnings toward paying down active `MUSD` loan balances in `MezoFlowVault`.

---

## 🌐 2. Frontend Web Dashboard (`frontend/`)

Built using **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Wagmi / Viem**, configured specifically for **Mezo Testnet (Chain 31611)**.

### Deployed Contract Addresses (Mezo Testnet)
- **MezoFlowVault**: `0x34623FB11C65E2Cab4d252460AF1DC0F36ba9D20`
- **PayrollStreamer**: `0x0486bbfC22AA66F61A9fa1c35e221DfB19de6d93`
- **SelfRepayingCreditEngine**: `0x625Cf421C9D7B58E747cf7D6301bdb3f235524f0`

### Key UI Features
1. **Wallet Connection Modal**: Seamlessly connects via MetaMask or WalletConnect to Mezo Testnet.
2. **MezoFlow Vault & Credit Engine Tab**:
   - Deposit `tBTC` collateral (`depositCollateral()`).
   - Borrow `MUSD` stablecoins (`borrowMUSD()`).
   - Repay `MUSD` debt (`repayMUSD()`).
   - Real-time LTV ratio tracking and health checks.
3. **Payroll Streamer Tab**:
   - Create continuous salary streams (`createStream()`).
   - View active stream details (employer, recipient, deposit, withdrawn).
   - Stream controls: `topUpStream()`, `withdrawFromStream()`, and `cancelStream()`.

---

## 🗺️ 3. Development Roadmap & Phases

### Phase 1: Wave 1 (Completed ✅)
- Core smart contract architecture (`MezoFlowVault`, `PayrollStreamer`, `SelfRepayingCreditEngine`).
- Comprehensive unit testing suite (`MezoFlowVault.t.sol` with 100% pass rate).
- Mezo Testnet deployment (`Deploy.s.sol`).
- Fully responsive Next.js Web Dashboard (`BitStreamfi App`).

### Phase 2: Wave 2 (Upcoming 🚀)
- **Telegram Mini-App (Track 2 Integration)**:
  - Setup Telegram Bot and mobile-optimized Mini-App UI using `@twa-dev/sdk`.
  - Quick balance checks, stream claims, and health factor notifications directly inside Telegram.
- **MEZO Staking & Yield Boosts**:
  - Implement `MezoStakingBoost.sol` for MEZO token yield multipliers and fee discounts.
- **Final Polish & Submission**:
  - Final security audit, 2-minute product pitch video, and AKINDO buildathon submission.
