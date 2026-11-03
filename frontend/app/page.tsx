'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, usePublicClient, useChainId, useSwitchChain, useBalance } from 'wagmi';
import { CONTRACT_ADDRESSES, MEZO_TESTNET_CHAIN_ID, VAULT_ABI, STREAMER_ABI, CREDIT_ENGINE_ABI, ERC20_ABI, STAKING_BOOST_ABI } from './contracts';
import { parseEther, formatEther, isAddress } from 'viem';
import { Shield, Zap, DollarSign, Clock, Wallet, ArrowUpRight, PlusCircle, XCircle, X, Activity, ChevronRight, CheckCircle2, RefreshCw, AlertTriangle, ExternalLink, Layers, Award, Droplets, ChevronDown, LogOut, ArrowRightLeft } from 'lucide-react';
import { WalletModal, getWalletIcon } from './components/WalletModal';

interface TransactionRecord {
  hash: string;
  type: string;
  amount: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
}

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

  const [activeTab, setActiveTab] = useState<'overview' | 'vault' | 'payroll' | 'staking' | 'activity'>('overview');
  const [animationPhase, setAnimationPhase] = useState(0);

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

  type ActiveAction =
    | 'idle'
    | 'deposit_collateral'
    | 'withdraw_collateral'
    | 'borrow_musd'
    | 'repay_musd'
    | 'approve_repay'
    | 'approve_yield'
    | 'deposit_yield'
    | 'withdraw_yield'
    | 'amortize'
    | 'approve_stream'
    | 'create_stream'
    | 'top_up_stream'
    | 'withdraw_stream'
    | 'cancel_stream'
    | 'faucet_tbtc'
    | 'approve_tbtc_vault'
    | 'liquidate'
    | 'auto_heal_trove'
    | 'set_stream_split'
    | 'approve_mezo'
    | 'stake_mezo'
    | 'initiate_unstake'
    | 'claim_unstaked'
    | 'cancel_unstake'
    | 'claim_staking_rewards';

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
    <main className="min-h-screen bg-[#F6F4EF] text-[#171715] flex flex-col font-sans selection:bg-[#E66C35]/20 selection:text-[#E66C35]">

      {/* Wrong Network Banner */}
      {isWrongNetwork && (
        <div className="bg-[#C7473A] text-white px-6 py-2.5 text-xs font-mono flex items-center justify-between z-50">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Wrong network connected. BitStreamfi operates on Mezo Testnet (Chain ID 31611).</span>
          </div>
          <button
            onClick={() => switchChain({ chainId: MEZO_TESTNET_CHAIN_ID })}
            className="bg-white text-[#C7473A] font-bold px-3 py-1 rounded hover:bg-slate-100 transition-colors"
          >
            Switch to Mezo Testnet
          </button>
        </div>
      )}

      {/* Transaction Status Toast */}
      {txStatus !== 'idle' && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#FBFAF7] border border-[#DEDBD3] p-4 rounded-2xl shadow-2xl max-w-sm sm:max-w-md w-full flex flex-col space-y-2 animate-fadeIn">
          <div className="flex items-start justify-between space-x-3">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              {txStatus === 'success' && <CheckCircle2 className="w-5 h-5 text-[#258454] shrink-0 mt-0.5" />}
              {txStatus === 'failed' && <XCircle className="w-5 h-5 text-[#C7473A] shrink-0 mt-0.5" />}
              {(txStatus === 'pending' || txStatus === 'wallet_confirm' || txStatus === 'preparing') && (
                <RefreshCw className="w-5 h-5 text-[#E66C35] shrink-0 mt-0.5 animate-spin" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-[#77756F]">
                  {txStatus === 'success'
                    ? 'Confirmed on Mezo L2'
                    : txStatus === 'failed'
                    ? 'Transaction Failed'
                    : txStatus === 'wallet_confirm'
                    ? 'Awaiting Wallet Signature'
                    : 'Broadcasting to Mezo'}
                </p>
                <p className="text-xs text-[#171715] font-mono mt-1 break-words">{statusMessage}</p>
              </div>
            </div>
            <button onClick={() => setTxStatus('idle')} className="text-[#77756F] hover:text-[#171715]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="border-b border-[#DEDBD3] bg-[#FBFAF7]/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-[#171715] text-[#F6F4EF] w-10 h-10 rounded-xl flex items-center justify-center font-serif-display font-bold text-xl shadow-md">
              ₿
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-serif-display text-2xl font-bold tracking-tight text-[#171715]">BitStreamfi</h1>
                <span className="text-[10px] font-mono bg-[#E66C35]/15 text-[#E66C35] px-2 py-0.5 rounded-full font-bold">
                  Wave 2 Composable
                </span>
              </div>
              <p className="text-xs font-mono text-[#77756F]">Bitcoin Collateral • Mezo Troves • MUSD Streaming</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Live Oracle Price Badge */}
            <div className="hidden sm:flex items-center space-x-2 bg-[#F6F4EF] border border-[#DEDBD3] px-3 py-1.5 rounded-xl text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-[#258454] animate-pulse" />
              <span className="text-[#77756F]">Mezo Oracle:</span>
              <strong className="text-[#171715]">${btcPriceUSD.toLocaleString()}</strong>
            </div>

            {/* Test tBTC Faucet Button */}
            <button
              onClick={handleClaimFaucet}
              disabled={(genericPending && activeAction === 'faucet_tbtc') || !isReady}
              className="hidden md:flex items-center space-x-1.5 bg-[#E66C35]/10 hover:bg-[#E66C35]/20 text-[#E66C35] border border-[#E66C35]/30 text-xs font-mono font-bold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
              title="Claim 1,000 Test tBTC ERC-20 tokens directly to your wallet"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>{activeAction === 'faucet_tbtc' ? 'Claiming...' : 'tBTC Faucet'}</span>
            </button>

            {/* Wallet Connect & Account Management */}
            {mounted && isConnected ? (
              <button
                onClick={handleOpenManageWallet}
                className="flex items-center space-x-2.5 bg-[#F6F4EF] hover:bg-[#EFECE6] border border-[#DEDBD3] hover:border-[#171715] px-3.5 py-2 rounded-xl transition-all shadow-xs group cursor-pointer"
                title="Manage wallet, view account details, switch wallet, or disconnect"
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {getWalletIcon(connector?.name || connector?.id, undefined, 'w-4 h-4')}
                </div>
                <div className="hidden sm:flex flex-col text-left font-mono text-xs">
                  <div className="flex items-center space-x-1.5 leading-tight">
                    <span className="text-[#171715] font-bold group-hover:text-[#E66C35] transition-colors">
                      {formatAddress(address)}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#258454] animate-pulse" />
                  </div>
                  <span className="text-[10px] text-[#77756F] leading-tight">
                    {connector?.name || 'Mezo Testnet'}
                  </span>
                </div>
                <span className="sm:hidden font-mono text-xs font-bold text-[#171715]">
                  {formatAddress(address)}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#77756F] group-hover:text-[#171715] group-hover:translate-y-0.5 transition-all ml-0.5" />
              </button>
            ) : (
              <button
                onClick={handleOpenConnectWallet}
                className="bg-[#171715] hover:bg-[#E66C35] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center space-x-2 cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col space-y-8">

        {/* NAVIGATION TABS */}
        <nav className="flex justify-between items-center border-b border-[#DEDBD3] pb-4">
          <div className="flex space-x-2 bg-[#FBFAF7] p-1.5 rounded-2xl border border-[#DEDBD3]">
            {[
              { id: 'overview', label: '1. Overview' },
              { id: 'vault', label: '2. Vault & Credit' },
              { id: 'payroll', label: '3. MUSD Payroll' },
              { id: 'staking', label: '4. MEZO Staking' },
              { id: 'activity', label: '5. Activity' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#171715] text-white shadow-sm'
                    : 'text-[#77756F] hover:text-[#171715] hover:bg-[#F6F4EF]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Trove Composed Badge */}
          <div className="hidden lg:flex items-center space-x-2 text-xs font-mono bg-[#FBFAF7] border border-[#DEDBD3] px-3.5 py-2 rounded-xl">
            <span className="text-[#258454] font-bold">● Trove ICR: {troveIcrNum.toFixed(1)}%</span>
            <span className="text-[#77756F]">| Composed with BorrowerOperations</span>
          </div>
        </nav>

        {/* TAB 1: OVERVIEW & MASTER ANATOMY */}
        {activeTab === 'overview' && (
          <div className="space-y-12 animate-fadeIn">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-mono uppercase text-[#E66C35] tracking-widest font-semibold">Protocol Architecture — Wave 2</p>
              <h2 className="text-5xl font-serif-display font-normal tracking-tight leading-none text-[#171715]">
                Composable Bitcoin Credit.
              </h2>
              <p className="text-sm text-[#77756F] leading-relaxed">
                BitStreamfi connects Bitcoin collateral to Mezo's native <strong>BorrowerOperations</strong> and live <strong>PriceFeed</strong> oracle.
                Instead of selling BTC, lock native BTC or tBTC, borrow real testnet MUSD stablecoins at ≤60% LTV, stream salaries second-by-second,
                and amortize debt automatically.
              </p>
            </div>

            {/* MASTER ANATOMY MACHINE */}
            <div className="bg-[#121c2e] border-2 border-[#C59B27]/40 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0a111c] via-[#121c2e] to-[#1a2942] pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-6 border-b border-slate-700/60 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C59B27] animate-pulse"></span>
                    <span className="text-xs font-mono uppercase tracking-widest text-slate-300">FIG. 1 — BitStreamfi & Mezo Native Trove Pipeline</span>
                  </div>
                  <div className="text-xs font-mono text-[#C59B27] bg-[#C59B27]/10 px-3 py-1 rounded border border-[#C59B27]/30">
                    Live Oracle: ${btcPriceUSD.toLocaleString()} USD
                  </div>
                </div>

                <div className="w-full h-[390px] flex justify-center items-center overflow-hidden my-2">
                  <iframe
                    src="/vault-anatomy/embed.html"
                    className="w-full h-full border-0 bg-transparent"
                    title="BitStreamfi Isometric Collateral Vault Animation"
                  />
                </div>

                <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-700/60 text-xs font-mono text-slate-300">
                  <div>
                    <span className="text-[#C59B27]">●</span> Native BTC: <strong className="text-white">{nativeCollateralEth.toFixed(4)} BTC</strong>
                  </div>
                  <div>
                    <span className="text-[#C59B27]">●</span> tBTC Collateral: <strong className="text-white">{tbtcCollateralEth.toFixed(4)} tBTC</strong>
                  </div>
                  <div>
                    <span className="text-[#C59B27]">●</span> Active Debt: <strong className="text-white">{debtEth.toLocaleString()} MUSD</strong>
                  </div>
                  <div>
                    <span className="text-[#C59B27]">●</span> Health / LTV: <strong className={ltvStatusColor}>{collateralValueUSD > 0 ? `${ltvNumeric.toFixed(1)}%` : '0.0%'} (Max 60%)</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* PROTOCOL METRICS & COMPOSITION GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Protocol Trove Integration */}
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-6 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#171715]">Mezo Trove Protocol</h4>
                  <span className="text-[10px] font-mono bg-[#258454]/15 text-[#258454] px-2 py-0.5 rounded font-bold">Composed</span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#77756F]">Trove Status:</span>
                    <strong className="text-[#258454]">Active (Mezo L2)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77756F]">Trove Debt:</span>
                    <strong className="text-[#171715]">{troveDebtNum.toFixed(1)} MUSD</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77756F]">Trove Collateral:</span>
                    <strong className="text-[#171715]">{troveCollNum.toFixed(4)} BTC</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77756F]">Trove ICR:</span>
                    <strong className="text-[#258454]">{troveIcrNum.toFixed(1)}%</strong>
                  </div>
                </div>
              </div>

              {/* Live PriceFeed Oracle */}
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-6 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#171715]">Live PriceFeed Oracle</h4>
                  <span className="text-[10px] font-mono bg-[#258454]/15 text-[#258454] px-2 py-0.5 rounded font-bold">On-Chain</span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#77756F]">Oracle Source:</span>
                    <strong className="text-[#171715]">Mezo PriceFeed</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77756F]">BTC/USD Price:</span>
                    <strong className="text-[#258454]">${btcPriceUSD.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77756F]">Pricing Model:</span>
                    <strong className="text-[#171715]">Dynamic (No mock $60k)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77756F]">Max LTV Allowed:</span>
                    <strong className="text-[#171715]">60.00%</strong>
                  </div>
                </div>
              </div>

              {/* Safety & Liquidation */}
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-6 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#171715]">Liquidation Engine</h4>
                  <span className="text-[10px] font-mono bg-[#B7791F]/15 text-[#B7791F] px-2 py-0.5 rounded font-bold">Keeper Ready</span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#77756F]">Liquidation Threshold:</span>
                    <strong className="text-[#171715]">75.00% LTV</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77756F]">Keeper Bonus:</span>
                    <strong className="text-[#258454]">5.00% Incentive</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77756F]">Your Position Status:</span>
                    <strong className={isUserLiquidatable ? 'text-[#C7473A]' : 'text-[#258454]'}>
                      {isUserLiquidatable ? 'Liquidatable (At Risk)' : 'Healthy & Safe'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77756F]">Accounting:</span>
                    <strong className="text-[#171715]">Native / tBTC Separated</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Banner */}
            <div className="p-6 bg-[#FBFAF7] rounded-2xl border border-[#DEDBD3] flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-serif-display font-bold text-xl text-[#171715]">Ready to stream Bitcoin-backed payroll?</h4>
                <p className="text-xs text-[#77756F] mt-1">Deposit collateral, draw real MUSD, and stream second-by-second to employees or contractors.</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setActiveTab('vault')}
                  className="bg-[#171715] hover:bg-[#E66C35] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                  Go to Vault & Borrow →
                </button>
                <button
                  onClick={() => setActiveTab('payroll')}
                  className="bg-[#FBFAF7] hover:bg-[#F6F4EF] border border-[#DEDBD3] text-[#171715] text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                  Create Stream →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VAULT, BORROWING, CREDIT ENGINE & LIQUIDATION */}
        {activeTab === 'vault' && (
          <div className="space-y-8 animate-fadeIn">
            {mounted && !isConnected && (
              <div className="bg-[#FBFAF7] border border-[#E66C35]/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#E66C35]/10 text-[#E66C35] flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif-display text-lg font-bold text-[#171715]">Connect Wallet to Transact</h4>
                    <p className="text-xs text-[#77756F]">Select MetaMask, Phantom, or browser extension to manage vaults and troves.</p>
                  </div>
                </div>
                <button
                  onClick={handleOpenConnectWallet}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#171715] hover:bg-[#E66C35] text-white text-xs font-semibold rounded-xl transition-all shrink-0 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Select & Connect Wallet</span>
                </button>
              </div>
            )}
            <div className="border-b border-[#DEDBD3] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-serif-display font-bold text-[#171715]">MezoFlow Vault & Credit Operations</h2>
                <p className="text-xs text-[#77756F] mt-1">
                  Manage Bitcoin collateral, borrow real MUSD stablecoins, amortize debt, or perform keeper liquidations.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <div className="bg-[#FBFAF7] border border-[#DEDBD3] px-3.5 py-2 rounded-xl">
                  <span className="text-[#77756F]">Gas BTC: </span>
                  <strong className="text-[#171715]">{mounted && nativeBalance ? Number(formatEther(nativeBalance.value)).toFixed(4) : '0.0000'}</strong>
                </div>
                <div className="bg-[#FBFAF7] border border-[#DEDBD3] px-3.5 py-2 rounded-xl">
                  <span className="text-[#77756F]">Wallet tBTC: </span>
                  <strong className="text-[#171715]">{mounted && tbtcBalance ? Number(formatEther(tbtcBalance as bigint)).toFixed(4) : '0.0000'}</strong>
                </div>
                <div className="bg-[#FBFAF7] border border-[#DEDBD3] px-3.5 py-2 rounded-xl">
                  <span className="text-[#77756F]">Wallet MUSD: </span>
                  <strong className="text-[#171715]">{mounted && musdBalance ? Number(formatEther(musdBalance as bigint)).toLocaleString() : '0'}</strong>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* CARD 1: DEPOSIT & WITHDRAW COLLATERAL */}
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-[#DEDBD3] pb-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-[#E66C35]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715]">Collateral Management</h3>
                  </div>
                  <span className="text-xs font-mono text-[#77756F]">Live Oracle: ${btcPriceUSD.toLocaleString()} / BTC</span>
                </div>

                {/* Collateral Breakdown */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-[#F6F4EF] p-4 rounded-xl border border-[#DEDBD3]">
                  <div>
                    <span className="text-[#77756F] block">Native BTC Locked:</span>
                    <strong className="text-[#171715] text-sm">{nativeCollateralEth.toFixed(4)} BTC</strong>
                  </div>
                  <div>
                    <span className="text-[#77756F] block">tBTC Locked:</span>
                    <strong className="text-[#171715] text-sm">{tbtcCollateralEth.toFixed(4)} tBTC</strong>
                  </div>
                </div>

                {/* Deposit Form */}
                <form onSubmit={handleDepositCollateral} className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <label className="font-bold text-[#171715]">1. Deposit Bitcoin Collateral</label>
                    <div className="flex space-x-1 bg-[#DEDBD3]/40 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setCollateralMode('native')}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${collateralMode === 'native' ? 'bg-[#171715] text-white' : 'text-[#77756F]'}`}
                      >
                        Native BTC
                      </button>
                      <button
                        type="button"
                        onClick={() => setCollateralMode('tbtc')}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${collateralMode === 'tbtc' ? 'bg-[#171715] text-white' : 'text-[#77756F]'}`}
                      >
                        tBTC ERC-20
                      </button>
                    </div>
                  </div>

                  <input
                    type="number"
                    step="0.0001"
                    value={collateralAmount}
                    onChange={(e) => setCollateralAmount(e.target.value)}
                    placeholder={collateralMode === 'native' ? '0.05 BTC (Native gas token)' : '1.0 tBTC'}
                    className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#E66C35]"
                  />

                  {collateralMode === 'tbtc' && (
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleApprove('tbtc', 'vault', collateralAmount || '10')}
                        disabled={(genericPending && activeAction === 'approve_tbtc_vault') || !isReady}
                        className={`flex-1 font-semibold py-2.5 rounded-xl text-xs transition-colors ${
                          isTbtcApproved
                            ? 'bg-[#258454]/10 border border-[#258454]/40 text-[#258454]'
                            : 'bg-[#E66C35] text-white animate-pulse'
                        } disabled:opacity-50`}
                      >
                        {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'approve_tbtc_vault'
                          ? 'Approving...'
                          : isTbtcApproved
                          ? '✓ tBTC Approved'
                          : '1. Approve tBTC'}
                      </button>
                      <button
                        type="submit"
                        disabled={(vaultPending && activeAction === 'deposit_collateral') || !isReady || !collateralAmount || Number(collateralAmount) <= 0 || !isTbtcApproved}
                        className="flex-1 bg-[#171715] hover:bg-[#E66C35] text-white font-semibold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50"
                      >
                        {(vaultPending || txStatus === 'wallet_confirm') && activeAction === 'deposit_collateral' ? 'Depositing...' : '2. Deposit tBTC'}
                      </button>
                    </div>
                  )}

                  {collateralMode === 'native' && (
                    <button
                      type="submit"
                      disabled={(vaultPending && activeAction === 'deposit_collateral') || !isReady || !collateralAmount || Number(collateralAmount) <= 0}
                      className="w-full bg-[#171715] hover:bg-[#E66C35] text-white font-semibold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50"
                    >
                      {(vaultPending || txStatus === 'wallet_confirm') && activeAction === 'deposit_collateral' ? 'Depositing...' : 'Deposit Native BTC'}
                    </button>
                  )}
                </form>

                {/* Withdraw Form */}
                <form onSubmit={handleWithdrawCollateral} className="space-y-4 pt-4 border-t border-[#DEDBD3]">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <label className="font-bold text-[#171715]">2. Withdraw Collateral</label>
                    <div className="flex space-x-1 bg-[#DEDBD3]/40 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setWithdrawMode('native')}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${withdrawMode === 'native' ? 'bg-[#171715] text-white' : 'text-[#77756F]'}`}
                      >
                        Native BTC
                      </button>
                      <button
                        type="button"
                        onClick={() => setWithdrawMode('tbtc')}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${withdrawMode === 'tbtc' ? 'bg-[#171715] text-white' : 'text-[#77756F]'}`}
                      >
                        tBTC ERC-20
                      </button>
                    </div>
                  </div>

                  <input
                    type="number"
                    step="0.0001"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder={`Max safe withdrawal: ${maxWithdrawableEth.toFixed(4)} BTC`}
                    className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#E66C35]"
                  />

                  <button
                    type="submit"
                    disabled={(vaultPending && activeAction === 'withdraw_collateral') || !isReady || collateralEth <= 0 || !withdrawAmount || Number(withdrawAmount) <= 0}
                    className="w-full bg-[#FBFAF7] hover:bg-[#F6F4EF] border border-[#DEDBD3] text-[#171715] font-semibold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50"
                  >
                    {(vaultPending || txStatus === 'wallet_confirm') && activeAction === 'withdraw_collateral'
                      ? 'Withdrawing...'
                      : `Withdraw ${withdrawMode === 'native' ? 'Native BTC' : 'tBTC'}`}
                  </button>
                </form>
              </div>

              {/* CARD 2: BORROW & REPAY MUSD */}
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-[#DEDBD3] pb-3">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-[#258454]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715]">MUSD Borrow & Repay</h3>
                  </div>
                  <span className={`text-xs font-mono font-bold ${ltvStatusColor}`}>
                    LTV: {collateralValueUSD > 0 ? `${ltvNumeric.toFixed(1)}%` : '0.0%'} (Max 60%)
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-[#F6F4EF] p-4 rounded-xl border border-[#DEDBD3]">
                  <div>
                    <span className="text-[#77756F] block">Total Borrowed Debt:</span>
                    <strong className="text-[#C7473A] text-sm">{debtEth.toLocaleString()} MUSD</strong>
                  </div>
                  <div>
                    <span className="text-[#77756F] block">Available Borrow Capacity:</span>
                    <strong className="text-[#258454] text-sm">${availableBorrowUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })} MUSD</strong>
                  </div>
                </div>

                {/* Borrow Form */}
                <form onSubmit={handleBorrowMUSD} className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <label className="font-bold text-[#171715]">Borrow MUSD Against Collateral</label>
                    <button
                      type="button"
                      onClick={() => setBorrowAmount(Math.floor(availableBorrowUSD).toString())}
                      className="text-[#E66C35] hover:underline"
                    >
                      Max Safe Borrow
                    </button>
                  </div>
                  <input
                    type="number"
                    step="1"
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(e.target.value)}
                    placeholder="5000 MUSD"
                    className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#258454]"
                  />
                  <button
                    type="submit"
                    disabled={(vaultPending && activeAction === 'borrow_musd') || !isReady || availableBorrowUSD <= 0 || !borrowAmount || Number(borrowAmount) <= 0}
                    className="w-full bg-[#171715] hover:bg-[#258454] text-white font-semibold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50"
                  >
                    {(vaultPending || txStatus === 'wallet_confirm') && activeAction === 'borrow_musd' ? 'Borrowing...' : 'Borrow MUSD Stablecoins'}
                  </button>
                </form>

                {/* Repay Form */}
                <form onSubmit={handleRepayMUSD} className="space-y-4 pt-4 border-t border-[#DEDBD3]">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <label className="font-bold text-[#171715]">Repay MUSD Debt</label>
                    <button
                      type="button"
                      onClick={() => setRepayAmount(Math.min(debtEth, musdBalance ? Number(formatEther(musdBalance as bigint)) : 0).toString())}
                      className="text-[#E66C35] hover:underline"
                    >
                      Repay Max Debt
                    </button>
                  </div>
                  <input
                    type="number"
                    step="1"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    placeholder="Amount to repay"
                    className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#E66C35]"
                  />
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleApprove('musd', 'vault', repayAmount || '5000')}
                      disabled={(genericPending && activeAction === 'approve_repay') || !isReady}
                      className={`flex-1 font-semibold py-2.5 rounded-xl text-xs transition-colors ${
                        isVaultApproved
                          ? 'bg-[#258454]/10 border border-[#258454]/40 text-[#258454]'
                          : 'bg-[#E66C35] text-white animate-pulse'
                      } disabled:opacity-50`}
                    >
                      {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'approve_repay'
                        ? 'Approving...'
                        : isVaultApproved
                        ? '✓ Approved'
                        : '1. Approve MUSD'}
                    </button>
                    <button
                      type="submit"
                      disabled={(vaultPending && activeAction === 'repay_musd') || !isReady || debtEth <= 0 || !repayAmount || Number(repayAmount) <= 0 || !isVaultApproved}
                      className="flex-1 bg-[#171715] hover:bg-[#258454] text-white font-semibold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50"
                    >
                      {(vaultPending || txStatus === 'wallet_confirm') && activeAction === 'repay_musd' ? 'Repaying...' : '2. Repay Debt'}
                    </button>
                  </div>
                </form>
              </div>

              {/* CARD 3: CLOSED-LOOP SELF-HEALING TROVE SHIELD (Wave 2 Innovation) */}
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl lg:col-span-2 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#DEDBD3] pb-3 gap-2">
                  <div className="flex items-center space-x-2.5">
                    <Shield className="w-5 h-5 text-[#E66C35]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715]">
                      Closed-Loop "Self-Healing Trove" Shield
                    </h3>
                    <span className="text-[10px] font-mono bg-[#E66C35]/15 text-[#E66C35] px-2 py-0.5 rounded-full font-bold">
                      Protocol-Aware
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-mono">
                    <span className="text-[#77756F]">Linked Stream:</span>
                    <strong className="text-[#171715]">Stream #{streamIdForAutoHeal}</strong>
                  </div>
                </div>

                {/* Status Callout Banner */}
                <div
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono ${
                    isAutoHealEligible
                      ? 'bg-[#C7473A]/10 border-[#C7473A]/30 text-[#C7473A]'
                      : 'bg-[#258454]/10 border-[#258454]/30 text-[#258454]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Activity className={`w-4 h-4 shrink-0 ${isAutoHealEligible ? 'animate-pulse' : ''}`} />
                    <span>
                      {isAutoHealEligible
                        ? `CRITICAL SHORTFALL DETECTED (ICR: ${autoHealCurrentICR.toFixed(1)}% < 150%). Auto-Heal is armed to reclaim unvested buffer and restore Trove health.`
                        : `TROVE SHIELD ACTIVE (ICR: ${autoHealCurrentICR > 0 ? autoHealCurrentICR.toFixed(1) : (ltvNumeric > 0 ? (10000 / ltvNumeric).toFixed(1) : '∞')}% >= 150%). Position is healthy. Auto-Heal stands by to intercept drops.`}
                    </span>
                  </div>
                  <span className="font-bold shrink-0 uppercase tracking-wider text-[11px] px-2.5 py-1 rounded bg-white/60">
                    {isAutoHealEligible ? 'Action Required' : 'Shield Armed'}
                  </span>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#F6F4EF] p-4 rounded-xl border border-[#DEDBD3] space-y-1">
                    <span className="text-xs font-mono text-[#77756F]">160% Target Recovery Deficit</span>
                    <div className="text-lg font-mono font-bold text-[#171715]">
                      {debtToRestoreEth > 0 ? `${debtToRestoreEth.toFixed(2)} MUSD` : '0.00 MUSD'}
                    </div>
                    <span className="text-[11px] text-[#77756F] block">Debt repayment needed to reach 160% ICR</span>
                  </div>

                  <div className="bg-[#F6F4EF] p-4 rounded-xl border border-[#DEDBD3] space-y-1">
                    <span className="text-xs font-mono text-[#77756F]">Unvested Escrow Buffer</span>
                    <div className="text-lg font-mono font-bold text-[#258454]">
                      {unvestedBufferEth.toFixed(2)} MUSD
                    </div>
                    <span className="text-[11px] text-[#77756F] block">Available in Stream #{streamIdForAutoHeal}</span>
                  </div>

                  <div className="bg-[#F6F4EF] p-4 rounded-xl border border-[#DEDBD3] space-y-1">
                    <span className="text-xs font-mono text-[#77756F]">Worker Salary Protection</span>
                    <div className="text-lg font-mono font-bold text-[#171715]">100% Inviolable</div>
                    <span className="text-[11px] text-[#77756F] block">Vested salary cannot be seized or liquidated</span>
                  </div>
                </div>

                {/* Auto-Heal Execution Form */}
                <form onSubmit={handleAutoHealTrove} className="bg-[#F6F4EF] p-5 rounded-xl border border-[#DEDBD3] space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
                    <label className="font-bold text-[#171715]">
                      Configure Linked Escrow Stream for Protection:
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[#77756F]">Select Stream ID:</span>
                      <input
                        type="number"
                        min="0"
                        value={streamIdForAutoHeal}
                        onChange={(e) => setStreamIdForAutoHeal(e.target.value)}
                        className="w-16 bg-[#FBFAF7] border border-[#DEDBD3] rounded-lg px-2 py-1 text-xs font-mono text-[#171715] focus:outline-none focus:border-[#E66C35]"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-[#77756F] leading-relaxed">
                    When triggered, the contract reclaims only the required deficit from Stream #{streamIdForAutoHeal}'s unvested buffer to repay vault and Mezo Trove debt. 
                    Employee earned earnings remain intact, and collateral is safeguarded from keeper liquidation discounts.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="submit"
                      disabled={!isReady || (vaultPending && activeAction === 'auto_heal_trove') || (!isAutoHealEligible && debtEth === 0)}
                      className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-2 ${
                        isAutoHealEligible
                          ? 'bg-[#C7473A] hover:bg-red-700 text-white shadow-md animate-pulse cursor-pointer'
                          : 'bg-[#171715] hover:bg-[#E66C35] text-white cursor-pointer'
                      } disabled:opacity-50`}
                    >
                      <Shield className="w-4 h-4" />
                      <span>
                        {(vaultPending || txStatus === 'wallet_confirm') && activeAction === 'auto_heal_trove'
                          ? 'Auto-Healing Trove...'
                          : isAutoHealEligible
                          ? 'Execute Auto-Heal Now (Defend Trove)'
                          : 'Trigger Auto-Heal (Simulate Protection)'}
                      </span>
                    </button>
                    {!isAutoHealEligible && (
                      <span className="text-[11px] font-mono text-[#77756F]">
                        ● Position currently safe. Automatically triggers if ICR drops below 150%.
                      </span>
                    )}
                  </div>
                </form>
              </div>

              {/* CARD 4: SELF-REPAYING CREDIT ENGINE (High Finding 2 Fix) */}
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl lg:col-span-2 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#DEDBD3] pb-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-[#E66C35]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715]">Self-Repaying Credit Engine</h3>
                  </div>
                  <div className="text-xs font-mono text-[#77756F]">
                    Unamortized Yield Balance: <strong className="text-[#258454]">{mounted && yieldBalance ? Number(formatEther(yieldBalance as bigint)).toLocaleString() : '0'} MUSD</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Deposit Yield */}
                  <form onSubmit={handleDepositYield} className="space-y-3 bg-[#F6F4EF] p-5 rounded-xl border border-[#DEDBD3]">
                    <div className="flex justify-between items-center text-xs font-mono text-[#77756F]">
                      <label className="font-bold text-[#171715]">Deposit Yield / Reserve</label>
                      <span>MUSD: {mounted && musdBalance ? Number(formatEther(musdBalance as bigint)).toLocaleString() : '0'}</span>
                    </div>
                    <p className="text-[11px] text-[#77756F]">Deposit MUSD to fund automated debt amortization.</p>
                    <input
                      type="number"
                      step="1"
                      value={yieldDepositAmount}
                      onChange={(e) => setYieldDepositAmount(e.target.value)}
                      placeholder="Amount to deposit"
                      className="w-full bg-[#FBFAF7] border border-[#DEDBD3] rounded-xl px-4 py-2 text-[#171715] font-mono text-xs focus:outline-none focus:border-[#E66C35]"
                    />
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleApprove('musd', 'creditEngine', yieldDepositAmount || '5000')}
                        disabled={(genericPending && activeAction === 'approve_yield') || !isReady}
                        className={`flex-1 font-semibold py-2 rounded-lg text-xs transition-colors ${
                          isCreditEngineApproved
                            ? 'bg-[#258454]/10 border border-[#258454]/40 text-[#258454]'
                            : 'bg-[#E66C35] text-white'
                        } disabled:opacity-50`}
                      >
                        {isCreditEngineApproved ? '✓ Approved' : '1. Approve'}
                      </button>
                      <button
                        type="submit"
                        disabled={(genericPending && activeAction === 'deposit_yield') || !isReady || !yieldDepositAmount || Number(yieldDepositAmount) <= 0 || !isCreditEngineApproved}
                        className="flex-1 bg-[#171715] hover:bg-[#E66C35] text-white font-semibold py-2 rounded-lg text-xs transition-colors disabled:opacity-50"
                      >
                        {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'deposit_yield' ? 'Depositing...' : '2. Deposit'}
                      </button>
                    </div>
                  </form>

                  {/* Withdraw Yield (High Finding 2 Fix) */}
                  <form onSubmit={handleWithdrawYield} className="space-y-3 bg-[#F6F4EF] p-5 rounded-xl border border-[#DEDBD3]">
                    <div className="flex justify-between items-center text-xs font-mono text-[#77756F]">
                      <label className="font-bold text-[#171715]">Reclaim Unamortized Yield</label>
                      <span>Available: {mounted && yieldBalance ? Number(formatEther(yieldBalance as bigint)).toLocaleString() : '0'}</span>
                    </div>
                    <p className="text-[11px] text-[#77756F]">Withdraw unused yield back to your wallet at any time.</p>
                    <input
                      type="number"
                      step="1"
                      value={yieldWithdrawAmount}
                      onChange={(e) => setYieldWithdrawAmount(e.target.value)}
                      placeholder="Amount to withdraw"
                      className="w-full bg-[#FBFAF7] border border-[#DEDBD3] rounded-xl px-4 py-2 text-[#171715] font-mono text-xs focus:outline-none focus:border-[#E66C35]"
                    />
                    <button
                      type="submit"
                      disabled={(genericPending && activeAction === 'withdraw_yield') || !isReady || !yieldWithdrawAmount || Number(yieldWithdrawAmount) <= 0}
                      className="w-full bg-[#171715] hover:bg-[#E66C35] text-white font-semibold py-2 rounded-lg text-xs transition-colors disabled:opacity-50"
                    >
                      {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'withdraw_yield' ? 'Withdrawing...' : 'Reclaim Yield to Wallet'}
                    </button>
                  </form>

                  {/* Amortize Debt */}
                  <form onSubmit={handleAmortizeDebt} className="space-y-3 bg-[#F6F4EF] p-5 rounded-xl border border-[#DEDBD3]">
                    <div className="flex justify-between items-center text-xs font-mono text-[#77756F]">
                      <label className="font-bold text-[#171715]">Amortize Active Debt</label>
                      <span>Debt: {debtEth.toLocaleString()} MUSD</span>
                    </div>
                    <p className="text-[11px] text-[#77756F]">Apply deposited yield balance to pay down loan principal.</p>
                    <input
                      type="number"
                      step="1"
                      value={amortizeAmount}
                      onChange={(e) => setAmortizeAmount(e.target.value)}
                      placeholder="Amount to amortize"
                      className="w-full bg-[#FBFAF7] border border-[#DEDBD3] rounded-xl px-4 py-2 text-[#171715] font-mono text-xs focus:outline-none focus:border-[#258454]"
                    />
                    <button
                      type="submit"
                      disabled={(genericPending && activeAction === 'amortize') || !isReady || debtEth <= 0 || !yieldBalance || !amortizeAmount || Number(amortizeAmount) <= 0}
                      className="w-full bg-[#258454] hover:opacity-90 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-xs transition-colors"
                    >
                      {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'amortize' ? 'Amortizing...' : 'Amortize Vault Debt'}
                    </button>
                  </form>
                </div>
              </div>

              {/* CARD 5: KEEPER LIQUIDATION ENGINE (High Finding 3 Fix) */}
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl lg:col-span-2 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-[#DEDBD3] pb-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-[#C7473A]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715]">Keeper Liquidation Console</h3>
                  </div>
                  <span className="text-xs font-mono bg-[#258454]/10 text-[#258454] px-3 py-1 rounded font-bold">
                    +5% Collateral Bonus for Liquidators
                  </span>
                </div>

                <p className="text-xs text-[#77756F] leading-relaxed">
                  Anyone or any automated keeper bot can liquidate positions exceeding the 75% LTV threshold. 
                  Liquidators repay the borrower's MUSD debt and seize the underlying Bitcoin collateral at a 5% discount (instant 5% profit).
                </p>

                <form onSubmit={handleLiquidate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-[#F6F4EF] p-5 rounded-xl border border-[#DEDBD3]">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-mono text-[#77756F]">Borrower Address to Liquidate</label>
                    <input
                      type="text"
                      value={liquidateUser}
                      onChange={(e) => setLiquidateUser(e.target.value)}
                      placeholder="0x... borrower account"
                      className="w-full bg-[#FBFAF7] border border-[#DEDBD3] rounded-xl px-4 py-2.5 text-[#171715] font-mono text-xs focus:outline-none focus:border-[#C7473A]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-[#77756F]">Debt to Repay (MUSD)</label>
                    <input
                      type="number"
                      step="1"
                      value={liquidateDebtAmount}
                      onChange={(e) => setLiquidateDebtAmount(e.target.value)}
                      placeholder="1000"
                      className="w-full bg-[#FBFAF7] border border-[#DEDBD3] rounded-xl px-4 py-2.5 text-[#171715] font-mono text-xs focus:outline-none focus:border-[#C7473A]"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-mono text-[#77756F]">
                      <input
                        type="checkbox"
                        id="seizeNative"
                        checked={liquidateSeizeNative}
                        onChange={(e) => setLiquidateSeizeNative(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="seizeNative">Seize Native BTC</label>
                    </div>
                    <button
                      type="submit"
                      disabled={(vaultPending && activeAction === 'liquidate') || !isReady || !liquidateUser || !liquidateDebtAmount}
                      className="w-full bg-[#C7473A] hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50"
                    >
                      {(vaultPending || txStatus === 'wallet_confirm') && activeAction === 'liquidate' ? 'Liquidating...' : 'Execute Liquidation'}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: PAYROLL STREAMER */}
        {activeTab === 'payroll' && (
          <div className="space-y-8 animate-fadeIn">
            {mounted && !isConnected && (
              <div className="bg-[#FBFAF7] border border-[#E66C35]/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#E66C35]/10 text-[#E66C35] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif-display text-lg font-bold text-[#171715]">Connect Wallet to Stream Payroll</h4>
                    <p className="text-xs text-[#77756F]">Choose your preferred wallet to create second-by-second MUSD salary streams on Mezo.</p>
                  </div>
                </div>
                <button
                  onClick={handleOpenConnectWallet}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#171715] hover:bg-[#E66C35] text-white text-xs font-semibold rounded-xl transition-all shrink-0 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Select & Connect Wallet</span>
                </button>
              </div>
            )}
            <div className="border-b border-[#DEDBD3] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-serif-display font-bold text-[#171715]">MUSD Payroll Streamer</h2>
                <p className="text-xs text-[#77756F] mt-1">
                  Second-by-second linear escrow streaming of official testnet MUSD stablecoins backed by Bitcoin.
                </p>
              </div>
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] px-3.5 py-2 rounded-xl text-xs font-mono">
                <span className="text-[#77756F]">Available MUSD: </span>
                <strong className="text-[#258454]">{mounted && musdBalance ? Number(formatEther(musdBalance as bigint)).toLocaleString() : '0'} MUSD</strong>
              </div>
            </div>

            <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-5 rounded-2xl flex items-start space-x-3.5 text-xs font-mono shadow-sm">
              <div className="bg-[#E66C35]/10 p-2 rounded-xl text-[#E66C35] shrink-0 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="font-bold text-[#171715] text-sm">How Second-by-Second Streaming Works</p>
                <p className="text-[#77756F] leading-relaxed">
                  When you create a stream, deposited <strong>MUSD</strong> is held in the non-custodial <strong>PayrollStreamer</strong> contract.
                  Funds unlock smoothly second-by-second into the recipient's claimable balance. 
                  The employee can withdraw anytime via <strong>"Claim Earned MUSD"</strong>, while the employer maintains full top-up and revocation controls with unearned refund splits.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Create Stream Form */}
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715] mb-2 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[#E66C35]" />
                    <span>Create MUSD Salary Stream</span>
                  </h3>
                  <p className="text-xs text-[#77756F] mb-6">Deposit MUSD for continuous linear vesting.</p>
                  
                  <form onSubmit={handleCreateStream} className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-mono text-[#77756F]">Recipient Address</label>
                        {address && (
                          <button
                            type="button"
                            onClick={() => setRecipient(address)}
                            className="text-[11px] font-mono text-[#E66C35] hover:underline"
                          >
                            Use Connected Wallet
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder="0x... recipient address"
                        className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-xs focus:outline-none focus:border-[#E66C35]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-[#77756F] block mb-1">Deposit Amount (MUSD)</label>
                      <input
                        type="number"
                        step="1"
                        value={streamDeposit}
                        onChange={(e) => setStreamDeposit(e.target.value)}
                        placeholder="1000"
                        className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#E66C35]"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-mono text-[#77756F]">Duration (Seconds)</label>
                        <div className="flex space-x-1 text-[10px] font-mono">
                          <button
                            type="button"
                            onClick={() => setDuration('3600')}
                            className="px-1.5 py-0.5 rounded bg-[#DEDBD3]/40 hover:bg-[#DEDBD3] text-[#171715]"
                          >
                            1h
                          </button>
                          <button
                            type="button"
                            onClick={() => setDuration('86400')}
                            className="px-1.5 py-0.5 rounded bg-[#DEDBD3]/40 hover:bg-[#DEDBD3] text-[#171715]"
                          >
                            1d
                          </button>
                          <button
                            type="button"
                            onClick={() => setDuration('2592000')}
                            className="px-1.5 py-0.5 rounded bg-[#DEDBD3]/40 hover:bg-[#DEDBD3] text-[#171715]"
                          >
                            30d
                          </button>
                        </div>
                      </div>
                      <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="3600 (1 hour)"
                        className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#E66C35]"
                      />
                    </div>

                    {Number(streamDeposit) > 0 && Number(duration) > 0 && (
                      <div className="text-[11px] font-mono text-[#77756F] bg-[#F6F4EF] p-2.5 rounded-xl border border-[#DEDBD3] flex justify-between">
                        <span>Streaming Rate:</span>
                        <span className="text-[#171715] font-semibold">
                          {(Number(streamDeposit) / Number(duration)).toFixed(6)} MUSD / sec
                        </span>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleApprove('musd', 'streamer', streamDeposit || '1000')}
                        disabled={(genericPending && activeAction === 'approve_stream') || !isReady}
                        className={`flex-1 font-semibold py-3 rounded-xl text-xs transition-colors ${
                          isStreamerApproved
                            ? 'bg-[#258454]/10 border border-[#258454]/40 text-[#258454]'
                            : 'bg-[#E66C35] text-white animate-pulse'
                        } disabled:opacity-50`}
                      >
                        {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'approve_stream'
                          ? 'Approving...'
                          : isStreamerApproved
                          ? '✓ MUSD Approved'
                          : '1. Approve MUSD'}
                      </button>
                      <button
                        type="submit"
                        disabled={
                          (streamerPending && activeAction === 'create_stream') ||
                          !isReady ||
                          !recipient ||
                          !streamDeposit ||
                          !duration ||
                          !isStreamerApproved
                        }
                        className="flex-1 bg-[#171715] hover:bg-[#E66C35] text-white font-semibold py-3 rounded-xl text-xs transition-colors disabled:opacity-50"
                      >
                        {(streamerPending || txStatus === 'wallet_confirm') && activeAction === 'create_stream' ? 'Creating...' : '2. Create Stream'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Stream Management */}
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715]">Stream Management</h3>
                    <div className="flex items-center space-x-1.5">
                      <label className="text-xs font-mono text-[#77756F]">Stream ID:</label>
                      <input
                        type="number"
                        min="0"
                        value={streamIdToManage}
                        onChange={(e) => setStreamIdToManage(e.target.value)}
                        className="w-16 bg-[#F6F4EF] border border-[#DEDBD3] rounded-lg px-2 py-1 text-xs font-mono text-[#171715] focus:outline-none focus:border-[#E66C35]"
                      />
                    </div>
                  </div>

                  {streamExists ? (
                    <div className="space-y-4">
                      <div className="bg-[#F6F4EF] p-4 rounded-xl border border-[#DEDBD3] space-y-3 font-mono text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#77756F]">Status:</span>
                          <span className={`font-bold ${streamIsActive ? 'text-[#258454]' : 'text-[#C7473A]'}`}>
                            {streamIsActive ? '● Streaming (Active)' : '○ Completed / Cancelled'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#77756F]">Employer:</span>
                          <span className="text-[#171715]">{formatAddress(streamEmployer)} {isCurrentUserEmployer ? '(You)' : ''}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#77756F]">Recipient:</span>
                          <span className="text-[#171715]">{formatAddress(streamRecipient)} {isCurrentUserRecipient ? '(You)' : ''}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#77756F]">Total Deposited:</span>
                          <span className="font-bold text-[#171715]">{streamDepositAmount.toLocaleString()} MUSD</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#77756F]">Claimable Now:</span>
                          <span className="font-bold text-[#258454]">{claimableEth.toFixed(4)} MUSD</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[11px] text-[#77756F]">
                            <span>Vesting Progress</span>
                            <span>{streamProgressPercent}%</span>
                          </div>
                          <div className="w-full bg-[#DEDBD3] h-2.5 rounded-full overflow-hidden">
                            <div className="bg-[#258454] h-full rounded-full transition-all duration-500" style={{ width: `${streamProgressPercent}%` }}></div>
                          </div>
                        </div>
                      </div>

                      {/* Wave 2: Stream-to-Debt Amortization Split Configuration */}
                      <div className="bg-[#F6F4EF] p-4 rounded-xl border border-[#DEDBD3] space-y-3 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#171715] flex items-center space-x-1.5">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-[#E66C35]" />
                            <span>Stream-to-Debt Amortization</span>
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              isSplitEnabled && currentSplitBps > 0
                                ? 'bg-[#258454]/15 text-[#258454]'
                                : 'bg-[#77756F]/15 text-[#77756F]'
                            }`}
                          >
                            {isSplitEnabled && currentSplitBps > 0
                              ? `${(currentSplitBps / 100).toFixed(0)}% Auto-Repay Active`
                              : 'Split Inactive'}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#77756F] leading-relaxed">
                          Recipients can automatically allocate up to 50% of claimed salary to amortize vault debt (theirs or their employer's), lowering liquidation risk on every paycheck.
                        </p>

                        {isCurrentUserRecipient && streamIsActive ? (
                          <form onSubmit={handleSetStreamSplit} className="space-y-3 pt-2 border-t border-[#DEDBD3]">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[11px]">
                                <label className="text-[#77756F]">Amortization Split %</label>
                                <div className="flex space-x-1">
                                  {['0', '10', '20', '30', '50'].map((p) => (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() => setSplitPercent(p)}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        splitPercent === p ? 'bg-[#171715] text-white' : 'bg-[#DEDBD3]/50 text-[#171715]'
                                      }`}
                                    >
                                      {p}%
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="50"
                                step="5"
                                value={splitPercent}
                                onChange={(e) => setSplitPercent(e.target.value)}
                                className="w-full accent-[#E66C35] cursor-pointer"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[11px]">
                                <label className="text-[#77756F]">Target Borrower Account</label>
                                {streamEmployer && (
                                  <button
                                    type="button"
                                    onClick={() => setSplitTargetBorrower(streamEmployer)}
                                    className="text-[#E66C35] hover:underline"
                                  >
                                    Use Employer ({formatAddress(streamEmployer)})
                                  </button>
                                )}
                              </div>
                              <input
                                type="text"
                                value={splitTargetBorrower}
                                onChange={(e) => setSplitTargetBorrower(e.target.value)}
                                placeholder={address ? `Default: ${formatAddress(address)} (You)` : '0x... borrower account'}
                                className="w-full bg-[#FBFAF7] border border-[#DEDBD3] rounded-lg px-3 py-1.5 text-xs font-mono text-[#171715] focus:outline-none focus:border-[#E66C35]"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={(streamerPending && activeAction === 'set_stream_split') || !isReady}
                              className="w-full bg-[#171715] hover:bg-[#E66C35] text-white font-semibold py-2 rounded-lg text-xs transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {(streamerPending || txStatus === 'wallet_confirm') && activeAction === 'set_stream_split'
                                ? 'Configuring Split...'
                                : `Save ${splitPercent}% Debt Amortization Split`}
                            </button>
                          </form>
                        ) : (
                          <div className="text-[11px] text-[#77756F]">
                            {isSplitEnabled && currentSplitBps > 0 ? (
                              <p>
                                Current Split: <strong>{(currentSplitBps / 100).toFixed(0)}%</strong> of claim will automatically repay debt for{' '}
                                <strong className="text-[#171715]">{formatAddress(currentSplitTarget)}</strong>.
                              </p>
                            ) : (
                              <p>No debt amortization split configured for this stream.</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Recipient Claim Action */}
                      {isCurrentUserRecipient && streamIsActive && (
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={handleWithdrawStream}
                            disabled={(streamerPending && activeAction === 'withdraw_stream') || !isReady || claimableEth <= 0}
                            className="w-full bg-[#258454] hover:opacity-90 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {(streamerPending || txStatus === 'wallet_confirm') && activeAction === 'withdraw_stream'
                              ? 'Claiming...'
                              : isSplitEnabled && currentSplitBps > 0
                              ? `Claim Earned MUSD (${((claimableEth * (10000 - currentSplitBps)) / 10000).toFixed(4)} Wallet + ${((claimableEth * currentSplitBps) / 10000).toFixed(4)} Debt)`
                              : `Claim Earned MUSD (${claimableEth.toFixed(4)} Available)`}
                          </button>
                          {isSplitEnabled && currentSplitBps > 0 && claimableEth > 0 && (
                            <p className="text-[10px] text-center font-mono text-[#77756F]">
                              ✓ Automatic closed loop: {((claimableEth * currentSplitBps) / 10000).toFixed(4)} MUSD amortizes debt for {formatAddress(currentSplitTarget)} on-chain.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Employer Top Up */}
                      {isCurrentUserEmployer && streamIsActive && (
                        <form onSubmit={handleTopUpStream} className="flex space-x-2">
                          <input
                            type="number"
                            step="1"
                            value={topUpAmount}
                            onChange={(e) => setTopUpAmount(e.target.value)}
                            placeholder="Add MUSD"
                            className="flex-1 bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-3 py-2 text-xs font-mono text-[#171715] focus:outline-none focus:border-[#E66C35]"
                          />
                          <button
                            type="submit"
                            disabled={(streamerPending && activeAction === 'top_up_stream') || !isReady || !topUpAmount || Number(topUpAmount) <= 0}
                            className="bg-[#171715] hover:bg-[#E66C35] text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors disabled:opacity-50"
                          >
                            {(streamerPending || txStatus === 'wallet_confirm') && activeAction === 'top_up_stream' ? 'Adding...' : 'Top Up'}
                          </button>
                        </form>
                      )}

                      {/* Cancel Stream */}
                      {(isCurrentUserEmployer || isCurrentUserRecipient) && streamIsActive && (
                        <button
                          type="button"
                          onClick={handleCancelStream}
                          disabled={(streamerPending && activeAction === 'cancel_stream') || !isReady}
                          className="w-full bg-[#C7473A]/10 hover:bg-[#C7473A]/20 border border-[#C7473A]/30 text-[#C7473A] font-semibold py-2 rounded-xl text-xs transition-colors"
                        >
                          {(streamerPending || txStatus === 'wallet_confirm') && activeAction === 'cancel_stream'
                            ? 'Revoking...'
                            : 'Cancel Stream (Earned to Recipient, Balance to Employer)'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="bg-[#F6F4EF] p-8 rounded-xl border border-[#DEDBD3] text-center space-y-2">
                      <p className="text-xs font-mono text-[#77756F]">Stream #{streamIdToManage} not yet initialized on Mezo L2.</p>
                      <p className="text-[11px] text-[#77756F]">Create a new stream on the left or enter an active Stream ID.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MEZO GOVERNANCE STAKING HUB (Wave 2 Task 2) */}
        {activeTab === 'staking' && (
          <div className="space-y-8 animate-fadeIn">
            {mounted && !isConnected && (
              <div className="bg-[#FBFAF7] border border-[#E66C35]/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#E66C35]/10 text-[#E66C35] flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif-display text-lg font-bold text-[#171715]">Connect Wallet to Stake MEZO</h4>
                    <p className="text-xs text-[#77756F]">Connect your wallet to lock MEZO tokens, lower vault borrowing fees, and earn protocol revenue.</p>
                  </div>
                </div>
                <button
                  onClick={handleOpenConnectWallet}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#171715] hover:bg-[#E66C35] text-white text-xs font-semibold rounded-xl transition-all shrink-0 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Select & Connect Wallet</span>
                </button>
              </div>
            )}

            {/* Header Title & Top Metrics */}
            <div className="border-b border-[#DEDBD3] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-3xl font-serif-display font-bold text-[#171715]">MEZO Governance Staking Boost</h2>
                  <span className="text-[10px] font-mono bg-[#E66C35]/15 text-[#E66C35] px-2 py-0.5 rounded-full font-bold">
                    Dual-Token Utility
                  </span>
                </div>
                <p className="text-xs text-[#77756F] mt-1">
                  Lock official MEZO tokens to slash vault borrow fees up to 50%, boost keeper liquidation bonuses, and claim pro-rata MUSD dividends.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <div className="bg-[#FBFAF7] border border-[#DEDBD3] px-3.5 py-2 rounded-xl">
                  <span className="text-[#77756F]">Wallet MEZO: </span>
                  <strong className="text-[#171715]">{mounted ? mezoBalanceEth.toFixed(2) : '0.00'}</strong>
                </div>
                <div className="bg-[#FBFAF7] border border-[#DEDBD3] px-3.5 py-2 rounded-xl">
                  <span className="text-[#77756F]">Your Staked: </span>
                  <strong className="text-[#E66C35]">{mounted ? userStakedMezo.toFixed(2) : '0.00'}</strong>
                </div>
                <div className="bg-[#FBFAF7] border border-[#DEDBD3] px-3.5 py-2 rounded-xl">
                  <span className="text-[#77756F]">Total Staked: </span>
                  <strong className="text-[#258454]">{mounted ? totalStakedMezo.toFixed(2) : '0.00'}</strong>
                </div>
              </div>
            </div>

            {/* User Tier Status Hero Card */}
            <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-6 rounded-2xl shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                      currentTierName === 'Gold'
                        ? 'bg-amber-500/15 text-amber-700 border border-amber-500/30'
                        : currentTierName === 'Silver'
                        ? 'bg-slate-400/20 text-slate-800 border border-slate-400/30'
                        : currentTierName === 'Bronze'
                        ? 'bg-orange-600/15 text-orange-700 border border-orange-600/30'
                        : 'bg-[#171715]/10 text-[#171715] border border-[#171715]/20'
                    }`}
                  >
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-[#77756F]">Active Staking Tier</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          currentTierName === 'Gold'
                            ? 'bg-amber-500/20 text-amber-700'
                            : currentTierName === 'Silver'
                            ? 'bg-slate-400/25 text-slate-800'
                            : currentTierName === 'Bronze'
                            ? 'bg-orange-600/20 text-orange-700'
                            : 'bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        {currentTierName} Tier
                      </span>
                    </div>
                    <h3 className="text-xl font-serif-display font-bold text-[#171715]">
                      {currentTierName === 'Gold'
                        ? 'Gold Member (Max 50% Borrow Discount + 2.5% Keeper Boost)'
                        : currentTierName === 'Silver'
                        ? 'Silver Member (30% Borrow Discount + 1.0% Keeper Boost)'
                        : currentTierName === 'Bronze'
                        ? 'Bronze Member (15% Vault Borrowing Discount)'
                        : 'Standard Tier (Stake MEZO to Unlock Fee Discounts)'}
                    </h3>
                  </div>
                </div>

                <div className="text-right text-xs font-mono">
                  <span className="text-[#77756F] block">Next Tier Target:</span>
                  <strong className="text-[#171715]">
                    {userStakedMezo < 100
                      ? `${(100 - userStakedMezo).toFixed(0)} MEZO to Bronze`
                      : userStakedMezo < 500
                      ? `${(500 - userStakedMezo).toFixed(0)} MEZO to Silver`
                      : userStakedMezo < 2500
                      ? `${(2500 - userStakedMezo).toFixed(0)} MEZO to Gold`
                      : 'Max Tier Achieved'}
                  </strong>
                </div>
              </div>

              {/* Tier Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-[#77756F]">
                  <span>Tier Progression</span>
                  <span>{userStakedMezo.toFixed(0)} / 2,500 MEZO</span>
                </div>
                <div className="w-full bg-[#DEDBD3] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#E66C35] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((userStakedMezo / 2500) * 100))}%` }}
                  />
                </div>
              </div>

              {/* 3 Active Benefit Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-[#F6F4EF] p-4 rounded-xl border border-[#DEDBD3] space-y-1 font-mono">
                  <span className="text-xs text-[#77756F]">Borrow Fee Discount</span>
                  <div className="text-xl font-bold text-[#258454]">{feeDiscountPercent.toFixed(1)}% OFF</div>
                  <span className="text-[11px] text-[#77756F] block">Deducted from base 0.50% vault fee</span>
                </div>

                <div className="bg-[#F6F4EF] p-4 rounded-xl border border-[#DEDBD3] space-y-1 font-mono">
                  <span className="text-xs text-[#77756F]">Keeper Bonus Boost</span>
                  <div className="text-xl font-bold text-[#E66C35]">+{keeperBoostPercent.toFixed(1)}% EXTRA</div>
                  <span className="text-[11px] text-[#77756F] block">Total {5 + keeperBoostPercent}% liquidation profit</span>
                </div>

                <div className="bg-[#F6F4EF] p-4 rounded-xl border border-[#DEDBD3] space-y-1 font-mono">
                  <span className="text-xs text-[#77756F]">Accrued MUSD Dividends</span>
                  <div className="text-xl font-bold text-[#171715]">{earnedRewardsEth.toFixed(4)} MUSD</div>
                  <span className="text-[11px] text-[#77756F] block">Pro-rata share of vault origination fees</span>
                </div>
              </div>
            </div>

            {/* Interactive 2-Column Console */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* COLUMN 1: STAKE / UNSTAKE ACTIONS */}
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-[#DEDBD3] pb-3">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-[#E66C35]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715]">Staking Console</h3>
                  </div>
                  <div className="flex space-x-1 bg-[#DEDBD3]/40 p-1 rounded-lg text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setStakingTab('stake')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        stakingTab === 'stake' ? 'bg-[#171715] text-white shadow-xs' : 'text-[#77756F] hover:text-[#171715]'
                      }`}
                    >
                      Stake
                    </button>
                    <button
                      type="button"
                      onClick={() => setStakingTab('unstake')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        stakingTab === 'unstake' ? 'bg-[#171715] text-white shadow-xs' : 'text-[#77756F] hover:text-[#171715]'
                      }`}
                    >
                      Unstake (Cooldown)
                    </button>
                  </div>
                </div>

                {stakingTab === 'stake' ? (
                  <form onSubmit={handleStakeMEZO} className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <label className="font-bold text-[#171715]">Amount of MEZO to Stake</label>
                      <span className="text-[#77756F]">Available: {mezoBalanceEth.toFixed(2)} MEZO</span>
                    </div>

                    <input
                      type="number"
                      step="1"
                      value={mezoStakeAmount}
                      onChange={(e) => setMezoStakeAmount(e.target.value)}
                      placeholder="e.g. 500 MEZO for Silver Tier"
                      className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#E66C35]"
                    />

                    {/* Quick Preset Buttons */}
                    <div className="flex space-x-2 text-xs font-mono">
                      {[
                        { label: '100 (Bronze)', val: '100' },
                        { label: '500 (Silver)', val: '500' },
                        { label: '2,500 (Gold)', val: '2500' },
                        { label: 'Max', val: mezoBalanceEth.toString() },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setMezoStakeAmount(preset.val)}
                          className="flex-1 bg-[#F6F4EF] hover:bg-[#DEDBD3] border border-[#DEDBD3] py-1.5 rounded-lg text-[11px] font-semibold text-[#171715] transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleApprove('mezo', 'stakingBoost', mezoStakeAmount || '500')}
                        disabled={(genericPending && activeAction === 'approve_mezo') || !isReady}
                        className={`flex-1 font-semibold py-3 rounded-xl text-xs transition-colors ${
                          isMezoApproved
                            ? 'bg-[#258454]/10 border border-[#258454]/40 text-[#258454]'
                            : 'bg-[#E66C35] text-white animate-pulse'
                        } disabled:opacity-50`}
                      >
                        {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'approve_mezo'
                          ? 'Approving...'
                          : isMezoApproved
                          ? '✓ MEZO Approved'
                          : '1. Approve MEZO'}
                      </button>

                      <button
                        type="submit"
                        disabled={
                          (genericPending && activeAction === 'stake_mezo') ||
                          !isReady ||
                          !mezoStakeAmount ||
                          Number(mezoStakeAmount) <= 0 ||
                          !isMezoApproved
                        }
                        className="flex-1 bg-[#171715] hover:bg-[#E66C35] text-white font-semibold py-3 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'stake_mezo'
                          ? 'Staking...'
                          : '2. Stake MEZO'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <form onSubmit={handleInitiateUnstake} className="space-y-4">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <label className="font-bold text-[#171715]">Amount of MEZO to Unstake</label>
                        <span className="text-[#77756F]">Staked: {userStakedMezo.toFixed(2)} MEZO</span>
                      </div>

                      <input
                        type="number"
                        step="1"
                        value={mezoUnstakeAmount}
                        onChange={(e) => setMezoUnstakeAmount(e.target.value)}
                        placeholder="Amount to unbond"
                        className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#E66C35]"
                      />

                      <p className="text-[11px] font-mono text-[#77756F] leading-relaxed">
                        Notice: Unstaking triggers a <strong>2-day cooldown period</strong> to protect protocol stability. 
                        Funds in cooldown no longer earn fee discounts or revenue share.
                      </p>

                      <button
                        type="submit"
                        disabled={
                          (genericPending && activeAction === 'initiate_unstake') ||
                          !isReady ||
                          !mezoUnstakeAmount ||
                          Number(mezoUnstakeAmount) <= 0 ||
                          userStakedMezo < Number(mezoUnstakeAmount) ||
                          unbondingAmountEth > 0
                        }
                        className="w-full bg-[#171715] hover:bg-[#C7473A] text-white font-semibold py-3 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'initiate_unstake'
                          ? 'Initiating...'
                          : 'Initiate Unstake (Start 2-Day Cooldown)'}
                      </button>
                    </form>

                    {/* Pending Unbonding Status Box */}
                    {unbondingAmountEth > 0 && (
                      <div className="bg-[#F6F4EF] p-4 rounded-xl border border-[#DEDBD3] space-y-3 font-mono text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#171715]">Pending Unbonding Request</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isUnbondingReady ? 'bg-[#258454]/15 text-[#258454]' : 'bg-[#E66C35]/15 text-[#E66C35]'}`}>
                            {isUnbondingReady ? 'Ready to Claim' : 'In Cooldown'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#77756F]">Unbonding Amount:</span>
                          <strong>{unbondingAmountEth.toFixed(2)} MEZO</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#77756F]">Release Date:</span>
                          <span>{new Date(unbondingReleaseTime * 1000).toLocaleString()}</span>
                        </div>

                        <div className="flex space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={handleClaimUnstaked}
                            disabled={(genericPending && activeAction === 'claim_unstaked') || !isReady || !isUnbondingReady}
                            className="flex-1 bg-[#258454] hover:opacity-90 text-white font-semibold py-2 rounded-lg text-xs transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'claim_unstaked'
                              ? 'Claiming...'
                              : 'Claim to Wallet'}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelUnstake}
                            disabled={(genericPending && activeAction === 'cancel_unstake') || !isReady}
                            className="flex-1 bg-[#DEDBD3] hover:bg-[#FBFAF7] text-[#171715] font-semibold py-2 rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'cancel_unstake'
                              ? 'Restaking...'
                              : 'Cancel & Restake'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* COLUMN 2: REAL YIELD MUSD DIVIDENDS */}
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl shadow-sm flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center justify-between border-b border-[#DEDBD3] pb-3">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-[#258454]" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715]">MUSD Protocol Dividends</h3>
                    </div>
                    <span className="text-[10px] font-mono bg-[#258454]/15 text-[#258454] px-2 py-0.5 rounded font-bold">
                      Real Yield
                    </span>
                  </div>

                  <p className="text-xs text-[#77756F] leading-relaxed mt-4">
                    Borrowing fees collected across all active MezoFlow Vault positions are channelled directly into the staking reward accumulator. 
                    MEZO stakers earn non-inflationary MUSD stablecoins backed by Bitcoin without token dilution.
                  </p>

                  <div className="bg-[#F6F4EF] p-6 rounded-xl border border-[#DEDBD3] my-6 text-center space-y-2">
                    <span className="text-xs font-mono text-[#77756F] uppercase tracking-wider">Your Claimable Revenue Share</span>
                    <div className="text-4xl font-mono font-bold text-[#258454]">
                      {earnedRewardsEth.toFixed(4)} <span className="text-lg">MUSD</span>
                    </div>
                    <p className="text-[11px] font-mono text-[#77756F]">
                      Accrued from vault loan origination fees on Mezo L2
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClaimStakingRewards}
                  disabled={(genericPending && activeAction === 'claim_staking_rewards') || !isReady || earnedRewardsEth <= 0}
                  className="w-full bg-[#258454] hover:opacity-90 text-white font-semibold py-3.5 rounded-xl text-xs transition-all disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'claim_staking_rewards'
                    ? 'Claiming Dividends...'
                    : `Claim ${earnedRewardsEth.toFixed(4)} MUSD Dividends`}
                </button>
              </div>

            </div>

            {/* FULL WIDTH: TIER PERKS COMPARISON MATRIX */}
            <div className="bg-[#FBFAF7] border border-[#DEDBD3] rounded-2xl p-7 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715] flex items-center space-x-2">
                <Layers className="w-4 h-4 text-[#E66C35]" />
                <span>MEZO Staking Tier Matrix & Protocol Privileges</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#F6F4EF] border-b border-[#DEDBD3] text-[#77756F]">
                    <tr>
                      <th className="py-3 px-4">Tier</th>
                      <th className="py-3 px-4">MEZO Required</th>
                      <th className="py-3 px-4">Borrow Fee Discount</th>
                      <th className="py-3 px-4">Effective Vault Fee</th>
                      <th className="py-3 px-4">Keeper Liquidation Bonus</th>
                      <th className="py-3 px-4">Stream Cancellation Penalty</th>
                      <th className="py-3 px-4 text-right">Dividend Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DEDBD3]">
                    <tr className={currentTierName === 'Standard' ? 'bg-[#E66C35]/5 font-bold' : ''}>
                      <td className="py-3.5 px-4">Standard</td>
                      <td className="py-3.5 px-4">0 MEZO</td>
                      <td className="py-3.5 px-4 text-[#77756F]">0%</td>
                      <td className="py-3.5 px-4">0.50%</td>
                      <td className="py-3.5 px-4">5.0% (Standard)</td>
                      <td className="py-3.5 px-4">Standard Escrow Rules</td>
                      <td className="py-3.5 px-4 text-right">None</td>
                    </tr>
                    <tr className={currentTierName === 'Bronze' ? 'bg-[#E66C35]/5 font-bold' : ''}>
                      <td className="py-3.5 px-4 flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-orange-600" />
                        <span>Bronze</span>
                      </td>
                      <td className="py-3.5 px-4">100 MEZO</td>
                      <td className="py-3.5 px-4 text-[#258454]">15% Discount</td>
                      <td className="py-3.5 px-4">0.425%</td>
                      <td className="py-3.5 px-4">5.0%</td>
                      <td className="py-3.5 px-4">Standard Escrow Rules</td>
                      <td className="py-3.5 px-4 text-right text-[#258454]">Pro-Rata</td>
                    </tr>
                    <tr className={currentTierName === 'Silver' ? 'bg-[#E66C35]/5 font-bold' : ''}>
                      <td className="py-3.5 px-4 flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span>Silver</span>
                      </td>
                      <td className="py-3.5 px-4">500 MEZO</td>
                      <td className="py-3.5 px-4 text-[#258454]">30% Discount</td>
                      <td className="py-3.5 px-4">0.350%</td>
                      <td className="py-3.5 px-4 text-[#E66C35]">6.0% (+1.0% Boost)</td>
                      <td className="py-3.5 px-4">Standard Escrow Rules</td>
                      <td className="py-3.5 px-4 text-right text-[#258454]">Pro-Rata</td>
                    </tr>
                    <tr className={currentTierName === 'Gold' ? 'bg-[#E66C35]/5 font-bold' : ''}>
                      <td className="py-3.5 px-4 flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-amber-700">Gold</span>
                      </td>
                      <td className="py-3.5 px-4 text-amber-700 font-bold">2,500 MEZO</td>
                      <td className="py-3.5 px-4 text-[#258454] font-bold">50% Max Discount</td>
                      <td className="py-3.5 px-4 font-bold">0.250%</td>
                      <td className="py-3.5 px-4 text-[#E66C35] font-bold">7.5% (+2.5% Boost)</td>
                      <td className="py-3.5 px-4 text-[#258454] font-bold">Zero Cancellation Fee</td>
                      <td className="py-3.5 px-4 text-right text-[#258454] font-bold">Max Pro-Rata Weight</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ON-CHAIN ACTIVITY */}
        {activeTab === 'activity' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-[#DEDBD3] pb-4">
              <div>
                <h2 className="text-3xl font-serif-display font-bold text-[#171715]">On-Chain Activity Records</h2>
                <p className="text-xs text-[#77756F] mt-1">Confirmed transactions on Mezo Testnet with real explorer links.</p>
              </div>
              {transactions.length > 0 && (
                <button
                  onClick={clearTransactionHistory}
                  className="text-xs font-mono text-[#77756F] hover:text-[#C7473A] transition-colors"
                >
                  Clear History
                </button>
              )}
            </div>

            {transactions.length === 0 ? (
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-12 rounded-2xl text-center space-y-3 font-mono text-xs text-[#77756F]">
                <Activity className="w-8 h-8 text-[#DEDBD3] mx-auto" />
                <p>No transactions recorded in this browser session.</p>
                <p className="text-[11px]">Deposits, borrows, repayments, streams, and liquidations will appear here in real time.</p>
              </div>
            ) : (
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#F6F4EF] border-b border-[#DEDBD3] text-[#77756F]">
                    <tr>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Amount / Reference</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4 text-right">Explorer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DEDBD3]">
                    {transactions.map((tx) => (
                      <tr key={tx.hash} className="hover:bg-[#F6F4EF]/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#171715]">{tx.type}</td>
                        <td className="py-3 px-4 text-[#77756F]">{tx.amount}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              tx.status === 'success'
                                ? 'bg-[#258454]/15 text-[#258454]'
                                : tx.status === 'failed'
                                ? 'bg-[#C7473A]/15 text-[#C7473A]'
                                : 'bg-[#E66C35]/15 text-[#E66C35]'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#77756F]">{tx.timestamp}</td>
                        <td className="py-3 px-4 text-right">
                          <a
                            href={`https://explorer.test.mezo.org/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#E66C35] hover:underline inline-flex items-center space-x-1"
                          >
                            <span>{formatAddress(tx.hash)}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#DEDBD3] bg-[#FBFAF7] py-8 text-xs font-mono text-[#77756F]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <span className="font-bold text-[#171715]">BitStreamfi</span> — Built for Akindo Hackathon Wave 2 on Mezo Network.
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <a href={`https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.vault}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#171715]">
              Vault Contract ↗
            </a>
            <a href={`https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.streamer}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#171715]">
              Streamer ↗
            </a>
            <a href={`https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.creditEngine}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#171715]">
              Credit Engine ↗
            </a>
            <a href={`https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.musd}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#171715]">
              Official MUSD ↗
            </a>
            <a href={`https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.tbtc}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#171715]">
              Test tBTC ↗
            </a>
          </div>
        </div>
      </footer>
      {/* WALLET SELECTION & DISCONNECT MODAL */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        initialMode={walletModalInitialMode}
      />
    </main>
  );
}
