import TelegramBot from 'node-telegram-bot-api';
import { isAddress } from 'viem';
import { CONFIG } from './config.js';
import { MezoService } from './services/mezoService.js';

export class BitStreamfiBot {
  private bot: TelegramBot | null = null;
  private mezoService: MezoService;
  private subscribers = new Map<number, Set<string>>(); // chatId -> Set of addresses to watch

  constructor() {
    this.mezoService = new MezoService();

    if (CONFIG.telegramToken && CONFIG.telegramToken !== 'YOUR_TELEGRAM_BOT_TOKEN_FROM_BOTFATHER') {
      this.bot = new TelegramBot(CONFIG.telegramToken, { polling: true });
      this.registerHandlers();
      console.log('🤖 BitStreamfi Telegram Bot initialized with live polling.');
    } else {
      console.log('ℹ️ No Telegram Bot token provided. Running in simulation/CLI mode.');
    }
  }

  private registerHandlers() {
    if (!this.bot) return;

    // /start
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const text = `
⚡ *Welcome to BitStreamfi Bot on Mezo Network!*

I monitor on-chain Bitcoin collateral, continuous MUSD payroll streams, and autonomous Self-Healing Troves.

*Available Commands:*
• /oracle — View live on-chain Mezo BTC/USD pricefeed
• /trove <address> — Check Trove health, collateral, debt & ICR
• /stream <id> — Check real-time payroll stream & claimable salary
• /stake <address> — Check MEZO Staking Tier & fee discounts
• /simulate <drop%> <address> — Stress-test a Trove against a BTC crash
• /watch <address> — Subscribe to health & payday alerts
• /help — Full command manual
      `;
      this.bot?.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    });

    // /help
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      const text = `
📖 *BitStreamfi Telegram Bot Manual*

• \`/oracle\`
  Queries Mezo Testnet \`PriceFeed\` contract (0x86bC...9366).

• \`/trove 0x...\`
  Calculates live Trove ICR, LTV, native BTC / tBTC collateral, and liquidation risk.

• \`/stream <streamId>\`
  Fetches second-by-second salary progress and recipient claimable MUSD from \`PayrollStreamer\`.

• \`/stake 0x...\`
  Shows governance MEZO tokens staked, tier discounts (Bronze/Silver/Gold), and claimable dividends.

• \`/simulate 25 0x...\`
  Simulates a 25% Bitcoin crash to evaluate if the **Closed-Loop Self-Healing Trove** auto-repays debt.

• \`/watch 0x...\`
  Enables 24/7 background alerts for your Trove and streams.
      `;
      this.bot?.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    });

    // /oracle
    this.bot.onText(/\/oracle/, async (msg) => {
      const chatId = msg.chat.id;
      this.bot?.sendChatAction(chatId, 'typing');
      try {
        const price = await this.mezoService.fetchBtcPrice();
        const text = `
💰 *Mezo Network On-Chain PriceFeed*
• *Asset:* Bitcoin (BTC/USD)
• *Live Oracle Price:* *$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })} USD*
• *Network:* Mezo Testnet (Chain ID 31611)
• *Contract:* \`0x86bCF0841622a5dAC14A313a15f96A95421b9366\`
• *Heartbeat:* Active (Dynamic L2 pricing)
        `;
        this.bot?.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      } catch (err: any) {
        this.bot?.sendMessage(chatId, `❌ Error fetching oracle price: ${err.message}`);
      }
    });

    // /trove <address>
    this.bot.onText(/\/trove(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const addr = (match?.[1] || '').trim();

      if (!addr || !isAddress(addr)) {
        this.bot?.sendMessage(
          chatId,
          '⚠️ Please provide a valid Ethereum/Mezo address.\nExample: `/trove 0xeb4a5e30ad0df2c5d8a985d82087405e3fa59fDd`',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      this.bot?.sendChatAction(chatId, 'typing');
      try {
        const info = await this.mezoService.getTroveInfo(addr as `0x${string}`);
        const statusEmoji = info.healthStatus === 'HEALTHY' ? '🟢' : info.healthStatus === 'WARNING' ? '🟡' : '🔴';

        const text = `
🏛️ *BitStreamfi Trove Health Report*
• *Address:* \`${info.address}\`
• *Health Status:* ${statusEmoji} *${info.healthStatus}*

📊 *Collateral & Debt:*
• *Native BTC:* \`${info.nativeCollateral.toFixed(4)} BTC\`
• *tBTC Collateral:* \`${info.tbtcCollateral.toFixed(4)} tBTC\`
• *Total Collateral USD:* *$${info.collateralUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}*
• *Active Debt:* \`${info.borrowedDebtMUSD.toLocaleString()} MUSD\`
• *Unvested Escrow Buffer:* \`${info.unvestedBufferMUSD.toLocaleString()} MUSD\`

🛡️ *Safety Metrics:*
• *Individual Collateral Ratio (ICR):* *${info.icrPercent.toFixed(1)}%*
• *Current LTV:* *${info.ltvPercent.toFixed(1)}%* (Max safe: 60%)
• *Liquidation Risk:* ${info.isLiquidatable ? '🚨 *LIQUIDATABLE*' : '✅ Safe'}
• *Autonomous Self-Heal:* ${info.unvestedBufferMUSD > 0 ? '🛡️ Armed' : '⚪ Inactive'}
        `;
        this.bot?.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      } catch (err: any) {
        this.bot?.sendMessage(chatId, `❌ Failed to query Trove: ${err.message}`);
      }
    });

    // /stream <streamId>
    this.bot.onText(/\/stream(?:\s+(\d+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const streamId = match?.[1] ? parseInt(match[1], 10) : 1;

      this.bot?.sendChatAction(chatId, 'typing');
      try {
        const s = await this.mezoService.getStreamInfo(streamId);
        if (!s) {
          this.bot?.sendMessage(chatId, `⚠️ Stream #${streamId} not found or not initialized yet.`);
          return;
        }

        const barFilled = Math.round(s.progressPercent / 10);
        const progressBar = '▓'.repeat(barFilled) + '░'.repeat(10 - barFilled);

        const text = `
🌊 *BitStreamfi Continuous Payroll Stream #${s.streamId}*

• *Sender:* \`${s.sender.slice(0, 8)}...${s.sender.slice(-6)}\`
• *Recipient:* \`${s.recipient.slice(0, 8)}...${s.recipient.slice(-6)}\`

📈 *Stream Progression:*
[${progressBar}] *${s.progressPercent.toFixed(1)}%*
• *Total Deposit:* \`${s.totalDepositMUSD.toLocaleString()} MUSD\`
• *Vested Claimable:* *${s.vestedClaimableMUSD.toFixed(4)} MUSD*
• *Remaining Balance:* \`${s.remainingBalanceMUSD.toLocaleString()} MUSD\`
• *Streaming Rate:* \`$${s.ratePerSecondMUSD.toFixed(5)}/sec\`

⏱️ *Timing:*
• *Started:* ${s.startTime.toUTCString()}
• *Completes:* ${s.stopTime.toUTCString()}
• *Status:* ${s.isCompleted ? '🏁 Completed' : '⚡ Streaming Active'}
        `;
        this.bot?.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      } catch (err: any) {
        this.bot?.sendMessage(chatId, `❌ Failed to query stream: ${err.message}`);
      }
    });

    // /stake <address>
    this.bot.onText(/\/stake(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const addr = (match?.[1] || '').trim();

      if (!addr || !isAddress(addr)) {
        this.bot?.sendMessage(chatId, '⚠️ Please provide a valid address.\nExample: `/stake 0xeb4a...9fDd`', { parse_mode: 'Markdown' });
        return;
      }

      this.bot?.sendChatAction(chatId, 'typing');
      try {
        const info = await this.mezoService.getStakingInfo(addr as `0x${string}`);
        const text = `
🏆 *BitStreamfi MEZO Staking & Real Yield*
• *Account:* \`${info.address}\`
• *MEZO Staked:* *${info.stakedMezo.toLocaleString()} MEZO*
• *Active Tier:* *${info.tierName}*
• *Borrow Fee Discount:* *${info.borrowFeeDiscountPercent}% OFF*
• *Claimable MUSD Dividends:* *${info.claimableDividendsMUSD.toFixed(4)} MUSD*
        `;
        this.bot?.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      } catch (err: any) {
        this.bot?.sendMessage(chatId, `❌ Failed to query staking: ${err.message}`);
      }
    });

    // /simulate <drop%> <address>
    this.bot.onText(/\/simulate\s+(\d+)(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const dropPercent = parseInt(match?.[1] || '25', 10);
      const addr = (match?.[2] || '0xeb4a5e30ad0df2c5d8a985d82087405e3fa59fDd').trim();

      this.bot?.sendChatAction(chatId, 'typing');
      try {
        const sim = await this.mezoService.simulateMarketShock(addr as `0x${string}`, dropPercent);
        const text = `
🌪️ *Market Shock Stress-Test Simulator (-${dropPercent}%)*
• *Base BTC Price:* $${sim.basePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
• *Simulated Crash Price:* *$${sim.shockedPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD*

📉 *Pre-Intervention Health:*
• *Original ICR:* ${sim.originalIcr.toFixed(1)}%
• *Simulated ICR:* ${sim.shockedIcr.toFixed(1)}%
• *Simulated LTV:* ${sim.shockedLtv.toFixed(1)}%

🛡️ *Self-Healing Engine Evaluation:*
• *Auto-Heal Triggered:* ${sim.autoHealTriggered ? '⚡ *YES (Active Escrow Repayment)*' : '⚪ Not needed'}
• *Recovered Debt:* \`${sim.healedDebt.toLocaleString()} MUSD\`
• *Restored Post-Heal ICR:* *${sim.healedIcr.toFixed(1)}%* (Safe > 150%)
• *Position Liquidation:* ${sim.isLiquidatable && !sim.autoHealTriggered ? '🚨 Liquidatable' : '✅ Protected'}
        `;
        this.bot?.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      } catch (err: any) {
        this.bot?.sendMessage(chatId, `❌ Simulation failed: ${err.message}`);
      }
    });

    // /watch <address>
    this.bot.onText(/\/watch(?:\s+(.+))?/, (msg, match) => {
      const chatId = msg.chat.id;
      const addr = (match?.[1] || '').trim().toLowerCase();

      if (!addr || !isAddress(addr)) {
        this.bot?.sendMessage(chatId, '⚠️ Provide an address to watch: `/watch 0x...`', { parse_mode: 'Markdown' });
        return;
      }

      if (!this.subscribers.has(chatId)) {
        this.subscribers.set(chatId, new Set());
      }
      this.subscribers.get(chatId)!.add(addr);

      this.bot?.sendMessage(
        chatId,
        `🔔 *Subscription Active!*\nYou will receive alerts whenever Trove health changes or salary streams are claimed for:\n\`${addr}\``,
        { parse_mode: 'Markdown' }
      );
    });
  }

  /**
   * Broadcasts an alert message to a specific chat or all subscribers
   */
  async sendAlert(chatId: number | string, message: string) {
    if (this.bot) {
      try {
        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (err) {
        console.error(`Failed to send Telegram message to ${chatId}:`, err);
      }
    } else {
      console.log(`[ALERT BROADCAST to ${chatId}]:\n${message}\n`);
    }
  }

  getSubscribers(): Map<number, Set<string>> {
    return this.subscribers;
  }
}
