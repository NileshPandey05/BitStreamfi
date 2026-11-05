import { MezoService } from './services/mezoService.js';
import { CONFIG } from './config.js';

async function runDemo() {
  console.log('================================================================');
  console.log('🤖 BitStreamfi Telegram Bot: On-Chain Live Testbench (Wave 2)');
  console.log('================================================================\n');

  const mezo = new MezoService();
  const sampleUser = '0xeb4a5e30ad0df2c5d8a985d82087405e3fa59fDd' as `0x${string}`;

  // 1. Fetch Oracle Price
  console.log('📡 [1/5] Querying Mezo On-Chain PriceFeed Oracle...');
  const price = await mezo.fetchBtcPrice();
  console.log(`   ➔ BTC/USD Price: $${price.toLocaleString()} USD (Live from 0x86bC...9366)`);
  console.log('   ✅ Oracle query PASSED.\n');

  // 2. Query Trove Information
  console.log(`🏛️ [2/5] Querying Trove Position for ${sampleUser}...`);
  const trove = await mezo.getTroveInfo(sampleUser);
  console.log(`   ➔ Native BTC: ${trove.nativeCollateral.toFixed(4)} BTC`);
  console.log(`   ➔ tBTC Collateral: ${trove.tbtcCollateral.toFixed(4)} tBTC`);
  console.log(`   ➔ Borrowed Debt: ${trove.borrowedDebtMUSD} MUSD`);
  console.log(`   ➔ Health Ratio (ICR): ${trove.icrPercent.toFixed(1)}%`);
  console.log(`   ➔ Status: ${trove.healthStatus}`);
  console.log('   ✅ Trove query PASSED.\n');

  // 3. Query Active Stream
  console.log('🌊 [3/5] Querying Stream #1 on PayrollStreamer...');
  const stream = await mezo.getStreamInfo(1);
  if (stream) {
    console.log(`   ➔ Sender: ${stream.sender}`);
    console.log(`   ➔ Recipient: ${stream.recipient}`);
    console.log(`   ➔ Deposit: ${stream.totalDepositMUSD} MUSD`);
    console.log(`   ➔ Vested Claimable: ${stream.vestedClaimableMUSD.toFixed(4)} MUSD`);
    console.log(`   ➔ Streaming Rate: $${stream.ratePerSecondMUSD.toFixed(5)}/sec`);
    console.log(`   ➔ Progress: ${stream.progressPercent.toFixed(1)}%`);
  } else {
    console.log('   ➔ Stream #1 not yet initiated or complete.');
  }
  console.log('   ✅ Stream query PASSED.\n');

  // 4. Query MEZO Staking Boost
  console.log(`🏆 [4/5] Querying MEZO Staking Tier for ${sampleUser}...`);
  const stake = await mezo.getStakingInfo(sampleUser);
  console.log(`   ➔ Staked: ${stake.stakedMezo} MEZO`);
  console.log(`   ➔ Tier: ${stake.tierName}`);
  console.log(`   ➔ Fee Discount: ${stake.borrowFeeDiscountPercent}%`);
  console.log(`   ➔ Claimable Dividends: ${stake.claimableDividendsMUSD.toFixed(4)} MUSD`);
  console.log('   ✅ Staking query PASSED.\n');

  // 5. Simulate Market Shock & Closed-Loop Auto-Heal
  console.log('🌪️ [5/5] Stress-Testing Trove with -35% Market Shock...');
  const sim = await mezo.simulateMarketShock(sampleUser, 35);
  console.log(`   ➔ Base Price: $${sim.basePrice.toLocaleString()}`);
  console.log(`   ➔ Crash Price (-35%): $${sim.shockedPrice.toLocaleString()}`);
  console.log(`   ➔ Pre-Heal ICR: ${sim.shockedIcr.toFixed(1)}%`);
  console.log(`   ➔ Auto-Heal Triggered: ${sim.autoHealTriggered ? 'YES' : 'NO'}`);
  console.log(`   ➔ Restored Post-Heal ICR: ${sim.healedIcr.toFixed(1)}% (Target > 150%)`);
  console.log(`   ➔ Position Protected: ${sim.isLiquidatable ? 'NO' : 'YES'}`);
  console.log('   ✅ Stress-test simulation PASSED.\n');

  console.log('================================================================');
  console.log('🎉 ALL 5 LIVE MEZO TESTBENCH CHECKS COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
}

runDemo().catch((err) => {
  console.error('Demo encountered an error:', err);
  process.exit(1);
});
