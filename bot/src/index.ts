import { BitStreamfiBot } from './bot.js';
import { OnChainMonitor } from './monitor.js';

console.log('====================================================');
console.log('🚀 BitStreamfi Telegram Alert Service (Wave 2 Track 2)');
console.log('====================================================');

const bot = new BitStreamfiBot();
const monitor = new OnChainMonitor(bot);

monitor.start().catch((err) => {
  console.error('Fatal error starting monitor:', err);
});

process.on('SIGINT', () => {
  console.log('Shutting down BitStreamfi bot...');
  monitor.stop();
  process.exit(0);
});
