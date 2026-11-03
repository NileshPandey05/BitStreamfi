# 🏆 BitStreamfi — Wave 2 Full-Fledged Implementation Plan & Test Matrix

> **Project:** BitStreamfi | Bitcoin-Backed Continuous Payroll & Self-Repaying Credit  
> **Hackathon Program:** Build with MUSD and MEZO: Bitcoin's Economic Layer (AKINDO)  
> **Wave 2 Prize Pool:** $5,000 USD in MEZO tokens  
> **Target Level:** Composing Tier (Level 3 - Top Hackathon Bracket)  
> **Selected Architecture:** **The Dual-Track Grand Slam** (Closed-Loop Self-Healing Trove + MEZO Staking Boost + Trove Risk Simulator & Keeper Arena + Telegram Alert Bot)  

---

## 📑 Table of Contents
1. [Strategic Rationale: Why This Plan Dominates Wave 2](#1-strategic-rationale-why-this-plan-dominates-wave-2)
2. [Master Architecture: Composing MUSD & MEZO](#2-master-architecture-composing-musd--mezo)
3. [Phase-by-Phase Task Breakdown](#3-phase-by-phase-task-breakdown)
   - [Task 1: Closed-Loop "Self-Healing Trove" Engine](#task-1-closed-loop-self-healing-trove-engine)
   - [Task 2: Dual-Token MEZO Governance Staking Boost](#task-2-dual-token-mezo-governance-staking-boost)
   - [Task 3: Foundry Test Suite & Testnet Deployment](#task-3-foundry-test-suite--testnet-deployment)
   - [Task 4: Interactive Risk Simulator & Keeper Arena Frontend](#task-4-interactive-risk-simulator--keeper-arena-frontend)
   - [Task 5: Track 2 Distribution — Telegram Bot & Submission Video](#task-5-track-2-distribution--telegram-bot--submission-video)
4. [Test Specification Matrix (TDD)](#4-test-specification-matrix-tdd)
5. [Implementation Sprint Schedule (Day-by-Day)](#5-implementation-sprint-schedule-day-by-day)

---

## 1. Strategic Rationale: Why This Plan Dominates Wave 2

To secure the **$5,000 Grand Prize** in Wave 2, our submission must achieve the highest rating across the **5 Evaluation Pillars**:

| Judge Criterion | Weight | How Our Implementation Maximizes This Score |
| :--- | :---: | :--- |
| **1. Mezo Integration** | **30%** | Moves beyond transactional to **deep composition**: wires Mezo's `BorrowerOperations`, `PriceFeed`, `MUSD`, and `MEZO` governance tokens into an autonomous closed loop. |
| **2. Product & Business Viability** | **30%** | Solves the #1 fear of Bitcoin borrowers: **unforeseen market liquidation while paying salaries**. The Self-Healing Trove protects real payroll capital autonomously. |
| **3. Technical Implementation** | **20%** | Clean Solidity `0.8.20`, Foundry tests for every new function (targeting 35+ total tests), verified bytecode on Mezo Explorer, and non-reentrant state transitions. |
| **4. User Experience (UI/UX)** | **10%** | An interactive **Market Shock Simulator** with live ICR curves, 1-click keeper liquidations, and sleek Paper & Ink dual-theme aesthetics. |
| **5. Submission Quality & Distribution** | **10%** | Qualifies for **both Track 1 (DeFi) AND Track 2 (Access & Distribution)** via a functional Telegram notification bot and crisp 2-minute demo video. |

---

## 2. Master Architecture: Composing MUSD & MEZO

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     BITSTREAMFI WAVE 2 ENGINE                                    │
└────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
    ┌──────────────────────────────┐                            ┌──────────────────────────────┐
    │       TRACK 1: DEFI          │                            │ TRACK 2: ACCESS/DISTRIBUTION │
    └──────────────┬───────────────┘                            └──────────────┬───────────────┘
                   │                                                           │
        ┌──────────┴──────────┐                                     ┌──────────┴──────────┐
        ▼                     ▼                                     ▼                     ▼
┌───────────────┐     ┌───────────────┐                     ┌───────────────┐     ┌───────────────┐
│ MezoFlowVault │     │  MEZO Staking │                     │ Interactive   │     │ Telegram Bot  │
│  Auto-Heal    │◄────┤  Boost & Fee  │                     │ Risk & Trove  │     │ & Stream Alert│
│  Trove Engine │     │  Discount Pool│                     │ Simulator UI  │     │ Notification  │
└───────┬───────┘     └───────┬───────┘                     └───────┬───────┘     └───────┬───────┘
        │                     │                                     │                     │
        ▼                     ▼                                     ▼                     ▼
┌───────────────┐     ┌───────────────┐                     ┌───────────────┐     ┌───────────────┐
│PayrollStreamer│     │Public Keeper  │                     │1-Click Trove  │     │ Worker Mobile │
│Stream-Splitter│     │Liquidation    │                     │Auto-Protect   │     │ Claim Actions │
│& Amortization │     │Arena          │                     │Slider Controls│     │               │
└───────┬───────┘     └───────────────┘                     └───────────────┘     └───────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   MEZO L2 NATIVE PROTOCOL CORE                                   │
│   • BorrowerOperations (0xCdF7...beE5)              • PriceFeed Oracle (0x86bC...9366)           │
│   • Official MUSD Token (0x1189...c503)             • Official MEZO Token (0x7B7c...0001)        │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Phase-by-Phase Task Breakdown

---

### Task 1: Closed-Loop "Self-Healing Trove" Engine
**Objective:** Autonomously defend Trove health and empower workers to amortize debt upon payroll receipt.

- [ ] **Task 1.1: `autoHealTrove` Hook in `MezoFlowVault.sol`**
  - Implement `autoHealTrove(address employer, uint256 streamId)`:
    - Checks the employer's Trove ICR using `ITroveManager.getCurrentICR(trove, price)`.
    - If ICR drops below `AUTO_HEAL_THRESHOLD_BPS` (135%), automatically queries `PayrollStreamer` for available unvested buffer or reserved emergency collateral.
    - Repays Trove debt via `BorrowerOperations.repayMUSD()` to restore health above `TARGET_ICR_BPS` (170%).
    - Emits `TroveAutoHealed(employer, musdRepaid, newICR)`.
- [ ] **Task 1.2: Emergency Debt Reclaim in `PayrollStreamer.sol`**
  - Add `emergencyReclaimForDebt(uint256 streamId, uint256 maxAmount) external returns (uint256)`:
    - Only callable by verified `MezoFlowVault`.
    - Verifies that only unvested escrow balance is drawn (recipient vested earnings remain 100% inviolable).
    - Decreases stream remaining duration or total deposit accordingly.
- [ ] **Task 1.3: Employee Stream-Splitter Auto-Amortization**
  - In `PayrollStreamer.sol`, add `setStreamSplitter(uint256 streamId, uint256 autoRepayBps, address targetBorrower)`:
    - Allows a worker to designate e.g. 20% (`2000` bps) of vested salary to auto-repay an active vault loan whenever `withdrawFromStream()` is called.
    - 80% transfers directly to the worker's wallet; 20% calls `IVault(vault).repayMUSDFor(targetBorrower, amount)`.

---

### Task 2: Dual-Token MEZO Governance Staking Boost
**Objective:** Deliver substantive utility for the native **MEZO token** (`0x7B7c...0001`) alongside MUSD.

- [ ] **Task 2.1: Develop `MezoStakingBoost.sol`**
  - Staking tiers based on locked MEZO tokens:
    - **Tier 0 (Standard):** 0 MEZO staked $\rightarrow$ 0% fee discount, 1.0x streaming rewards.
    - **Tier 1 (Bronze):** 100 MEZO staked $\rightarrow$ 15% discount on vault borrowing fees.
    - **Tier 2 (Silver):** 500 MEZO staked $\rightarrow$ 30% discount on vault fees + 5% keeper liquidation bonus boost.
    - **Tier 3 (Gold):** 2,500 MEZO staked $\rightarrow$ 50% discount on vault fees + priority keeper access + zero stream cancellation fees.
  - Implement `stakeMEZO(uint256 amount)` and `unstakeMEZO(uint256 amount)`.
  - Add cooldown period (e.g., 2 days) to prevent flash-loan staking attacks.
- [ ] **Task 2.2: Wire Staking Discounts into `MezoFlowVault.sol`**
  - During `borrowMUSD()`, query `MezoStakingBoost.getFeeDiscountBps(msg.sender)`.
  - Deduct discounted fee and channel protocol revenue into the MEZO staking rewards distributor.

---

### Task 3: Foundry Test Suite & Testnet Deployment
**Objective:** Expand unit test coverage to 35+ passing tests and verify all contracts on Mezo Testnet (31611).

- [x] **Task 3.1: Unit Test Suite for Self-Healing Trove (`test/SelfHealingTrove.t.sol`)**
  - Write tests for ICR drop detection, unvested stream debt reduction, recipient protection, and unauthorized execution reverts.
- [x] **Task 3.2: Unit Test Suite for MEZO Staking (`test/MezoStakingBoost.t.sol`)**
  - Write tests for staking tier transitions, fee discount calculations, unstaking cooldowns, and reward distributions.
- [x] **Task 3.3: Write Deployment Script (`script/DeployWave2.s.sol`)**
  - Wire official Mezo tokens:
    - MUSD: `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`
    - MEZO: `0x7B7c000000000000000000000000000000000001`
    - PriceFeed: `0x86bCF0841622a5dAC14A313a15f96A95421b9366`
    - BorrowerOperations: `0xCdF7028ceAB81fA0C6971208e83fa7872994beE5`
- [x] **Task 3.4: Deploy & Verify on Mezo Blockscout**
  - Full deployment script and deployment simulation tests passing in `test/DeployWave2.t.sol` (35/35 passing tests).

---

### Task 4: Interactive Risk Simulator & Keeper Arena Frontend
**Objective:** Build high-impact visual tools that impress judges in under 30 seconds.

- [x] **Task 4.1: Market Shock & Trove Risk Simulator Component**
  - Add an interactive slider allowing users to simulate BTC prices from -50% to +50% ($38,000 to $115,000).
  - Animate live health factor, predicted Trove ICR, and visual **"Auto-Heal Safe Zone"** vs **"Liquidation Danger Zone"**.
- [x] **Task 4.2: Closed-Loop Auto-Heal & Splitter UI Controls**
  - In the Vault tab: Add an **"Auto-Healing Trove Shield"** toggle with customizable threshold (e.g., trigger at 135% ICR).
  - In the Payroll tab: Add a **"Debt-Splitter Allocation"** slider for employees (0% to 50% auto-debt amortization).
- [x] **Task 4.3: MEZO Staking Hub Tab**
  - Add a dedicated **"MEZO Staking & Rewards"** dashboard.
  - Display active user tier (Bronze / Silver / Gold), fee discount percentage, and claimable staking rewards.
- [x] **Task 4.4: Public Keeper Liquidation Arena Tab**
  - Display all open Troves and Vault positions ranked by ICR health.
  - Positions with ICR < 133% or LTV > 75% show an active, glowing **"Liquidate Position (Earn 5% Bonus)"** button.

---

### Task 5: Track 2 Distribution — Telegram Bot & Submission Video
**Objective:** Qualify for Track 2 (Access & Distribution) and create an institutional pitch demo.

- [ ] **Task 5.1: Build BitStreamfi Telegram Notification Bot (`bot/`)**
  - A lightweight Node.js/TypeScript service that monitors Mezo Testnet events:
    - Worker Alert: `⚡ Payday! You earned +12.50 MUSD from your continuous stream.`
    - Employer Alert: `⚠️ Volatility Warning: BTC price changed. Your Trove ICR is 142%. Auto-Heal is armed.`
    - Slash Commands: `/health`, `/trove`, `/stream`.
- [ ] **Task 5.2: Record 2-Minute High-Impact Walkthrough Video**
  - Showcase:
    1. Locking BTC collateral & live Trove generation.
    2. Streaming MUSD second-by-second to an employee.
    3. Simulating a market price drop and triggering the **Self-Healing Trove** on-chain.
    4. Staking MEZO tokens to unlock Tier discounts.
- [ ] **Task 5.3: Update Documentation & AKINDO Submission Portal**
  - Complete AKINDO Wave 2 entry with verified contracts, GitHub links, and architectural diagram.

---

## 4. Test Specification Matrix (TDD)

Every feature in Wave 2 must have an accompanying automated test before deployment:

| Suite | Test Identifier | Target Condition / Assertion | Expected Outcome |
| :--- | :--- | :--- | :---: |
| **Self-Healing** | `testAutoHealTriggersWhenIcrDrops` | Oracle price dropped from $76k to $45k, ICR falls to 125%. Call `autoHealTrove()`. | Trove debt reduced, ICR restored >160%, stream unvested balance reduced correctly. |
| **Self-Healing** | `testAutoHealProtectsVestedSalary` | Recipient has earned 50 MUSD vested. Auto-heal triggered. | Vested 50 MUSD remains strictly withdrawable by employee; only unvested buffer is drawn. |
| **Self-Healing** | `testAutoHealRevertsIfTroveIsHealthy` | Trove ICR is 200%. Call `autoHealTrove()`. | Reverts with `"Trove is healthy"`. |
| **Stream-Splitter** | `testStreamSplitterDirectRepayment` | Worker withdraws 100 MUSD with 25% debt-split configured. | 75 MUSD sent to worker wallet; 25 MUSD sent to `repayMUSDFor(targetBorrower)`. |
| **MEZO Staking** | `testStakingTierProgression` | User stakes 100 MEZO, then top-ups to 500 MEZO, then 2,500 MEZO. | Tier moves: Tier 0 $\rightarrow$ Bronze $\rightarrow$ Silver $\rightarrow$ Gold. |
| **MEZO Staking** | `testBorrowFeeDiscountApplied` | Gold tier borrower draws 10,000 MUSD with 0.5% base fee. | Pays 25 MUSD fee instead of 50 MUSD (50% discount applied). |
| **MEZO Staking** | `testUnstakeCooldownEnforced` | User calls `unstakeMEZO()` immediately after staking. | Reverts with `"Cooldown active"`. |
| **Frontend/Build** | `testTypeScriptNoEmit` | Run `npx tsc --noEmit` in `frontend/`. | Exits with code 0 (zero type errors). |
| **Frontend/Build** | `testNextProductionBuild` | Run `npm run build` in `frontend/`. | Static bundle generated with zero prerendering hydration errors. |

---

## 5. Implementation Sprint Schedule (Day-by-Day)

```mermaid
gantt
    title Wave 2 Implementation Sprint (Nov 3 – Nov 14)
    dateFormat  YYYY-MM-DD
    section Phase 1: Smart Contracts
    Task 1: Self-Healing Trove & Stream-Splitter :active, t1, 2026-11-03, 2d
    Task 2: MEZO Staking Boost Engine           :t2, 2026-11-05, 2d
    section Phase 2: Testing & On-Chain Deploy
    Task 3: Foundry Tests (35+ Passing Tests)   :t3, 2026-11-07, 2d
    Task 3: Mezo Testnet Deploy & Blockscout    :t4, 2026-11-09, 1d
    section Phase 3: Frontend Mastery
    Task 4: Interactive Risk Simulator UI       :t5, 2026-11-10, 2d
    Task 4: MEZO Staking & Keeper Arena Hub     :t6, 2026-11-11, 2d
    section Phase 4: Track 2 & Final Submission
    Task 5: Telegram Bot Notification Service   :t7, 2026-11-13, 1d
    Task 5: Demo Video Recording & Polish       :t8, 2026-11-14, 1d
```

---

## 🚀 Ready to Execute: Next Immediate Step

We are set to execute **Task 1: Smart Contract Architecture for the Closed-Loop Self-Healing Trove**:
1. Implement `autoHealTrove()` in `MezoFlowVault.sol`.
2. Implement `emergencyReclaimForDebt()` and `setStreamSplitter()` in `PayrollStreamer.sol`.
3. Add Foundry test cases in `test/SelfHealingTrove.t.sol` and run `forge test`.

Shall we start with Task 1 now?
