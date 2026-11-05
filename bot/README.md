# 🤖 BitStreamfi Telegram Bot & Event Notification Engine
### *Mezo Network Wave 2 Hackathon — Track 2: Access & Distribution*

BitStreamfi's Telegram Alert Bot connects workers and employers on Mezo Network directly to continuous on-chain liquidity, Trove health tracking, and automated self-healing events.

---

## 🌟 Key Features

1. **24/7 Trove Health & Liquidation Monitor**:
   - Queries live `BorrowerOperations` and `PriceFeed` contracts.
   - Calculates real-time Individual Collateral Ratio (ICR) and LTV.
   - Alerts borrowers before market volatility threatens their collateral.

2. **Real-Time Payday Alerts**:
   - Listens for `TokensClaimed` and `StreamCreated` events on `PayrollStreamer.sol`.
   - Sends instant push notifications: *"⚡ Payday! You earned +25.50 MUSD from your continuous stream."*

3. **Autonomous Self-Healing Notifications**:
   - When Bitcoin drops and the **Closed-Loop Self-Healing Trove** executes debt repayment from unvested payroll escrow, the bot immediately notifies the borrower: *"🛡️ Auto-Heal Triggered: Debt reduced, ICR restored to 164%."*

4. **Market Shock Simulator in Telegram**:
   - Users can test `/simulate 30` to preview how their Trove would withstand a 30% Bitcoin crash.

---

## ⚡ Slash Commands

| Command | Arguments | Description |
| :--- | :--- | :--- |
| `/oracle` | *none* | Fetches the live on-chain BTC/USD oracle price from Mezo's `PriceFeed` contract. |
| `/trove` | `<address>` | Displays native BTC/tBTC collateral, MUSD debt, ICR %, and liquidation safety. |
| `/stream` | `<streamId>` | Visualizes salary stream progress bar, vested claimable MUSD, and accrual rate. |
| `/stake` | `<address>` | Shows MEZO tokens staked, Tier status (Bronze/Silver/Gold), and fee discounts. |
| `/simulate` | `<drop%> [addr]` | Simulates a market crash and verifies autonomous Self-Healing intervention. |
| `/watch` | `<address>` | Subscribes your Telegram chat to automated on-chain alerts. |
| `/help` | *none* | Displays the command guide. |

---

## 🛠️ Quick Start & Installation

```bash
# 1. Navigate to bot directory
cd bot

# 2. Install dependencies
npm install

# 3. Configure environment variables (optional for live Telegram)
cp .env.example .env
# Edit TELEGRAM_BOT_TOKEN in .env if you have a bot token from @BotFather

# 4. Run the Live On-Chain Testbench
npm run demo

# 5. Start the bot service
npm start
```

---

## 🔗 Verified Mezo Testnet Contracts Queried
- **MezoFlowVault**: `0x669dBAd6F813CDeCa14e1A46AB91c95017603f85`
- **PayrollStreamer**: `0xC3C2c3113898b8FF4eeAedC992E6f34A6f7d9b0C`
- **PriceFeed Oracle**: `0x86bCF0841622a5dAC14A313a15f96A95421b9366`
- **BorrowerOperations**: `0xCdF7028ceAB81fA0C6971208e83fa7872994beE5`
- **MEZO Staking Boost**: `0x92678d0A29a183e194c7496EF9f043b422746EDf`
