'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, usePublicClient, useChainId, useSwitchChain, useBalance } from 'wagmi';
import { CONTRACT_ADDRESSES, MEZO_TESTNET_CHAIN_ID, VAULT_ABI, STREAMER_ABI, CREDIT_ENGINE_ABI, ERC20_ABI, STAKING_BOOST_ABI } from './contracts';
import { parseEther, formatEther, isAddress } from 'viem';
import { TransactionRecord, ActiveAction, ArenaTrove, TabType } from './types';
import { Header } from './components/Header';
import { NavigationTabs } from './components/NavigationTabs';
import { TxBanner } from './components/TxBanner';
import { Footer } from './components/Footer';
import { OverviewTab } from './components/tabs/OverviewTab';
import { VaultTab } from './components/tabs/VaultTab';
import { PayrollTab } from './components/tabs/PayrollTab';
import { StakingTab } from './components/tabs/StakingTab';
import { SimulatorTab } from './components/tabs/SimulatorTab';
import { ActivityTab } from './components/tabs/ActivityTab';
import { WalletModal } from './components/WalletModal';

export default function Home() {
  const { address, isConnected, connector } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletModalInitialMode, setWalletModalInitialMode] = useState<'select' | 'manage'>('select');

  const handleOpenConnectWallet = () => {
    setWalletModalInitialMode('select');
    setIsWalletModalOpen(true);
  };

  const handleOpenManageWallet = () => {
    setWalletModalInitialMode('manage');
    setIsWalletModalOpen(true);
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'vault' | 'payroll' | 'staking' | 'simulator' | 'activity'>('overview');
  const [animationPhase, setAnimationPhase] = useState(0);

  // Task 4: Interactive Risk Simulator & Keeper Arena State
  const [simBtcShockPercent, setSimBtcShockPercent] = useState<number>(0);
  const [simUseCustom, setSimUseCustom] = useState<boolean>(true);
  const [simCustomCollateral, setSimCustomCollateral] = useState<string>('0.05');
  const [simCustomDebt, setSimCustomDebt] = useState<string>('1790');
  const [simCustomEscrowBuffer, setSimCustomEscrowBuffer] = useState<string>('200');
  const [simHealedState, setSimHealedState] = useState<boolean>(false);
  const [simHealToast, setSimHealToast] = useState<string | null>(null);
  const [keeperLiquidatedIds, setKeeperLiquidatedIds] = useState<string[]>([]);
  const [keeperEarningsUSD, setKeeperEarningsUSD] = useState<number>(0);
  const [keeperCount, setKeeperCount] = useState<number>(0);
  const [keeperFilter, setKeeperFilter] = useState<'all' | 'liquidatable' | 'safe'>('all');
  const [simTrovePreset, setSimTrovePreset] = useState<'borrower1' | 'vaultTrove' | 'wallet' | 'custom'>('borrower1');

  // Transaction history log state (persisted to localStorage)
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bitstreamfi_tx_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTransactions(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load transaction history:', e);
    }
  }, []);

  const addTransactionRecord = (record: TransactionRecord) => {
    setTransactions((prev) => {
      const filtered = prev.filter((t) => t.hash.toLowerCase() !== record.hash.toLowerCase());
      const updated = [record, ...filtered].slice(0, 50);
      try {
        localStorage.setItem('bitstreamfi_tx_records', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save transaction history:', e);
      }
      return updated;
    });
  };

  const clearTransactionHistory = () => {
    setTransactions([]);
    try {
      localStorage.removeItem('bitstreamfi_tx_records');
    } catch (e) {
      console.error('Failed to clear transaction history:', e);
    }
  };

  // UI feedback states
  const [txStatus, setTxStatus] = useState<'idle' | 'preparing' | 'wallet_confirm' | 'pending' | 'success' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (txStatus === 'failed' || txStatus === 'success') {
      const timer = setTimeout(() => {
        setTxStatus('idle');
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [txStatus]);

  const cleanErrorMessage = (err: any, fallback: string) => {
    const raw = (err?.shortMessage || err?.message || fallback) as string;
    if (raw.includes('User rejected') || raw.includes('rejected the request') || raw.includes('User denied') || raw.includes('denied transaction')) {
      return 'Transaction was cancelled in wallet.';
    }
    if (raw.includes('TransferFrom failed') || raw.includes('allowance too low') || raw.includes('transfer amount exceeds allowance')) {
      return 'Insufficient token allowance. Please click "Approve" first to allow the contract to move tokens.';
    }
    if (raw.includes('balance too low') || raw.includes('transfer amount exceeds balance')) {
      return 'Insufficient token balance in your wallet.';
    }
    if (raw.includes('Exceeds max LTV')) {
      return 'Borrow exceeds 60% Max LTV limit. Deposit more Bitcoin collateral.';
    }
    if (raw.includes('Position would be undercollateralized')) {
      return 'Withdrawal would cause vault position to be undercollateralized (>60% LTV).';
    }
    if (raw.includes('Position not liquidatable')) {
      return 'Position is safe and healthy — not eligible for liquidation.';
    }
    if (raw.includes('Insufficient yield balance')) {
      return 'Insufficient unamortized yield balance to withdraw or amortize.';
    }
    if (raw.includes('Transfer failed')) {
      return 'Contract has insufficient liquidity for this operation.';
    }
    const clean = raw.split('\n')[0].replace(/URL: https:\/\/.*/, '').replace(/Request Arguments:.*/, '').trim();
    return clean.slice(0, 140) || fallback;
  };

  const [activeAction, setActiveAction] = useState<ActiveAction>('idle');

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Form states
  const [collateralMode, setCollateralMode] = useState<'native' | 'tbtc'>('native');
  const [withdrawMode, setWithdrawMode] = useState<'native' | 'tbtc'>('native');
  const [collateralAmount, setCollateralAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [yieldDepositAmount, setYieldDepositAmount] = useState('');
  const [yieldWithdrawAmount, setYieldWithdrawAmount] = useState('');
  const [amortizeAmount, setAmortizeAmount] = useState('');
  const [liquidateUser, setLiquidateUser] = useState('');
  const [liquidateDebtAmount, setLiquidateDebtAmount] = useState('');
  const [liquidateSeizeNative, setLiquidateSeizeNative] = useState(true);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Wave 2 Task 1 States: Auto-Healing Trove & Stream Splitting
  const [streamIdForAutoHeal, setStreamIdForAutoHeal] = useState('0');
  const [splitPercent, setSplitPercent] = useState('20');
  const [splitTargetBorrower, setSplitTargetBorrower] = useState('');

  // Wave 2 Task 2 States: MEZO Governance Staking
  const [mezoStakeAmount, setMezoStakeAmount] = useState('');
  const [mezoUnstakeAmount, setMezoUnstakeAmount] = useState('');
  const [stakingTab, setStakingTab] = useState<'stake' | 'unstake' | 'rewards'>('stake');

  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(Math.floor(Date.now() / 1000));
    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Payroll form states
  const [recipient, setRecipient] = useState('');
  const [streamDeposit, setStreamDeposit] = useState('');
  const [duration, setDuration] = useState('');
  const [streamIdToManage, setStreamIdToManage] = useState('0');
  const [topUpAmount, setTopUpAmount] = useState('');

  // Wagmi write hooks
  const { writeContractAsync: writeVaultAsync, isPending: vaultPending } = useWriteContract();
  const { writeContractAsync: writeStreamerAsync, isPending: streamerPending } = useWriteContract();
  const { writeContractAsync: writeGenericAsync, isPending: genericPending } = useWriteContract();

  useEffect(() => {
    if (!vaultPending && !streamerPending && !genericPending && txStatus !== 'wallet_confirm' && txStatus !== 'pending') {
      setActiveAction('idle');
    }
  }, [vaultPending, streamerPending, genericPending, txStatus]);

  // Read Vault Data: Collateral separation (High Finding 1 fix)
  const { data: userNativeCollateral, refetch: refetchNativeCollateral } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: VAULT_ABI,
    functionName: 'nativeCollateralBalances',
    args: address ? [address] : undefined,
  });

  const { data: userTbtcCollateral, refetch: refetchTbtcCollateral } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: VAULT_ABI,
    functionName: 'tbtcCollateralBalances',
    args: address ? [address] : undefined,
  });

  const { data: userCollateral, refetch: refetchCollateral } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: VAULT_ABI,
    functionName: 'collateralBalances',
    args: address ? [address] : undefined,
  });

  const { data: userDebt, refetch: refetchDebt } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: VAULT_ABI,
    functionName: 'borrowedMUSD',
    args: address ? [address] : undefined,
  });

  // Dynamic Price Feed from Mezo PriceFeed Oracle (no hardcoded $60,000!)
  const { data: rawBtcPrice, refetch: refetchBtcPrice } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: VAULT_ABI,
    functionName: 'getBTCPrice',
  });
  const btcPriceUSD = rawBtcPrice ? Number(formatEther(rawBtcPrice as bigint)) : 78055;

  // Health Factor & Liquidation (High Finding 3 fix)
  const { data: rawHealthFactor, refetch: refetchHealthFactor } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: VAULT_ABI,
    functionName: 'getHealthFactor',
    args: address ? [address] : undefined,
  });
  const { data: isUserLiquidatable, refetch: refetchIsLiquidatable } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: VAULT_ABI,
    functionName: 'isLiquidatable',
    args: address ? [address] : undefined,
  });

  // Mezo Protocol BorrowerOperations Trove Composition
  const { data: mezoTroveData, refetch: refetchMezoTrove } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: VAULT_ABI,
    functionName: 'getMezoTroveInfo',
  });
  const troveStatus = mezoTroveData ? Number((mezoTroveData as any)[0]) : 1;
  const troveDebtNum = mezoTroveData ? Number(formatEther((mezoTroveData as any)[1])) : 2001.8;
  const troveCollNum = mezoTroveData ? Number(formatEther((mezoTroveData as any)[2])) : 0.05;
  const troveIcrNum = mezoTroveData ? Number(formatEther((mezoTroveData as any)[3])) * 100 : 194.9;

  // Token Balances
  const { data: tbtcBalance, refetch: refetchTbtc } = useReadContract({
    address: CONTRACT_ADDRESSES.tbtc,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: musdBalance, refetch: refetchMusd } = useReadContract({
    address: CONTRACT_ADDRESSES.musd,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: yieldBalance, refetch: refetchYield } = useReadContract({
    address: CONTRACT_ADDRESSES.creditEngine,
    abi: CREDIT_ENGINE_ABI,
    functionName: 'stakingYieldBalances',
    args: address ? [address] : undefined,
  });

  // Derived Position Metrics powered by Dynamic PriceFeed
  const nativeCollateralEth = userNativeCollateral ? Number(formatEther(userNativeCollateral as bigint)) : 0;
  const tbtcCollateralEth = userTbtcCollateral ? Number(formatEther(userTbtcCollateral as bigint)) : 0;
  const collateralEth = userCollateral ? Number(formatEther(userCollateral as bigint)) : nativeCollateralEth + tbtcCollateralEth;
  const debtEth = userDebt ? Number(formatEther(userDebt as bigint)) : 0;
  const collateralValueUSD = collateralEth * btcPriceUSD;
  const maxBorrowUSD = collateralValueUSD * 0.6;
  const availableBorrowUSD = Math.max(0, maxBorrowUSD - debtEth);
  const ltvNumeric = collateralValueUSD > 0 ? (debtEth / collateralValueUSD) * 100 : 0;
  const minCollateralRequiredUSD = debtEth / 0.6;
  const minCollateralRequiredEth = debtEth > 0 ? minCollateralRequiredUSD / btcPriceUSD : 0;
  const maxWithdrawableEth = Math.max(0, collateralEth - minCollateralRequiredEth);
  const ltvStatusColor = ltvNumeric > 55 ? 'text-[#C7473A]' : ltvNumeric > 45 ? 'text-[#B7791F]' : 'text-[#258454]';

  // Read Stream Data
  const { data: streamData, refetch: refetchStream } = useReadContract({
    address: CONTRACT_ADDRESSES.streamer,
    abi: STREAMER_ABI,
    functionName: 'streams',
    args: [BigInt(streamIdToManage || '0')],
  });

  const { data: rawNextStreamId, refetch: refetchNextStreamId } = useReadContract({
    address: CONTRACT_ADDRESSES.streamer,
    abi: STREAMER_ABI,
    functionName: 'nextStreamId',
  });
  const totalStreamsCount = rawNextStreamId ? Number(rawNextStreamId) : 0;

  const { data: claimableStreamAmount, refetch: refetchClaimable } = useReadContract({
    address: CONTRACT_ADDRESSES.streamer,
    abi: STREAMER_ABI,
    functionName: 'balanceOf',
    args: [BigInt(streamIdToManage || '0')],
  });
  const claimableEth = claimableStreamAmount ? Number(formatEther(claimableStreamAmount as bigint)) : 0;

  const formatAddress = (addr?: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const streamEmployer = (streamData as any)?.[0] as string | undefined;
  const streamRecipient = (streamData as any)?.[1] as string | undefined;
  const streamDepositAmount = (streamData as any)?.[2] ? Number(formatEther((streamData as any)[2])) : 0;
  const streamStartTime = (streamData as any)?.[3] ? Number((streamData as any)[3]) : 0;
  const streamStopTime = (streamData as any)?.[4] ? Number((streamData as any)[4]) : 0;
  const streamWithdrawn = (streamData as any)?.[5] ? Number(formatEther((streamData as any)[5])) : 0;
  const streamIsActive = Boolean((streamData as any)?.[6]);
  const streamExists = Boolean(streamEmployer && streamEmployer !== '0x0000000000000000000000000000000000000000');

  const isCurrentUserEmployer = Boolean(address && streamEmployer && address.toLowerCase() === streamEmployer.toLowerCase());
  const isCurrentUserRecipient = Boolean(address && streamRecipient && address.toLowerCase() === streamRecipient.toLowerCase());

  const streamDuration = streamStopTime > streamStartTime ? streamStopTime - streamStartTime : 1;
  const streamNow = currentTime ?? streamStartTime;
  const streamElapsed = Math.min(streamDuration, Math.max(0, streamNow - streamStartTime));
  const streamProgressPercent = streamExists && streamDuration > 0 && currentTime !== null ? Math.min(100, Math.round((streamElapsed / streamDuration) * 100)) : 0;

  // Wave 2: Auto-Heal Trove Reads
  const { data: autoHealEligibilityData, refetch: refetchAutoHealEligibility } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: VAULT_ABI,
    functionName: 'isAutoHealEligible',
    args: address ? [address] : undefined,
  });
  const isAutoHealEligible = autoHealEligibilityData ? Boolean((autoHealEligibilityData as any)[0]) : false;
  const autoHealCurrentICR = autoHealEligibilityData && (autoHealEligibilityData as any)[1] ? Number(formatEther((autoHealEligibilityData as any)[1])) * 100 : 0;

  const { data: rawDebtToRestore, refetch: refetchDebtToRestore } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: VAULT_ABI,
    functionName: 'calculateDebtToRestoreICR',
    args: address ? [address, parseEther('1.6')] : undefined, // 160% target ICR
  });
  const debtToRestoreEth = rawDebtToRestore ? Number(formatEther(rawDebtToRestore as bigint)) : 0;

  const { data: rawUnvestedBuffer, refetch: refetchUnvestedBuffer } = useReadContract({
    address: CONTRACT_ADDRESSES.streamer,
    abi: STREAMER_ABI,
    functionName: 'getUnvestedBuffer',
    args: [BigInt(streamIdForAutoHeal || '0')],
  });
  const unvestedBufferEth = rawUnvestedBuffer ? Number(formatEther(rawUnvestedBuffer as bigint)) : 0;

  // Wave 2: Stream-to-Debt Amortization Split Reads
  const { data: streamSplitData, refetch: refetchStreamSplit } = useReadContract({
    address: CONTRACT_ADDRESSES.streamer,
    abi: STREAMER_ABI,
    functionName: 'streamSplits',
    args: [BigInt(streamIdToManage || '0')],
  });
  const currentSplitBps = streamSplitData ? Number((streamSplitData as any)[0]) : 0;
  const currentSplitTarget = streamSplitData ? ((streamSplitData as any)[1] as string) : '';
  const isSplitEnabled = streamSplitData ? Boolean((streamSplitData as any)[2]) : false;

  const isWrongNetwork = mounted && isConnected && chainId !== MEZO_TESTNET_CHAIN_ID;
  const isReady = mounted && isConnected && !isWrongNetwork;

  // Native Mezo L2 Gas Balance
  const { data: nativeBalance, refetch: refetchNativeBalance } = useBalance({
    address: address,
  });

  // Read Allowances
  const { data: musdAllowanceStreamer, refetch: refetchStreamerAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.musd,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESSES.streamer] : undefined,
  });

  const { data: musdAllowanceVault, refetch: refetchVaultAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.musd,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESSES.vault] : undefined,
  });

  const { data: musdAllowanceCreditEngine, refetch: refetchCreditEngineAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.musd,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESSES.creditEngine] : undefined,
  });

  const { data: tbtcAllowanceVault, refetch: refetchTbtcVaultAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.tbtc,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESSES.vault] : undefined,
  });

  // MEZO Token Balance & Staking Allowance
  const { data: mezoBalance, refetch: refetchMezoBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.mezo,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: mezoAllowanceStaking, refetch: refetchMezoAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.mezo,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESSES.stakingBoost] : undefined,
  });

  const mezoBalanceEth = mezoBalance ? Number(formatEther(mezoBalance as bigint)) : 0;
  const mezoAllowanceEth = mezoAllowanceStaking ? Number(formatEther(mezoAllowanceStaking as bigint)) : 0;
  const isMezoApproved = mezoAllowanceEth >= (Number(mezoStakeAmount) || 1);

  // Wave 2 Task 2: MEZO Staking Boost Reads
  const { data: rawStakedBalance, refetch: refetchStakedBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.stakingBoost,
    abi: STAKING_BOOST_ABI,
    functionName: 'stakedBalance',
    args: address ? [address] : undefined,
  });
  const userStakedMezo = rawStakedBalance ? Number(formatEther(rawStakedBalance as bigint)) : 0;

  const { data: rawTier, refetch: refetchTier } = useReadContract({
    address: CONTRACT_ADDRESSES.stakingBoost,
    abi: STAKING_BOOST_ABI,
    functionName: 'getTier',
    args: address ? [address] : undefined,
  });
  const userTierNum = rawTier !== undefined ? Number(rawTier) : 0;
  const tierNames = ['Standard', 'Bronze', 'Silver', 'Gold'] as const;
  const currentTierName = tierNames[userTierNum] || 'Standard';

  const { data: rawFeeDiscount, refetch: refetchFeeDiscount } = useReadContract({
    address: CONTRACT_ADDRESSES.stakingBoost,
    abi: STAKING_BOOST_ABI,
    functionName: 'getFeeDiscountBps',
    args: address ? [address] : undefined,
  });
  const feeDiscountPercent = rawFeeDiscount ? Number(rawFeeDiscount) / 100 : 0;

  const { data: rawKeeperBoost, refetch: refetchKeeperBoost } = useReadContract({
    address: CONTRACT_ADDRESSES.stakingBoost,
    abi: STAKING_BOOST_ABI,
    functionName: 'getKeeperBonusBoostBps',
    args: address ? [address] : undefined,
  });
  const keeperBoostPercent = rawKeeperBoost ? Number(rawKeeperBoost) / 100 : 0;

  const { data: rawTotalStaked, refetch: refetchTotalStaked } = useReadContract({
    address: CONTRACT_ADDRESSES.stakingBoost,
    abi: STAKING_BOOST_ABI,
    functionName: 'totalStaked',
  });
  const totalStakedMezo = rawTotalStaked ? Number(formatEther(rawTotalStaked as bigint)) : 0;

  const { data: rawEarnedRewards, refetch: refetchEarnedRewards } = useReadContract({
    address: CONTRACT_ADDRESSES.stakingBoost,
    abi: STAKING_BOOST_ABI,
    functionName: 'earned',
    args: address ? [address] : undefined,
  });
  const earnedRewardsEth = rawEarnedRewards ? Number(formatEther(rawEarnedRewards as bigint)) : 0;

  const { data: rawUnbonding, refetch: refetchUnbonding } = useReadContract({
    address: CONTRACT_ADDRESSES.stakingBoost,
    abi: STAKING_BOOST_ABI,
    functionName: 'unbondingRequests',
    args: address ? [address] : undefined,
  });
  const unbondingAmountEth = rawUnbonding ? Number(formatEther((rawUnbonding as any)[0])) : 0;
  const unbondingReleaseTime = rawUnbonding ? Number((rawUnbonding as any)[1]) : 0;
  const isUnbondingReady = unbondingAmountEth > 0 && currentTime !== null && currentTime >= unbondingReleaseTime;

  const streamerAllowanceEth = musdAllowanceStreamer ? Number(formatEther(musdAllowanceStreamer as bigint)) : 0;
  const vaultAllowanceEth = musdAllowanceVault ? Number(formatEther(musdAllowanceVault as bigint)) : 0;
  const creditEngineAllowanceEth = musdAllowanceCreditEngine ? Number(formatEther(musdAllowanceCreditEngine as bigint)) : 0;
  const tbtcAllowanceEth = tbtcAllowanceVault ? Number(formatEther(tbtcAllowanceVault as bigint)) : 0;

  const isStreamerApproved = streamerAllowanceEth >= (Number(streamDeposit) || 1);
  const isVaultApproved = vaultAllowanceEth >= (Number(repayAmount) || 1);
  const isCreditEngineApproved = creditEngineAllowanceEth >= (Number(yieldDepositAmount) || 1);
  const isTbtcApproved = tbtcAllowanceEth >= (Number(collateralAmount) || 1);

  // Simulator Preset Switcher (Real Mezo Testnet Positions)
  const applySimPreset = (preset: 'borrower1' | 'vaultTrove' | 'wallet' | 'custom') => {
    setSimTrovePreset(preset);
    setSimHealedState(false);
    setSimHealToast(null);
    if (preset === 'borrower1') {
      setSimUseCustom(true);
      setSimCustomCollateral('0.05');
      setSimCustomDebt('1790');
      setSimCustomEscrowBuffer('200');
    } else if (preset === 'vaultTrove') {
      setSimUseCustom(true);
      setSimCustomCollateral('0.05');
      setSimCustomDebt('1800');
      setSimCustomEscrowBuffer('0');
    } else if (preset === 'wallet') {
      setSimUseCustom(false);
    } else if (preset === 'custom') {
      setSimUseCustom(true);
      setSimCustomCollateral('0.10');
      setSimCustomDebt('3500');
      setSimCustomEscrowBuffer('500');
    }
  };

  const baseBtcPrice = btcPriceUSD > 0 ? btcPriceUSD : 76500;
  const simBtcPrice = Math.max(1000, baseBtcPrice * (1 + simBtcShockPercent / 100));

  const activeSimCollateral = !simUseCustom && collateralEth > 0 
    ? collateralEth 
    : (Number(simCustomCollateral) || 0.05);

  const initialSimDebt = !simUseCustom && debtEth > 0 
    ? debtEth 
    : (Number(simCustomDebt) || 1790);

  const activeSimEscrow = !simUseCustom && unvestedBufferEth > 0 
    ? unvestedBufferEth 
    : (Number(simCustomEscrowBuffer) || 200);

  const targetHealIcr = 1.6; // 160% Recovery Target ICR
  const simCollateralUSD = activeSimCollateral * simBtcPrice;
  const debtDeficitForTarget = Math.max(0, initialSimDebt - (simCollateralUSD / targetHealIcr));
  const actualHealAmount = Math.min(debtDeficitForTarget, activeSimEscrow);

  const activeSimDebt = simHealedState ? Math.max(0, initialSimDebt - actualHealAmount) : initialSimDebt;
  const simLtv = simCollateralUSD > 0 ? (activeSimDebt / simCollateralUSD) * 100 : 0;
  const simIcr = activeSimDebt > 0 ? (simCollateralUSD / activeSimDebt) * 100 : 999;

  const simZone: 'safe' | 'warning' | 'liquidatable' = simIcr >= 150 ? 'safe' : simIcr >= 135 ? 'warning' : 'liquidatable';

  // Effective Keeper Bonus %: 5.0% Standard + Staker Boost (up to 7.5% for Gold)
  const effectiveKeeperBonusPercent = 5.0 + keeperBoostPercent;

  const handleSimulateAutoHeal = () => {
    if (simZone === 'safe') return;
    setSimHealedState(true);
    setSimHealToast(
      `✨ Auto-Heal Triggered: Repaid ${actualHealAmount.toFixed(2)} MUSD from unvested escrow buffer. Trove ICR restored to 160.0% without touching worker salary!`
    );
    setTimeout(() => {
      setSimHealToast(null);
    }, 7000);
  };

  const handleResetSim = () => {
    setSimBtcShockPercent(0);
    setSimHealedState(false);
    setSimHealToast(null);
  };

  const arenaTroves: ArenaTrove[] = [
    {
      id: 'trove-borrower-1',
      name: 'Mezo Testnet Borrower #1',
      borrower: '0xeb4aFbA3ad5ac4a55aDca21818cFF8FCB8f89fDd',
      collateralBtc: 0.05,
      debtMusd: 1790,
      escrowBuffer: 200,
      isNative: false,
    },
    {
      id: 'trove-mezo-protocol',
      name: 'MezoFlow Composed Trove',
      borrower: '0x669dBAd6F813CDeCa14e1A46AB91c95017603f85',
      collateralBtc: 0.05,
      debtMusd: 1800,
      escrowBuffer: 0,
      isNative: true,
    },
    ...(isConnected && debtEth > 0 ? [{
      id: 'trove-wallet',
      name: 'Connected Wallet Position',
      borrower: address as string,
      collateralBtc: collateralEth,
      debtMusd: debtEth,
      escrowBuffer: unvestedBufferEth,
      isNative: nativeCollateralEth > 0,
    }] : []),
  ];

  const handleExecuteKeeperLiquidation = async (trove: ArenaTrove) => {
    if (!address) {
      setStatusMessage('Please connect your wallet to execute keeper liquidations on Mezo Testnet.');
      setTxStatus('failed');
      return;
    }
    if (keeperLiquidatedIds.includes(trove.id)) return;

    await executeTx({
      actionType: 'liquidate',
      title: `Keeper Liquidation on ${formatAddress(trove.borrower)}`,
      amountDisplay: `${trove.debtMusd.toFixed(2)} MUSD`,
      writeCall: () =>
        writeVaultAsync({
          address: CONTRACT_ADDRESSES.vault,
          abi: VAULT_ABI,
          functionName: 'liquidate',
          args: [
            trove.borrower as `0x${string}`,
            parseEther(trove.debtMusd.toString()),
            trove.isNative,
          ],
        }),
      onReceipt: () => {
        setKeeperLiquidatedIds((prev) => [...prev, trove.id]);
        const profitUsd = trove.debtMusd * (effectiveKeeperBonusPercent / 100);
        setKeeperEarningsUSD((prev) => prev + profitUsd);
        setKeeperCount((prev) => prev + 1);
        refetchDebt();
        refetchCollateral();
        refetchTbtc();
        refetchMusd();
        return `Successfully liquidated trove for ${trove.borrower.slice(0, 8)}... Claimed +${profitUsd.toFixed(2)} MUSD keeper bounty!`;
      },
    });
  };

  // Central Tx Runner with On-Chain Block Confirmation
  const executeTx = async ({
    actionType,
    title,
    amountDisplay,
    writeCall,
    onConfirmed,
    onReceipt,
  }: {
    actionType: ActiveAction;
    title: string;
    amountDisplay: string;
    writeCall: () => Promise<`0x${string}`>;
    onConfirmed?: () => void;
    onReceipt?: (receipt: any) => string | void;
  }) => {
    if (!publicClient) {
      setTxStatus('failed');
      setStatusMessage('Ethereum client not connected');
      return;
    }
    setActiveAction(actionType);
    setTxStatus('wallet_confirm');
    setStatusMessage(`Requesting signature in wallet for ${title}...`);

    try {
      const hash = await writeCall();
      const safeHash = hash as `0x${string}`;
      setTxStatus('pending');
      setStatusMessage(`Transaction submitted (${safeHash.slice(0, 10)}...). Waiting for Mezo L2 block confirmation...`);

      addTransactionRecord({
        hash: safeHash,
        type: title,
        amount: amountDisplay,
        status: 'pending',
        timestamp: new Date().toLocaleTimeString(),
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: safeHash,
        confirmations: 1,
      });

      if (receipt.status === 'success') {
        setTxStatus('success');
        let successNote = `${title} confirmed on Mezo L2!`;
        if (onReceipt) {
          const customNote = onReceipt(receipt);
          if (customNote) successNote = customNote;
        }
        setStatusMessage(successNote);
        addTransactionRecord({
          hash: safeHash,
          type: title,
          amount: amountDisplay,
          status: 'success',
          timestamp: new Date().toLocaleTimeString(),
        });
        if (onConfirmed) onConfirmed();
      } else {
        setTxStatus('failed');
        setStatusMessage(`${title} reverted on chain.`);
        addTransactionRecord({
          hash: safeHash,
          type: title,
          amount: amountDisplay,
          status: 'failed',
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: any) {
      console.error(err);
      setTxStatus('failed');
      setStatusMessage(cleanErrorMessage(err, `${title} failed`));
    } finally {
      setActiveAction('idle');
    }
  };

  // ERC-20 Approval Handler
  const handleApprove = (
    token: 'tbtc' | 'musd' | 'mezo',
    spender: 'vault' | 'streamer' | 'creditEngine' | 'stakingBoost',
    amountStr: string
  ) => {
    if (isWrongNetwork) return;
    const actionKey: ActiveAction =
      token === 'mezo'
        ? 'approve_mezo'
        : token === 'tbtc'
        ? 'approve_tbtc_vault'
        : spender === 'vault'
        ? 'approve_repay'
        : spender === 'creditEngine'
        ? 'approve_yield'
        : 'approve_stream';

    const tokenAddress =
      token === 'mezo'
        ? CONTRACT_ADDRESSES.mezo
        : token === 'tbtc'
        ? CONTRACT_ADDRESSES.tbtc
        : CONTRACT_ADDRESSES.musd;
    const spenderAddress = CONTRACT_ADDRESSES[spender];
    const spenderName =
      spender === 'stakingBoost'
        ? 'Staking Boost'
        : spender === 'vault'
        ? 'Vault'
        : spender === 'streamer'
        ? 'Streamer'
        : 'Credit Engine';
    const tokenSymbol = token === 'mezo' ? 'MEZO' : token === 'tbtc' ? 'tBTC' : 'MUSD';
    const approveAmount = amountStr && Number(amountStr) > 1000 ? parseEther(amountStr) : parseEther('1000000');

    executeTx({
      actionType: actionKey,
      title: `Approve ${tokenSymbol}`,
      amountDisplay: `${tokenSymbol} for ${spenderName}`,
      writeCall: () =>
        writeGenericAsync({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [spenderAddress, approveAmount],
        }),
      onConfirmed: () => {
        refetchStreamerAllowance();
        refetchVaultAllowance();
        refetchCreditEngineAllowance();
        refetchTbtcVaultAllowance();
        refetchMezoAllowance();
      },
    });
  };

  // Faucet: Claim 1,000 tBTC test tokens
  const handleClaimFaucet = () => {
    if (isWrongNetwork) return;
    executeTx({
      actionType: 'faucet_tbtc',
      title: 'Claim Test tBTC',
      amountDisplay: '1,000 tBTC (Faucet)',
      writeCall: () =>
        writeGenericAsync({
          address: CONTRACT_ADDRESSES.tbtc,
          abi: ERC20_ABI,
          functionName: 'faucet',
        }),
      onConfirmed: () => {
        refetchTbtc();
      },
    });
  };

  // Vault Actions: Separated Native vs tBTC (High Finding 1 fix)
  const handleDepositCollateral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collateralAmount || isWrongNetwork) return;
    const amountNum = Number(collateralAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTxStatus('failed');
      setStatusMessage('Please enter a valid deposit amount > 0');
      return;
    }

    if (collateralMode === 'native') {
      executeTx({
        actionType: 'deposit_collateral',
        title: 'Deposit Native BTC',
        amountDisplay: `${collateralAmount} BTC (Native)`,
        writeCall: () =>
          writeVaultAsync({
            address: CONTRACT_ADDRESSES.vault,
            abi: VAULT_ABI,
            functionName: 'depositNativeCollateral',
            value: parseEther(collateralAmount),
          }),
        onConfirmed: () => {
          refetchCollateral();
          refetchNativeCollateral();
          refetchNativeBalance();
        },
      });
    } else {
      executeTx({
        actionType: 'deposit_collateral',
        title: 'Deposit tBTC',
        amountDisplay: `${collateralAmount} tBTC (ERC-20)`,
        writeCall: () =>
          writeVaultAsync({
            address: CONTRACT_ADDRESSES.vault,
            abi: VAULT_ABI,
            functionName: 'depositCollateral',
            args: [parseEther(collateralAmount)],
          }),
        onConfirmed: () => {
          refetchCollateral();
          refetchTbtcCollateral();
          refetchTbtc();
        },
      });
    }
  };

  const handleWithdrawCollateral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || isWrongNetwork) return;
    const amountNum = Number(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTxStatus('failed');
      setStatusMessage('Please enter a valid withdrawal amount > 0');
      return;
    }
    const isNative = withdrawMode === 'native';
    const specificBal = isNative ? nativeCollateralEth : tbtcCollateralEth;
    if (amountNum > specificBal) {
      setTxStatus('failed');
      setStatusMessage(`Insufficient ${isNative ? 'Native BTC' : 'tBTC'} collateral (${specificBal.toFixed(4)} available).`);
      return;
    }
    if (amountNum > maxWithdrawableEth) {
      setTxStatus('failed');
      setStatusMessage(`Position would be undercollateralized. Max safe withdrawal is ${maxWithdrawableEth.toFixed(4)} BTC.`);
      return;
    }
    executeTx({
      actionType: 'withdraw_collateral',
      title: `Withdraw ${isNative ? 'Native BTC' : 'tBTC'}`,
      amountDisplay: `${withdrawAmount} ${isNative ? 'BTC' : 'tBTC'}`,
      writeCall: () =>
        writeVaultAsync({
          address: CONTRACT_ADDRESSES.vault,
          abi: VAULT_ABI,
          functionName: 'withdrawCollateral',
          args: [parseEther(withdrawAmount), isNative],
        }),
      onConfirmed: () => {
        refetchCollateral();
        refetchNativeCollateral();
        refetchTbtcCollateral();
        refetchNativeBalance();
        refetchTbtc();
      },
    });
  };

  const handleBorrowMUSD = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowAmount || isWrongNetwork) return;
    const amountNum = Number(borrowAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTxStatus('failed');
      setStatusMessage('Please enter a valid borrow amount > 0');
      return;
    }
    if (collateralEth <= 0) {
      setTxStatus('failed');
      setStatusMessage('No collateral deposited. Deposit Bitcoin collateral first to borrow MUSD.');
      return;
    }
    if (amountNum > availableBorrowUSD) {
      setTxStatus('failed');
      setStatusMessage(`Borrow exceeds max 60% LTV ($${availableBorrowUSD.toFixed(2)} MUSD available).`);
      return;
    }
    executeTx({
      actionType: 'borrow_musd',
      title: 'Borrow MUSD',
      amountDisplay: `${borrowAmount} MUSD`,
      writeCall: () =>
        writeVaultAsync({
          address: CONTRACT_ADDRESSES.vault,
          abi: VAULT_ABI,
          functionName: 'borrowMUSD',
          args: [parseEther(borrowAmount)],
        }),
      onConfirmed: () => {
        refetchDebt();
        refetchMusd();
      },
    });
  };

  const handleRepayMUSD = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayAmount || isWrongNetwork) return;
    const amountNum = Number(repayAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTxStatus('failed');
      setStatusMessage('Please enter a valid repay amount > 0');
      return;
    }
    const musdBalNum = musdBalance ? Number(formatEther(musdBalance as bigint)) : 0;
    if (amountNum > musdBalNum) {
      setTxStatus('failed');
      setStatusMessage(`Insufficient MUSD balance (${musdBalNum.toLocaleString()} available).`);
      return;
    }
    if (amountNum > debtEth) {
      setTxStatus('failed');
      setStatusMessage(`Repay amount exceeds total outstanding debt (${debtEth.toLocaleString()} MUSD).`);
      return;
    }
    executeTx({
      actionType: 'repay_musd',
      title: 'Repay MUSD',
      amountDisplay: `${repayAmount} MUSD`,
      writeCall: () =>
        writeVaultAsync({
          address: CONTRACT_ADDRESSES.vault,
          abi: VAULT_ABI,
          functionName: 'repayMUSD',
          args: [parseEther(repayAmount)],
        }),
      onConfirmed: () => {
        refetchDebt();
        refetchMusd();
      },
    });
  };

  // Liquidation Handler (High Finding 3 fix)
  const handleLiquidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liquidateUser || !liquidateDebtAmount || isWrongNetwork) return;
    if (!isAddress(liquidateUser)) {
      setTxStatus('failed');
      setStatusMessage('Invalid borrower address format.');
      return;
    }
    executeTx({
      actionType: 'liquidate',
      title: 'Liquidate Position',
      amountDisplay: `${liquidateDebtAmount} MUSD for ${formatAddress(liquidateUser)}`,
      writeCall: () =>
        writeVaultAsync({
          address: CONTRACT_ADDRESSES.vault,
          abi: VAULT_ABI,
          functionName: 'liquidate',
          args: [liquidateUser as `0x${string}`, parseEther(liquidateDebtAmount), liquidateSeizeNative],
        }),
      onConfirmed: () => {
        refetchDebt();
        refetchCollateral();
        refetchMusd();
      },
    });
  };

  // Wave 2 Task 1: Auto-Heal Trove Handler
  const handleAutoHealTrove = (e: React.FormEvent) => {
    e.preventDefault();
    if (isWrongNetwork || !address) return;
    executeTx({
      actionType: 'auto_heal_trove',
      title: 'Auto-Heal Trove',
      amountDisplay: `Stream #${streamIdForAutoHeal} Unvested Buffer`,
      writeCall: () =>
        writeVaultAsync({
          address: CONTRACT_ADDRESSES.vault,
          abi: VAULT_ABI,
          functionName: 'autoHealTrove',
          args: [address, BigInt(streamIdForAutoHeal || '0')],
        }),
      onConfirmed: () => {
        refetchDebt();
        refetchCollateral();
        refetchHealthFactor();
        refetchIsLiquidatable();
        refetchAutoHealEligibility();
        refetchDebtToRestore();
        refetchUnvestedBuffer();
        refetchStream();
        refetchClaimable();
        refetchMusd();
      },
    });
  };

  // Wave 2 Task 1: Stream Splitter Configuration Handler
  const handleSetStreamSplit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isWrongNetwork || !address) return;
    const bps = Math.round(Number(splitPercent) * 100);
    const target = isAddress(splitTargetBorrower) ? (splitTargetBorrower as `0x${string}`) : address;
    executeTx({
      actionType: 'set_stream_split',
      title: 'Configure Stream Split',
      amountDisplay: `${splitPercent}% to ${formatAddress(target)}`,
      writeCall: () =>
        writeStreamerAsync({
          address: CONTRACT_ADDRESSES.streamer,
          abi: STREAMER_ABI,
          functionName: 'setStreamSplit',
          args: [BigInt(streamIdToManage || '0'), BigInt(bps), target],
        }),
      onConfirmed: () => {
        refetchStreamSplit();
      },
    });
  };

  // Wave 2 Task 2: MEZO Staking Handlers
  const handleStakeMEZO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mezoStakeAmount || isWrongNetwork || !address) return;
    executeTx({
      actionType: 'stake_mezo',
      title: 'Stake MEZO Tokens',
      amountDisplay: `${mezoStakeAmount} MEZO`,
      writeCall: () =>
        writeGenericAsync({
          address: CONTRACT_ADDRESSES.stakingBoost,
          abi: STAKING_BOOST_ABI,
          functionName: 'stake',
          args: [parseEther(mezoStakeAmount)],
        }),
      onConfirmed: () => {
        refetchStakedBalance();
        refetchTier();
        refetchFeeDiscount();
        refetchKeeperBoost();
        refetchTotalStaked();
        refetchMezoBalance();
        refetchMezoAllowance();
      },
    });
  };

  const handleInitiateUnstake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mezoUnstakeAmount || isWrongNetwork || !address) return;
    executeTx({
      actionType: 'initiate_unstake',
      title: 'Initiate Unstake',
      amountDisplay: `${mezoUnstakeAmount} MEZO (2-day cooldown)`,
      writeCall: () =>
        writeGenericAsync({
          address: CONTRACT_ADDRESSES.stakingBoost,
          abi: STAKING_BOOST_ABI,
          functionName: 'initiateUnstake',
          args: [parseEther(mezoUnstakeAmount)],
        }),
      onConfirmed: () => {
        refetchStakedBalance();
        refetchTier();
        refetchFeeDiscount();
        refetchKeeperBoost();
        refetchTotalStaked();
        refetchUnbonding();
      },
    });
  };

  const handleClaimUnstaked = () => {
    if (isWrongNetwork || !address || !isUnbondingReady) return;
    executeTx({
      actionType: 'claim_unstaked',
      title: 'Claim Unstaked MEZO',
      amountDisplay: `${unbondingAmountEth.toFixed(2)} MEZO to Wallet`,
      writeCall: () =>
        writeGenericAsync({
          address: CONTRACT_ADDRESSES.stakingBoost,
          abi: STAKING_BOOST_ABI,
          functionName: 'claimUnstaked',
        }),
      onConfirmed: () => {
        refetchUnbonding();
        refetchMezoBalance();
      },
    });
  };

  const handleCancelUnstake = () => {
    if (isWrongNetwork || !address || unbondingAmountEth <= 0) return;
    executeTx({
      actionType: 'cancel_unstake',
      title: 'Cancel Unstake & Restake',
      amountDisplay: `${unbondingAmountEth.toFixed(2)} MEZO restaked`,
      writeCall: () =>
        writeGenericAsync({
          address: CONTRACT_ADDRESSES.stakingBoost,
          abi: STAKING_BOOST_ABI,
          functionName: 'cancelUnstake',
        }),
      onConfirmed: () => {
        refetchUnbonding();
        refetchStakedBalance();
        refetchTier();
        refetchFeeDiscount();
        refetchKeeperBoost();
        refetchTotalStaked();
      },
    });
  };

  const handleClaimStakingRewards = () => {
    if (isWrongNetwork || !address || earnedRewardsEth <= 0) return;
    executeTx({
      actionType: 'claim_staking_rewards',
      title: 'Claim MUSD Protocol Dividends',
      amountDisplay: `${earnedRewardsEth.toFixed(4)} MUSD to Wallet`,
      writeCall: () =>
        writeGenericAsync({
          address: CONTRACT_ADDRESSES.stakingBoost,
          abi: STAKING_BOOST_ABI,
          functionName: 'claimRewards',
        }),
      onConfirmed: () => {
        refetchEarnedRewards();
        refetchMusd();
      },
    });
  };

  // Credit Engine: Deposit, Withdraw, and Amortize (High Finding 2 fix)
  const handleDepositYield = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yieldDepositAmount || isWrongNetwork) return;
    const amountNum = Number(yieldDepositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTxStatus('failed');
      setStatusMessage('Deposit amount must be > 0.');
      return;
    }
    executeTx({
      actionType: 'deposit_yield',
      title: 'Deposit Yield / Reserve',
      amountDisplay: `${yieldDepositAmount} MUSD`,
      writeCall: () =>
        writeGenericAsync({
          address: CONTRACT_ADDRESSES.creditEngine,
          abi: CREDIT_ENGINE_ABI,
          functionName: 'depositYield',
          args: [parseEther(yieldDepositAmount)],
        }),
      onConfirmed: () => {
        refetchYield();
        refetchMusd();
      },
    });
  };

  const handleWithdrawYield = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yieldWithdrawAmount || isWrongNetwork) return;
    const amountNum = Number(yieldWithdrawAmount);
    const yieldBalNum = yieldBalance ? Number(formatEther(yieldBalance as bigint)) : 0;
    if (isNaN(amountNum) || amountNum <= 0) {
      setTxStatus('failed');
      setStatusMessage('Withdraw amount must be > 0.');
      return;
    }
    if (amountNum > yieldBalNum) {
      setTxStatus('failed');
      setStatusMessage(`Insufficient yield balance (${yieldBalNum.toLocaleString()} MUSD available).`);
      return;
    }
    executeTx({
      actionType: 'withdraw_yield',
      title: 'Withdraw Yield Balance',
      amountDisplay: `${yieldWithdrawAmount} MUSD`,
      writeCall: () =>
        writeGenericAsync({
          address: CONTRACT_ADDRESSES.creditEngine,
          abi: CREDIT_ENGINE_ABI,
          functionName: 'withdrawYield',
          args: [parseEther(yieldWithdrawAmount)],
        }),
      onConfirmed: () => {
        refetchYield();
        refetchMusd();
      },
    });
  };

  const handleAmortizeDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amortizeAmount || !address || isWrongNetwork) return;
    const amountNum = Number(amortizeAmount);
    const yieldBalNum = yieldBalance ? Number(formatEther(yieldBalance as bigint)) : 0;
    if (isNaN(amountNum) || amountNum <= 0) {
      setTxStatus('failed');
      setStatusMessage('Amortization amount must be > 0.');
      return;
    }
    if (amountNum > yieldBalNum) {
      setTxStatus('failed');
      setStatusMessage(`Insufficient yield balance (${yieldBalNum.toLocaleString()} MUSD available).`);
      return;
    }
    if (amountNum > debtEth) {
      setTxStatus('failed');
      setStatusMessage(`Amortization exceeds active debt (${debtEth.toLocaleString()} MUSD).`);
      return;
    }
    executeTx({
      actionType: 'amortize',
      title: 'Amortize Debt',
      amountDisplay: `${amortizeAmount} MUSD`,
      writeCall: () =>
        writeGenericAsync({
          address: CONTRACT_ADDRESSES.creditEngine,
          abi: CREDIT_ENGINE_ABI,
          functionName: 'amortizeDebt',
          args: [address, parseEther(amortizeAmount)],
        }),
      onConfirmed: () => {
        refetchDebt();
        refetchYield();
      },
    });
  };

  // Payroll Streamer Actions (Stream real MUSD!)
  const handleCreateStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !streamDeposit || !duration || isWrongNetwork) return;
    if (!isAddress(recipient)) {
      setTxStatus('failed');
      setStatusMessage('Invalid recipient EVM address format.');
      return;
    }
    const depositNum = Number(streamDeposit);
    const durationNum = Number(duration);
    if (isNaN(depositNum) || depositNum <= 0) {
      setTxStatus('failed');
      setStatusMessage('Deposit amount must be > 0.');
      return;
    }
    if (isNaN(durationNum) || durationNum <= 0) {
      setTxStatus('failed');
      setStatusMessage('Stream duration must be > 0 seconds.');
      return;
    }
    executeTx({
      actionType: 'create_stream',
      title: 'Create MUSD Stream',
      amountDisplay: `${streamDeposit} MUSD`,
      writeCall: () =>
        writeStreamerAsync({
          address: CONTRACT_ADDRESSES.streamer,
          abi: STREAMER_ABI,
          functionName: 'createStream',
          args: [recipient as `0x${string}`, parseEther(streamDeposit), BigInt(duration)],
        }),
      onReceipt: (receipt) => {
        const streamCreatedTopic = '0x4396d7c3edc1447dac8dd2b7143af95840c926a210524a0d3198012c7fdf37c7';
        const log = receipt.logs?.find((l: any) => l.topics?.[0]?.toLowerCase() === streamCreatedTopic.toLowerCase());
        if (log && log.topics?.[1]) {
          const newStreamId = BigInt(log.topics[1]).toString();
          setStreamIdToManage(newStreamId);
          return `Stream #${newStreamId} created on Mezo L2 and loaded into Stream Management!`;
        }
        return `MUSD Salary Stream created on Mezo L2!`;
      },
      onConfirmed: () => {
        refetchStream();
        refetchNextStreamId();
        refetchClaimable();
        refetchMusd();
      },
    });
  };

  const handleWithdrawStream = () => {
    if (isWrongNetwork) return;
    if (!isCurrentUserRecipient) {
      setTxStatus('failed');
      setStatusMessage(`Only the designated recipient (${formatAddress(streamRecipient)}) can withdraw from Stream #${streamIdToManage}.`);
      return;
    }
    if (claimableEth <= 0) {
      setTxStatus('failed');
      setStatusMessage(`Nothing available to withdraw yet from Stream #${streamIdToManage}. Funds vest second-by-second.`);
      return;
    }
    const splitAmountEth = isSplitEnabled && currentSplitBps > 0 ? (claimableEth * currentSplitBps) / 10000 : 0;
    const recipientAmountEth = claimableEth - splitAmountEth;
    executeTx({
      actionType: 'withdraw_stream',
      title: 'Claim Stream Earnings',
      amountDisplay:
        isSplitEnabled && currentSplitBps > 0
          ? `${recipientAmountEth.toFixed(4)} MUSD to Wallet + ${splitAmountEth.toFixed(4)} MUSD to Debt Amortization`
          : `${claimableEth.toFixed(4)} MUSD from Stream #${streamIdToManage}`,
      writeCall: () =>
        writeStreamerAsync({
          address: CONTRACT_ADDRESSES.streamer,
          abi: STREAMER_ABI,
          functionName: 'withdrawFromStream',
          args: [BigInt(streamIdToManage)],
        }),
      onConfirmed: () => {
        refetchStream();
        refetchClaimable();
        refetchMusd();
        refetchDebt();
        refetchAutoHealEligibility();
        refetchHealthFactor();
        refetchStreamSplit();
      },
    });
  };

  const handleTopUpStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpAmount || isWrongNetwork) return;
    if (!isCurrentUserEmployer) {
      setTxStatus('failed');
      setStatusMessage(`Only the employer (${formatAddress(streamEmployer)}) can top up Stream #${streamIdToManage}.`);
      return;
    }
    executeTx({
      actionType: 'top_up_stream',
      title: 'Top-Up Stream',
      amountDisplay: `${topUpAmount} MUSD`,
      writeCall: () =>
        writeStreamerAsync({
          address: CONTRACT_ADDRESSES.streamer,
          abi: STREAMER_ABI,
          functionName: 'topUpStream',
          args: [BigInt(streamIdToManage), parseEther(topUpAmount)],
        }),
      onConfirmed: () => {
        refetchStream();
        refetchClaimable();
        refetchMusd();
      },
    });
  };

  const handleCancelStream = () => {
    if (isWrongNetwork) return;
    if (!isCurrentUserEmployer && !isCurrentUserRecipient) {
      setTxStatus('failed');
      setStatusMessage(`Only the Employer (${formatAddress(streamEmployer)}) or Recipient (${formatAddress(streamRecipient)}) can cancel Stream #${streamIdToManage}.`);
      return;
    }
    executeTx({
      actionType: 'cancel_stream',
      title: 'Cancel Stream',
      amountDisplay: `Stream #${streamIdToManage}`,
      writeCall: () =>
        writeStreamerAsync({
          address: CONTRACT_ADDRESSES.streamer,
          abi: STREAMER_ABI,
          functionName: 'cancelStream',
          args: [BigInt(streamIdToManage)],
        }),
      onConfirmed: () => {
        refetchStream();
        refetchClaimable();
        refetchMusd();
      },
    });
  };

  return (
    <main className="min-h-screen bg-[#0A0A0C] text-[#F4F3EF] flex flex-col font-sans selection:bg-[#D43838]/30 selection:text-[#FFFFFF]">
      {/* HEADER & WRONG NETWORK WARNING */}
      <Header
        mounted={mounted}
        isConnected={isConnected}
        address={address}
        connector={connector}
        chainId={chainId}
        btcPriceUSD={btcPriceUSD}
        activeAction={activeAction}
        genericPending={genericPending}
        isReady={isReady}
        handleOpenConnectWallet={handleOpenConnectWallet}
        handleOpenManageWallet={handleOpenManageWallet}
        handleClaimFaucet={handleClaimFaucet}
        switchChain={switchChain}
        formatAddress={formatAddress}
      />

      {/* FLOATING TX STATUS BANNER */}
      <TxBanner
        txStatus={txStatus}
        statusMessage={statusMessage}
        onClose={() => setTxStatus('idle')}
      />

      {/* MAIN CONTAINER */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col space-y-8">
        {/* NAVIGATION TABS */}
        <NavigationTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          troveIcrNum={troveIcrNum}
        />

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <OverviewTab
            btcPriceUSD={btcPriceUSD}
            nativeCollateralEth={nativeCollateralEth}
            tbtcCollateralEth={tbtcCollateralEth}
            debtEth={debtEth}
            ltvStatusColor={ltvStatusColor}
            collateralValueUSD={collateralValueUSD}
            ltvNumeric={ltvNumeric}
            troveDebtNum={troveDebtNum}
            troveCollNum={troveCollNum}
            troveIcrNum={troveIcrNum}
            isUserLiquidatable={Boolean(isUserLiquidatable)}
            setActiveTab={setActiveTab}
          />
        )}

        {/* TAB 2: VAULT & CREDIT */}
        {activeTab === 'vault' && (
          <VaultTab
            mounted={mounted}
            isConnected={isConnected}
            handleOpenConnectWallet={handleOpenConnectWallet}
            nativeBalance={nativeBalance}
            tbtcBalance={tbtcBalance}
            musdBalance={musdBalance}
            btcPriceUSD={btcPriceUSD}
            nativeCollateralEth={nativeCollateralEth}
            tbtcCollateralEth={tbtcCollateralEth}
            collateralMode={collateralMode}
            setCollateralMode={setCollateralMode}
            collateralAmount={collateralAmount}
            setCollateralAmount={setCollateralAmount}
            handleApprove={handleApprove}
            isTbtcApproved={isTbtcApproved}
            genericPending={genericPending}
            activeAction={activeAction}
            isReady={isReady}
            vaultPending={vaultPending}
            txStatus={txStatus}
            handleDepositCollateral={handleDepositCollateral}
            withdrawMode={withdrawMode}
            setWithdrawMode={setWithdrawMode}
            withdrawAmount={withdrawAmount}
            setWithdrawAmount={setWithdrawAmount}
            maxWithdrawableEth={maxWithdrawableEth}
            collateralEth={collateralEth}
            handleWithdrawCollateral={handleWithdrawCollateral}
            ltvStatusColor={ltvStatusColor}
            collateralValueUSD={collateralValueUSD}
            ltvNumeric={ltvNumeric}
            debtEth={debtEth}
            availableBorrowUSD={availableBorrowUSD}
            borrowAmount={borrowAmount}
            setBorrowAmount={setBorrowAmount}
            handleBorrowMUSD={handleBorrowMUSD}
            repayAmount={repayAmount}
            setRepayAmount={setRepayAmount}
            isVaultApproved={isVaultApproved}
            handleRepayMUSD={handleRepayMUSD}
            streamIdForAutoHeal={streamIdForAutoHeal}
            setStreamIdForAutoHeal={setStreamIdForAutoHeal}
            isAutoHealEligible={isAutoHealEligible}
            autoHealCurrentICR={autoHealCurrentICR}
            debtToRestoreEth={debtToRestoreEth}
            unvestedBufferEth={unvestedBufferEth}
            handleAutoHealTrove={handleAutoHealTrove}
            yieldBalance={yieldBalance}
            yieldDepositAmount={yieldDepositAmount}
            setYieldDepositAmount={setYieldDepositAmount}
            isCreditEngineApproved={isCreditEngineApproved}
            handleDepositYield={handleDepositYield}
            yieldWithdrawAmount={yieldWithdrawAmount}
            setYieldWithdrawAmount={setYieldWithdrawAmount}
            handleWithdrawYield={handleWithdrawYield}
            amortizeAmount={amortizeAmount}
            setAmortizeAmount={setAmortizeAmount}
            handleAmortizeDebt={handleAmortizeDebt}
            effectiveKeeperBonusPercent={effectiveKeeperBonusPercent}
            currentTierName={currentTierName}
            setActiveTab={setActiveTab}
            liquidateUser={liquidateUser}
            setLiquidateUser={setLiquidateUser}
            liquidateDebtAmount={liquidateDebtAmount}
            setLiquidateDebtAmount={setLiquidateDebtAmount}
            liquidateSeizeNative={liquidateSeizeNative}
            setLiquidateSeizeNative={setLiquidateSeizeNative}
            handleLiquidate={handleLiquidate}
            formatEther={formatEther}
          />
        )}

        {/* TAB 3: PAYROLL STREAMER */}
        {activeTab === 'payroll' && (
          <PayrollTab
            mounted={mounted}
            isConnected={isConnected}
            handleOpenConnectWallet={handleOpenConnectWallet}
            musdBalance={musdBalance}
            formatEther={formatEther}
            recipient={recipient}
            setRecipient={setRecipient}
            streamDeposit={streamDeposit}
            setStreamDeposit={setStreamDeposit}
            duration={duration}
            setDuration={setDuration}
            handleCreateStream={handleCreateStream}
            handleApprove={handleApprove}
            isStreamerApproved={isStreamerApproved}
            streamerPending={streamerPending}
            genericPending={genericPending}
            txStatus={txStatus}
            activeAction={activeAction}
            isReady={isReady}
            streamIdToManage={streamIdToManage}
            setStreamIdToManage={setStreamIdToManage}
            streamExists={streamExists}
            streamIsActive={streamIsActive}
            streamEmployer={streamEmployer}
            streamRecipient={streamRecipient}
            isCurrentUserEmployer={isCurrentUserEmployer}
            isCurrentUserRecipient={isCurrentUserRecipient}
            streamDepositAmount={streamDepositAmount}
            claimableEth={claimableEth}
            streamProgressPercent={streamProgressPercent}
            isSplitEnabled={isSplitEnabled}
            currentSplitBps={currentSplitBps}
            currentSplitTarget={currentSplitTarget}
            splitPercent={splitPercent}
            setSplitPercent={setSplitPercent}
            splitTargetBorrower={splitTargetBorrower}
            setSplitTargetBorrower={setSplitTargetBorrower}
            handleSetStreamSplit={handleSetStreamSplit}
            handleWithdrawStream={handleWithdrawStream}
            topUpAmount={topUpAmount}
            setTopUpAmount={setTopUpAmount}
            handleTopUpStream={handleTopUpStream}
            handleCancelStream={handleCancelStream}
            formatAddress={formatAddress}
            address={address}
          />
        )}

        {/* TAB 4: MEZO STAKING BOOST */}
        {activeTab === 'staking' && (
          <StakingTab
            mounted={mounted}
            isConnected={isConnected}
            handleOpenConnectWallet={handleOpenConnectWallet}
            mezoBalanceEth={mezoBalanceEth}
            userStakedMezo={userStakedMezo}
            totalStakedMezo={totalStakedMezo}
            currentTierName={currentTierName}
            feeDiscountPercent={feeDiscountPercent}
            keeperBoostPercent={keeperBoostPercent}
            earnedRewardsEth={earnedRewardsEth}
            stakingTab={stakingTab}
            setStakingTab={setStakingTab}
            mezoStakeAmount={mezoStakeAmount}
            setMezoStakeAmount={setMezoStakeAmount}
            mezoUnstakeAmount={mezoUnstakeAmount}
            setMezoUnstakeAmount={setMezoUnstakeAmount}
            handleApprove={handleApprove}
            handleStakeMEZO={handleStakeMEZO}
            handleInitiateUnstake={handleInitiateUnstake}
            handleClaimUnstaked={handleClaimUnstaked}
            handleCancelUnstake={handleCancelUnstake}
            handleClaimStakingRewards={handleClaimStakingRewards}
            isMezoApproved={isMezoApproved}
            genericPending={genericPending}
            txStatus={txStatus}
            activeAction={activeAction}
            isReady={isReady}
            unbondingAmountEth={unbondingAmountEth}
            isUnbondingReady={isUnbondingReady}
            unbondingReleaseTime={unbondingReleaseTime}
          />
        )}

        {/* TAB 5: RISK SIMULATOR & KEEPER ARENA */}
        {activeTab === 'simulator' && (
          <SimulatorTab
            baseBtcPrice={baseBtcPrice}
            currentTierName={currentTierName}
            effectiveKeeperBonusPercent={effectiveKeeperBonusPercent}
            keeperEarningsUSD={keeperEarningsUSD}
            simHealToast={simHealToast}
            setSimHealToast={setSimHealToast}
            handleResetSim={handleResetSim}
            activeSimCollateral={activeSimCollateral}
            activeSimDebt={activeSimDebt}
            simTrovePreset={simTrovePreset}
            applySimPreset={applySimPreset}
            isConnected={isConnected}
            collateralEth={collateralEth}
            debtEth={debtEth}
            simBtcPrice={simBtcPrice}
            simBtcShockPercent={simBtcShockPercent}
            setSimBtcShockPercent={setSimBtcShockPercent}
            simZone={simZone}
            simIcr={simIcr}
            simLtv={simLtv}
            simCollateralUSD={simCollateralUSD}
            actualHealAmount={actualHealAmount}
            activeSimEscrow={activeSimEscrow}
            simHealedState={simHealedState}
            setSimHealedState={setSimHealedState}
            handleSimulateAutoHeal={handleSimulateAutoHeal}
            keeperFilter={keeperFilter}
            setKeeperFilter={setKeeperFilter}
            arenaTroves={arenaTroves}
            keeperLiquidatedIds={keeperLiquidatedIds}
            handleExecuteKeeperLiquidation={handleExecuteKeeperLiquidation}
            formatAddress={formatAddress}
            setActiveTab={setActiveTab}
            keeperCount={keeperCount}
          />
        )}

        {/* TAB 6: ON-CHAIN ACTIVITY */}
        {activeTab === 'activity' && (
          <ActivityTab
            transactions={transactions}
            clearTransactionHistory={clearTransactionHistory}
            formatAddress={formatAddress}
          />
        )}
      </div>

      {/* FOOTER */}
      <Footer />

      {/* WALLET SELECTION & DISCONNECT MODAL */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        initialMode={walletModalInitialMode}
      />
    </main>
  );
}
