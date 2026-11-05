import { formatEther } from 'viem';
import { publicClient, CONFIG, VAULT_ABI, STREAMER_ABI } from './contracts.js';
import { BitStreamfiBot } from './bot.js';
import { MezoService } from './services/mezoService.js';

export class OnChainMonitor {
  private bot: BitStreamfiBot;
  private mezoService: MezoService;
  private isRunning = false;
  private lastCheckedBlock = 0n;
  private lastReportedPrice = 0;

  constructor(bot: BitStreamfiBot) {
    this.bot = bot;
    this.mezoService = new MezoService();
  }

  async start() {
    this.isRunning = true;
    console.log('📡 Starting BitStreamfi On-Chain Event Monitor on Mezo Testnet...');

    try {
      this.lastCheckedBlock = await publicClient.getBlockNumber();
      this.lastReportedPrice = await this.mezoService.fetchBtcPrice();
      console.log(`Initial Mezo Block: ${this.lastCheckedBlock} | BTC Oracle: $${this.lastReportedPrice}`);
    } catch (e) {
      console.warn('Could not fetch initial block from Mezo RPC, starting from latest.');
    }

    // Polling loop for events and price shifts
    this.poll();
  }

  stop() {
    this.isRunning = false;
  }

  private async poll() {
    if (!this.isRunning) return;

    try {
      await this.checkPriceFluctuations();
      await this.checkVaultEvents();
      await this.checkStreamerEvents();
    } catch (error) {
      console.error('Error during monitor polling cycle:', error);
    }

    setTimeout(() => this.poll(), CONFIG.pollIntervalMs);
  }

  /**
   * Watches for significant Bitcoin price swings and alerts subscribers
   */
  private async checkPriceFluctuations() {
    const currentPrice = await this.mezoService.fetchBtcPrice();
    if (this.lastReportedPrice === 0) {
      this.lastReportedPrice = currentPrice;
      return;
    }

    const priceDeltaPercent = ((currentPrice - this.lastReportedPrice) / this.lastReportedPrice) * 100;

    // Alert if price swings by >= 3%
    if (Math.abs(priceDeltaPercent) >= 3.0) {
      const directionEmoji = priceDeltaPercent > 0 ? '📈' : '📉';
      const alertMsg = `
${directionEmoji} *Mezo Market Alert: Bitcoin Price Shift*
• *New Price:* *$${currentPrice.toLocaleString()} USD*
• *Change:* *${priceDeltaPercent > 0 ? '+' : ''}${priceDeltaPercent.toFixed(2)}%*
• *Impact:* Trove ICRs have been recalculated. Ensure your ICR remains comfortably > 150%.
      `;

      if (CONFIG.defaultChatId) {
        await this.bot.sendAlert(CONFIG.defaultChatId, alertMsg);
      }

      this.lastReportedPrice = currentPrice;
    }
  }

  /**
   * Polls for Vault events: TroveAutoHealed, LoanBorrowed, PositionLiquidated
   */
  private async checkVaultEvents() {
    const currentBlock = await publicClient.getBlockNumber();
    if (currentBlock <= this.lastCheckedBlock) return;

    const fromBlock = this.lastCheckedBlock + 1n;
    const toBlock = currentBlock;

    try {
      // Check AutoHeal events
      const healLogs = await publicClient.getContractEvents({
        address: CONFIG.contracts.vault,
        abi: VAULT_ABI,
        eventName: 'TroveAutoHealed',
        fromBlock,
        toBlock,
      });

      for (const log of healLogs) {
        const employer = log.args.employer;
        const streamId = log.args.streamId ? Number(log.args.streamId) : 1;
        const repaid = Number(formatEther(log.args.musdRepaid || 0n));
        const postIcr = Number(formatEther(log.args.postICR || 0n)) * 100;

        const msg = `
🛡️ *AUTONOMOUS SELF-HEALING ACTIVATED!*
• *Borrower Trove:* \`${employer}\`
• *Stream ID:* #${streamId}
• *Debt Repaid from Escrow:* \`${repaid.toLocaleString()} MUSD\`
• *Restored Health:* *${postIcr > 0 ? postIcr.toFixed(1) : '>160.0'}% ICR*
• *Status:* Liquidation completely averted. Your Bitcoin collateral remains safe.
        `;

        if (CONFIG.defaultChatId) {
          await this.bot.sendAlert(CONFIG.defaultChatId, msg);
        }
      }
    } catch {
      // Ignore filter range limits
    }

    this.lastCheckedBlock = toBlock;
  }

  /**
   * Polls for Streamer events: TokensClaimed (payday alert)
   */
  private async checkStreamerEvents() {
    try {
      const claimLogs = await publicClient.getContractEvents({
        address: CONFIG.contracts.streamer,
        abi: STREAMER_ABI,
        eventName: 'TokensClaimed',
        fromBlock: this.lastCheckedBlock,
        toBlock: 'latest',
      });

      for (const log of claimLogs) {
        const streamId = Number(log.args.streamId || 0n);
        const recipient = log.args.recipient;
        const amount = Number(formatEther(log.args.amount || 0n));

        const msg = `
⚡ *Payday Alert: Continuous Salary Claimed!*
• *Stream ID:* #${streamId}
• *Recipient:* \`${recipient}\`
• *Amount Claimed:* *+${amount.toFixed(4)} MUSD*
• *Network:* Mezo Testnet (Block-by-Block Streaming)
        `;

        if (CONFIG.defaultChatId) {
          await this.bot.sendAlert(CONFIG.defaultChatId, msg);
        }
      }
    } catch {
      // Ignore
    }
  }
}
