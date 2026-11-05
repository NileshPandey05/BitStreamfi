import { formatEther, parseEther, getAddress } from 'viem';
import { publicClient, VAULT_ABI, STREAMER_ABI, PRICEFEED_ABI, STAKING_BOOST_ABI } from '../contracts.js';
import { CONFIG } from '../config.js';

export interface TroveStatus {
  address: string;
  nativeCollateral: number;
  tbtcCollateral: number;
  totalCollateralEth: number;
  borrowedDebtMUSD: number;
  unvestedBufferMUSD: number;
  collateralUSD: number;
  icrPercent: number;
  ltvPercent: number;
  isLiquidatable: boolean;
  healthStatus: 'HEALTHY' | 'WARNING' | 'LIQUIDATABLE';
}

export interface StreamStatus {
  streamId: number;
  sender: string;
  recipient: string;
  totalDepositMUSD: number;
  remainingBalanceMUSD: number;
  vestedClaimableMUSD: number;
  startTime: Date;
  stopTime: Date;
  durationSeconds: number;
  ratePerSecondMUSD: number;
  progressPercent: number;
  isCompleted: boolean;
}

export interface StakingStatus {
  address: string;
  stakedMezo: number;
  tierNumber: number;
  tierName: string;
  borrowFeeDiscountBps: number;
  borrowFeeDiscountPercent: number;
  claimableDividendsMUSD: number;
}

export class MezoService {
  /**
   * Fetches the real on-chain BTC/USD oracle price from Mezo's PriceFeed contract
   */
  async fetchBtcPrice(): Promise<number> {
    try {
      const priceRaw = await publicClient.readContract({
        address: CONFIG.contracts.priceFeed,
        abi: PRICEFEED_ABI,
        functionName: 'fetchPrice',
      });
      const price = Number(formatEther(priceRaw));
      return price > 0 ? price : 77000;
    } catch {
      try {
        const lastPrice = await publicClient.readContract({
          address: CONFIG.contracts.priceFeed,
          abi: PRICEFEED_ABI,
          functionName: 'lastGoodPrice',
        });
        return Number(formatEther(lastPrice)) || 77000;
      } catch {
        return 77000; // fallback if testnet RPC throttles
      }
    }
  }

  /**
   * Retrieves full Trove collateral, debt, ICR, and risk rating for an address
   */
  async getTroveInfo(userAddress: `0x${string}`): Promise<TroveStatus> {
    const validAddress = getAddress(userAddress);
    const btcPrice = await this.fetchBtcPrice();

    let nativeCol = 0;
    let tbtcCol = 0;
    let debt = 0;
    let buffer = 0;

    try {
      const [nativeRaw, tbtcRaw, debtRaw] = await Promise.all([
        publicClient.readContract({
          address: CONFIG.contracts.vault,
          abi: VAULT_ABI,
          functionName: 'nativeCollateralBalances',
          args: [validAddress],
        }),
        publicClient.readContract({
          address: CONFIG.contracts.vault,
          abi: VAULT_ABI,
          functionName: 'tbtcCollateralBalances',
          args: [validAddress],
        }),
        publicClient.readContract({
          address: CONFIG.contracts.vault,
          abi: VAULT_ABI,
          functionName: 'borrowedMUSD',
          args: [validAddress],
        }),
      ]);
      nativeCol = Number(formatEther(nativeRaw));
      tbtcCol = Number(formatEther(tbtcRaw));
      debt = Number(formatEther(debtRaw));
    } catch (e: any) {
      console.warn(`Could not read vault position for ${validAddress}:`, e?.message || e);
    }


    const totalCollateral = nativeCol + tbtcCol;
    const collateralUSD = totalCollateral * btcPrice;
    const ltvPercent = collateralUSD > 0 ? (debt / collateralUSD) * 100 : 0;
    const icrPercent = debt > 0 ? (collateralUSD / debt) * 100 : 999;
    const isLiquidatable = ltvPercent > 75 || icrPercent < 133.33;

    let healthStatus: 'HEALTHY' | 'WARNING' | 'LIQUIDATABLE' = 'HEALTHY';
    if (isLiquidatable) {
      healthStatus = 'LIQUIDATABLE';
    } else if (icrPercent < 150 || ltvPercent > 60) {
      healthStatus = 'WARNING';
    }

    return {
      address: userAddress,
      nativeCollateral: nativeCol,
      tbtcCollateral: tbtcCol,
      totalCollateralEth: totalCollateral,
      borrowedDebtMUSD: debt,
      unvestedBufferMUSD: buffer,
      collateralUSD,
      icrPercent,
      ltvPercent,
      isLiquidatable,
      healthStatus,
    };
  }

  /**
   * Retrieves live payroll stream status, elapsed vesting, and claimable tokens
   */
  async getStreamInfo(streamId: number): Promise<StreamStatus | null> {
    try {
      const s = await publicClient.readContract({
        address: CONFIG.contracts.streamer,
        abi: STREAMER_ABI,
        functionName: 'streams',
        args: [BigInt(streamId)],
      });

      const sender = s[0];
      const recipient = s[1];
      const deposit = Number(formatEther(s[2]));
      const startTimeSec = Number(s[3]);
      const stopTimeSec = Number(s[4]);
      const withdrawn = Number(formatEther(s[5]));
      const isActive = s[6];

      if (sender === '0x0000000000000000000000000000000000000000' || deposit === 0) {
        return null;
      }

      const totalDuration = Math.max(1, stopTimeSec - startTimeSec);
      const ratePerSec = deposit / totalDuration;
      const remaining = Math.max(0, deposit - withdrawn);

      const nowSec = Math.floor(Date.now() / 1000);
      const elapsed = Math.max(0, Math.min(totalDuration, nowSec - startTimeSec));
      const progressPercent = Math.min(100, (elapsed / totalDuration) * 100);

      let claimable = 0;
      try {
        const claimableRaw = await publicClient.readContract({
          address: CONFIG.contracts.streamer,
          abi: STREAMER_ABI,
          functionName: 'balanceOf',
          args: [BigInt(streamId)],
        });
        claimable = Number(formatEther(claimableRaw));
      } catch {
        claimable = Math.max(0, (deposit * (elapsed / totalDuration)) - withdrawn);
      }

      return {
        streamId,
        sender,
        recipient,
        totalDepositMUSD: deposit,
        remainingBalanceMUSD: remaining,
        vestedClaimableMUSD: claimable,
        startTime: new Date(startTimeSec * 1000),
        stopTime: new Date(stopTimeSec * 1000),
        durationSeconds: totalDuration,
        ratePerSecondMUSD: ratePerSec,
        progressPercent,
        isCompleted: !isActive || nowSec >= stopTimeSec,
      };
    } catch {
      return null;
    }
  }

  /**
   * Retrieves MEZO governance staking tier and borrow fee discount
   */
  async getStakingInfo(userAddress: `0x${string}`): Promise<StakingStatus> {
    const validAddress = getAddress(userAddress);
    let staked = 0;
    let tierNum = 0;
    let discountBps = 0;
    let claimableDivs = 0;

    try {
      const [stakedRaw, tierRaw, discountRaw, claimableRaw] = await Promise.all([
        publicClient.readContract({
          address: CONFIG.contracts.stakingBoost,
          abi: STAKING_BOOST_ABI,
          functionName: 'stakedBalance',
          args: [validAddress],
        }),
        publicClient.readContract({
          address: CONFIG.contracts.stakingBoost,
          abi: STAKING_BOOST_ABI,
          functionName: 'getTier',
          args: [validAddress],
        }),
        publicClient.readContract({
          address: CONFIG.contracts.stakingBoost,
          abi: STAKING_BOOST_ABI,
          functionName: 'getFeeDiscountBps',
          args: [validAddress],
        }),
        publicClient.readContract({
          address: CONFIG.contracts.stakingBoost,
          abi: STAKING_BOOST_ABI,
          functionName: 'earned',
          args: [validAddress],
        }),
      ]);
      staked = Number(formatEther(stakedRaw));
      tierNum = Number(tierRaw);
      discountBps = Number(discountRaw);
      claimableDivs = Number(formatEther(claimableRaw));
    } catch {
      // Return defaults if not staked
    }

    const tierNames = ['None', 'Bronze (15% Off)', 'Silver (30% Off)', 'Gold (50% Off)'];

    const tierName = tierNames[tierNum] || 'None';

    return {
      address: userAddress,
      stakedMezo: staked,
      tierNumber: tierNum,
      tierName,
      borrowFeeDiscountBps: discountBps,
      borrowFeeDiscountPercent: discountBps / 100,
      claimableDividendsMUSD: claimableDivs,
    };
  }

  /**
   * Simulates a sudden Bitcoin market drop (-5% to -50%) on an active Trove
   */
  async simulateMarketShock(userAddress: `0x${string}`, btcDropPercent: number) {
    const baseInfo = await this.getTroveInfo(userAddress);
    const btcPrice = await this.fetchBtcPrice();
    const shockedPrice = Math.max(1000, btcPrice * (1 - Math.abs(btcDropPercent) / 100));

    const shockedCollateralUSD = baseInfo.totalCollateralEth * shockedPrice;
    const shockedLtv = shockedCollateralUSD > 0 ? (baseInfo.borrowedDebtMUSD / shockedCollateralUSD) * 100 : 0;
    const shockedIcr = baseInfo.borrowedDebtMUSD > 0 ? (shockedCollateralUSD / baseInfo.borrowedDebtMUSD) * 100 : 999;

    // Auto-heal calculation
    const autoHealTriggered = shockedIcr < 135 && baseInfo.unvestedBufferMUSD > 0;
    let healedDebt = baseInfo.borrowedDebtMUSD;
    let healedIcr = shockedIcr;

    if (autoHealTriggered) {
      // Repay up to unvested buffer to target 160% ICR
      const targetDebt = shockedCollateralUSD / 1.6;
      const debtToRepay = Math.min(baseInfo.unvestedBufferMUSD, Math.max(0, baseInfo.borrowedDebtMUSD - targetDebt));
      healedDebt = baseInfo.borrowedDebtMUSD - debtToRepay;
      healedIcr = healedDebt > 0 ? (shockedCollateralUSD / healedDebt) * 100 : 999;
    }

    const isLiquidatable = shockedLtv > 75 || shockedIcr < 133.33;

    return {
      basePrice: btcPrice,
      shockedPrice,
      dropPercent: btcDropPercent,
      originalIcr: baseInfo.icrPercent,
      shockedIcr,
      shockedLtv,
      isLiquidatable,
      autoHealTriggered,
      healedDebt,
      healedIcr,
    };
  }
}
