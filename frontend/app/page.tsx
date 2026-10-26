'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, usePublicClient, useChainId, useSwitchChain, useBalance } from 'wagmi';
import { CONTRACT_ADDRESSES, MEZO_TESTNET_CHAIN_ID, VAULT_ABI, STREAMER_ABI, CREDIT_ENGINE_ABI, ERC20_ABI } from './contracts';
import { parseEther, formatEther, isAddress, createPublicClient, http } from 'viem';
import { mezoTestnet } from './providers';
import { Shield, Zap, DollarSign, Clock, Wallet, ArrowUpRight, PlusCircle, XCircle, X, Activity, ChevronRight, CheckCircle2, RefreshCw, AlertTriangle, ExternalLink, Layers } from 'lucide-react';

interface TransactionRecord {
  hash: string;
  type: string;
  amount: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'vault' | 'payroll' | 'activity'>('overview');
  const [animationPhase, setAnimationPhase] = useState(0);

  // Transaction history log state (persisted to localStorage across page reloads)
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  // Load persistent activity from localStorage
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
    setTransactions(prev => {
      const filtered = prev.filter(t => t.hash.toLowerCase() !== record.hash.toLowerCase());
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

  // Auto-dismiss failed or success toasts after 7 seconds
  useEffect(() => {
    if (txStatus === 'failed' || txStatus === 'success') {
      const timer = setTimeout(() => {
        setTxStatus('idle');
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [txStatus]);

  // Clean friendly error message parser
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
      return 'Borrow exceeds 60% Max LTV limit or insufficient collateral deposited.';
    }
    if (raw.includes('Position would be undercollateralized')) {
      return 'Withdrawal would cause vault position to be undercollateralized (>60% LTV).';
    }
    if (raw.includes('Transfer failed')) {
      return 'Contract has insufficient liquidity for this operation.';
    }
    const clean = raw.split('\n')[0].replace(/URL: https:\/\/.*/, '').replace(/Request Arguments:.*/, '').trim();
    return clean.slice(0, 140) || fallback;
  };

  // Granular Action State to prevent all buttons from rendering pending states simultaneously
  type ActiveAction =
    | 'idle'
    | 'deposit_collateral'
    | 'withdraw_collateral'
    | 'borrow_musd'
    | 'repay_musd'
    | 'approve_repay'
    | 'approve_yield'
    | 'deposit_yield'
    | 'amortize'
    | 'approve_stream'
    | 'create_stream'
    | 'top_up_stream'
    | 'withdraw_stream'
    | 'cancel_stream';

  const [activeAction, setActiveAction] = useState<ActiveAction>('idle');

  // Cycle animation for the precision machine
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Vault form states
  const [collateralAmount, setCollateralAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [yieldDepositAmount, setYieldDepositAmount] = useState('');
  const [amortizeAmount, setAmortizeAmount] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);

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

  // Reset active action when no mutations are pending
  useEffect(() => {
    if (!vaultPending && !streamerPending && !genericPending && txStatus !== 'wallet_confirm' && txStatus !== 'pending') {
      setActiveAction('idle');
    }
  }, [vaultPending, streamerPending, genericPending, txStatus]);

  // Read Vault Data
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

  // Token & Engine Balances
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

  // Derived Position Metrics (1 tBTC = $60,000, Max LTV = 60%)
  const collateralEth = userCollateral ? Number(formatEther(userCollateral as bigint)) : 0;
  const debtEth = userDebt ? Number(formatEther(userDebt as bigint)) : 0;
  const collateralValueUSD = collateralEth * 60000;
  const maxBorrowUSD = collateralValueUSD * 0.6;
  const availableBorrowUSD = Math.max(0, maxBorrowUSD - debtEth);
  const ltvNumeric = collateralValueUSD > 0 ? (debtEth / collateralValueUSD) * 100 : 0;
  const minCollateralRequiredUSD = debtEth / 0.6;
  const minCollateralRequiredEth = debtEth > 0 ? minCollateralRequiredUSD / 60000 : 0;
  const maxWithdrawableEth = Math.max(0, collateralEth - minCollateralRequiredEth);
  const ltvStatusColor = ltvNumeric > 55 ? 'text-[#C7473A]' : ltvNumeric > 45 ? 'text-[#B7791F]' : 'text-[#258454]';

  // Read Stream Data
  const { data: streamData, refetch: refetchStream } = useReadContract({
    address: CONTRACT_ADDRESSES.streamer,
    abi: STREAMER_ABI,
    functionName: 'streams',
    args: [BigInt(streamIdToManage || '0')],
  });

  // Read Total Streams Count
  const { data: rawNextStreamId, refetch: refetchNextStreamId } = useReadContract({
    address: CONTRACT_ADDRESSES.streamer,
    abi: STREAMER_ABI,
    functionName: 'nextStreamId',
  });
  const totalStreamsCount = rawNextStreamId ? Number(rawNextStreamId) : 0;

  // Read Claimable Amount for selected stream
  const { data: claimableStreamAmount, refetch: refetchClaimable } = useReadContract({
    address: CONTRACT_ADDRESSES.streamer,
    abi: STREAMER_ABI,
    functionName: 'balanceOf',
    args: [BigInt(streamIdToManage || '0')],
  });
  const claimableEth = claimableStreamAmount ? Number(formatEther(claimableStreamAmount as bigint)) : 0;

  // Address formatter helper
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

  const isWrongNetwork = mounted && isConnected && chainId !== MEZO_TESTNET_CHAIN_ID;
  const isReady = mounted && isConnected && !isWrongNetwork;

  // Native Mezo L2 BTC Gas Balance
  const { data: nativeBalance } = useBalance({
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

  const streamerAllowanceEth = musdAllowanceStreamer ? Number(formatEther(musdAllowanceStreamer as bigint)) : 0;
  const vaultAllowanceEth = musdAllowanceVault ? Number(formatEther(musdAllowanceVault as bigint)) : 0;
  const creditEngineAllowanceEth = musdAllowanceCreditEngine ? Number(formatEther(musdAllowanceCreditEngine as bigint)) : 0;

  const streamDepositNum = Number(streamDeposit || '0');
  const isStreamerApproved = streamerAllowanceEth >= (streamDepositNum > 0 ? streamDepositNum : 1);

  const repayAmountNum = Number(repayAmount || '0');
  const isVaultApproved = vaultAllowanceEth >= (repayAmountNum > 0 ? repayAmountNum : 1);

  const yieldDepositNum = Number(yieldDepositAmount || '0');
  const isCreditEngineApproved = creditEngineAllowanceEth >= (yieldDepositNum > 0 ? yieldDepositNum : 1);

  // Refresh all on-chain states
  const refreshAllData = () => {
    refetchCollateral();
    refetchDebt();
    refetchMusd();
    refetchYield();
    refetchStream();
    refetchNextStreamId();
    refetchClaimable();
    refetchTbtc();
    refetchStreamerAllowance();
    refetchVaultAllowance();
    refetchCreditEngineAllowance();
  };

  // Reusable transaction execution engine with genuine on-chain receipt confirmation
  const executeTx = async ({
    actionType,
    title,
    amountDisplay,
    writeCall,
    onReceipt,
    onConfirmed,
  }: {
    actionType: ActiveAction;
    title: string;
    amountDisplay: string;
    writeCall: () => Promise<`0x${string}`>;
    onReceipt?: (receipt: any) => string | void;
    onConfirmed?: () => void;
  }) => {
    setActiveAction(actionType);
    setTxStatus('wallet_confirm');
    setStatusMessage(`Please confirm ${title} in your wallet...`);

    try {
      const hash = await writeCall();
      setTxStatus('pending');
      setStatusMessage(`Transaction submitted (${hash.slice(0, 10)}...). Waiting for Mezo L2 confirmation...`);

      const client = publicClient || createPublicClient({
        chain: mezoTestnet,
        transport: http('https://rpc.test.mezo.org'),
      });

      const receipt = await client.waitForTransactionReceipt({ hash });
      if (receipt.status === 'success') {
        let customMessage: string | null = null;
        if (onReceipt) {
          try {
            const res = onReceipt(receipt);
            if (typeof res === 'string') customMessage = res;
          } catch (e) {
            console.error('onReceipt callback error:', e);
          }
        }
        setTxStatus('success');
        setStatusMessage(customMessage || `${title} confirmed on Mezo L2 (Block #${receipt.blockNumber})!`);
        addTransactionRecord({
          hash: hash,
          type: title,
          amount: amountDisplay,
          status: 'success',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        if (onConfirmed) onConfirmed();
        refreshAllData();
      } else {
        setTxStatus('failed');
        setStatusMessage(`${title} was reverted on-chain (Block #${receipt.blockNumber}). Check gas or token allowance.`);
        addTransactionRecord({
          hash: hash,
          type: title,
          amount: amountDisplay,
          status: 'failed',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
    } catch (err: any) {
      setTxStatus('failed');
      setStatusMessage(cleanErrorMessage(err, `${title} failed.`));
    } finally {
      setActiveAction('idle');
    }
  };

  // ERC-20 Approval Handler
  const handleApprove = (token: 'tbtc' | 'musd', spender: 'vault' | 'streamer' | 'creditEngine', amountStr: string) => {
    if (isWrongNetwork) return;
    const actionKey = spender === 'vault' ? 'approve_repay' : spender === 'creditEngine' ? 'approve_yield' : 'approve_stream';
    const tokenAddress = token === 'tbtc' ? CONTRACT_ADDRESSES.tbtc : CONTRACT_ADDRESSES.musd;
    const spenderAddress = CONTRACT_ADDRESSES[spender];
    const spenderName = spender === 'vault' ? 'Vault' : spender === 'streamer' ? 'Streamer' : 'Credit Engine';
    const tokenSymbol = token === 'musd' ? 'MEZO' : token.toUpperCase();
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
      },
    });
  };

  // Vault Actions
  const handleDepositCollateral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collateralAmount || isWrongNetwork) return;
    const amountNum = Number(collateralAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTxStatus('failed');
      setStatusMessage('Please enter a valid deposit amount > 0');
      return;
    }
    executeTx({
      actionType: 'deposit_collateral',
      title: 'Deposit BTC',
      amountDisplay: `${collateralAmount} BTC`,
      writeCall: () =>
        writeVaultAsync({
          address: CONTRACT_ADDRESSES.vault,
          abi: VAULT_ABI,
          functionName: 'depositNativeCollateral',
          value: parseEther(collateralAmount),
        }),
      onConfirmed: () => {
        refetchCollateral();
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
    if (amountNum > vaultAllowanceEth) {
      setTxStatus('failed');
      setStatusMessage(`Insufficient MUSD allowance (${vaultAllowanceEth.toFixed(2)} approved, ${amountNum} required). Please click '1. Approve MUSD' first.`);
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

  const handleCreateStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !streamDeposit || !duration || isWrongNetwork) return;
    if (!isAddress(recipient)) {
      setTxStatus('failed');
      setStatusMessage('Invalid recipient EVM address format.');
      return;
    }
    const depositNum = Number(streamDeposit);
    if (isNaN(depositNum) || depositNum <= 0) {
      setTxStatus('failed');
      setStatusMessage('Deposit amount must be > 0.');
      return;
    }
    const durationNum = Number(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      setTxStatus('failed');
      setStatusMessage('Stream duration must be > 0 seconds.');
      return;
    }
    const musdBalNum = musdBalance ? Number(formatEther(musdBalance as bigint)) : 0;
    if (depositNum > musdBalNum) {
      setTxStatus('failed');
      setStatusMessage(`Insufficient MEZO balance for stream (${musdBalNum.toLocaleString()} available).`);
      return;
    }
    if (depositNum > streamerAllowanceEth) {
      setTxStatus('failed');
      setStatusMessage(`Insufficient MEZO allowance (${streamerAllowanceEth.toFixed(2)} approved, ${depositNum} required). Please click '1. Approve MEZO' first.`);
      return;
    }
    executeTx({
      actionType: 'create_stream',
      title: 'Create Stream',
      amountDisplay: `${streamDeposit} MEZO`,
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
        return `Stream created on Mezo L2!`;
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
    executeTx({
      actionType: 'withdraw_stream',
      title: 'Withdraw Stream',
      amountDisplay: `${claimableEth.toFixed(4)} MEZO from Stream #${streamIdToManage}`,
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
    const amountNum = Number(topUpAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTxStatus('failed');
      setStatusMessage('Top up amount must be > 0.');
      return;
    }
    const musdBalNum = musdBalance ? Number(formatEther(musdBalance as bigint)) : 0;
    if (amountNum > musdBalNum) {
      setTxStatus('failed');
      setStatusMessage(`Insufficient MEZO balance for top up (${musdBalNum.toLocaleString()} available).`);
      return;
    }
    if (amountNum > streamerAllowanceEth) {
      setTxStatus('failed');
      setStatusMessage(`Insufficient MEZO allowance (${streamerAllowanceEth.toFixed(2)} approved, ${amountNum} required). Please click '1. Approve MEZO' above first.`);
      return;
    }
    executeTx({
      actionType: 'top_up_stream',
      title: 'Top-Up Stream',
      amountDisplay: `${topUpAmount} MEZO`,
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

  // Withdraw Collateral Handler
  const handleWithdrawCollateral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || isWrongNetwork) return;
    const amountNum = Number(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTxStatus('failed');
      setStatusMessage('Please enter a valid withdrawal amount > 0');
      return;
    }
    if (amountNum > collateralEth) {
      setTxStatus('failed');
      setStatusMessage(`Withdrawal exceeds deposited collateral (${collateralEth.toFixed(4)} tBTC).`);
      return;
    }
    if (amountNum > maxWithdrawableEth) {
      setTxStatus('failed');
      setStatusMessage(`Position would be undercollateralized. Max safe withdrawal is ${maxWithdrawableEth.toFixed(4)} tBTC.`);
      return;
    }
    executeTx({
      actionType: 'withdraw_collateral',
      title: 'Withdraw BTC',
      amountDisplay: `${withdrawAmount} BTC`,
      writeCall: () =>
        writeVaultAsync({
          address: CONTRACT_ADDRESSES.vault,
          abi: VAULT_ABI,
          functionName: 'withdrawCollateral',
          args: [parseEther(withdrawAmount)],
        }),
      onConfirmed: () => {
        refetchCollateral();
      },
    });
  };

  // Yield Deposit Handler
  const handleDepositYield = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yieldDepositAmount || isWrongNetwork) return;
    const amountNum = Number(yieldDepositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTxStatus('failed');
      setStatusMessage('Yield deposit amount must be > 0.');
      return;
    }
    const musdBalNum = musdBalance ? Number(formatEther(musdBalance as bigint)) : 0;
    if (amountNum > musdBalNum) {
      setTxStatus('failed');
      setStatusMessage(`Insufficient MUSD balance (${musdBalNum.toLocaleString()} available).`);
      return;
    }
    if (amountNum > creditEngineAllowanceEth) {
      setTxStatus('failed');
      setStatusMessage(`Insufficient MUSD allowance (${creditEngineAllowanceEth.toFixed(2)} approved, ${amountNum} required). Please click 'Approve' first.`);
      return;
    }
    executeTx({
      actionType: 'deposit_yield',
      title: 'Deposit Yield',
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
      },
    });
  };

  // Amortize Debt Handler
  const handleAmortizeDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amortizeAmount || !address || isWrongNetwork) return;
    const amountNum = Number(amortizeAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTxStatus('failed');
      setStatusMessage('Amortization amount must be > 0.');
      return;
    }
    const yieldBalNum = yieldBalance ? Number(formatEther(yieldBalance as bigint)) : 0;
    if (amountNum > yieldBalNum) {
      setTxStatus('failed');
      setStatusMessage(`Insufficient staking yield balance (${yieldBalNum.toLocaleString()} MUSD available).`);
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
                    : 'Confirming on Mezo L2...'}
                </p>
                <p className="text-xs font-mono text-[#171715] mt-1 break-words leading-relaxed">
                  {statusMessage}
                </p>
              </div>
            </div>
            <button
              onClick={() => setTxStatus('idle')}
              className="p-1 rounded-lg bg-[#DEDBD3]/40 hover:bg-[#DEDBD3] text-[#171715] transition-colors shrink-0"
              title="Close notification"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-end pt-1">
            <button
              onClick={() => setTxStatus('idle')}
              className="text-[11px] font-mono text-[#77756F] hover:text-[#171715] px-2.5 py-1 rounded bg-[#DEDBD3]/30 hover:bg-[#DEDBD3] transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <header className="border-b border-[#DEDBD3] bg-[#FBFAF7] px-8 py-5 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
        <div className="flex items-center space-x-4">
          <div className="bg-[#E66C35] p-2 rounded-lg text-white font-bold shadow-sm">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight font-serif-display text-[#171715] flex items-center space-x-2">
              <span>BitStreamfi</span>
              <span className="text-[10px] font-mono uppercase bg-[#DEDBD3]/40 px-2 py-0.5 rounded text-[#77756F]">Mezo L2</span>
            </h1>
            <p className="text-[11px] text-[#77756F] font-mono">Bitcoin-backed payroll & credit engine</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="hidden lg:flex items-center space-x-2 bg-[#F6F4EF] border border-[#DEDBD3] px-3 py-1.5 rounded-lg text-xs font-mono text-[#77756F]">
            <span className="w-2 h-2 rounded-full bg-[#258454]"></span>
            <span>Mezo Testnet (31611)</span>
          </div>

          {!mounted ? (
            <div className="h-10 w-32 bg-[#DEDBD3]/40 rounded-xl animate-pulse"></div>
          ) : isConnected ? (
            <div className="flex items-center space-x-3 bg-[#F6F4EF] px-4 py-2 rounded-xl border border-[#DEDBD3] shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#258454]"></span>
              <span className="text-xs font-mono font-medium text-[#171715]">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <span className="hidden sm:inline-block text-[11px] font-mono text-[#77756F] bg-[#FBFAF7] px-2 py-0.5 rounded border border-[#DEDBD3]">
                {nativeBalance ? Number(formatEther(nativeBalance.value)).toFixed(3) : '0.000'} BTC
              </span>
              <button
                onClick={() => setShowWalletModal(true)}
                className="text-xs text-[#77756F] hover:text-[#171715] font-semibold ml-2 underline underline-offset-2"
                title="Switch Account or Wallet"
              >
                Switch
              </button>
              <button onClick={() => disconnect()} className="text-xs text-[#C7473A] hover:opacity-80 font-semibold ml-1">
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowWalletModal(true)}
              className="flex items-center space-x-2 bg-[#171715] hover:bg-[#E66C35] text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all shadow-sm"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto p-8 flex flex-col space-y-8 flex-1">

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DEDBD3] pb-4">
          <div className="flex space-x-2">
            {(['overview', 'vault', 'payroll', 'activity'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${activeTab === tab
                    ? 'bg-[#171715] text-white shadow-sm'
                    : 'bg-[#FBFAF7] text-[#77756F] hover:text-[#171715] border border-[#DEDBD3]'
                  }`}
              >
                {tab === 'overview' ? 'Overview' : tab === 'vault' ? 'Vault & Credit' : tab === 'payroll' ? 'Payroll Streamer' : 'Activity'}
              </button>
            ))}
          </div>
        </nav>

        {/* TAB 1: OVERVIEW & MASTER ANATOMY MACHINE */}
        {activeTab === 'overview' && (
          <div className="space-y-12 animate-fadeIn">

            {/* Editorial Headline */}
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-mono uppercase text-[#E66C35] tracking-widest font-semibold">Anatomy of the Protocol</p>
              <h2 className="text-5xl font-serif-display font-normal tracking-tight leading-none text-[#171715]">
                Money in motion.
              </h2>
              <p className="text-sm text-[#77756F] leading-relaxed">
                A precision physical instrument explaining the BitStreamfi protocol. Idle Bitcoin collateral is secured in the vault, stablecoin liquidity is conveyed through calibrated conduits, payroll streams continuously, and staking yield amortizes debt.
              </p>
            </div>

            {/* MASTER ANATOMY MACHINE SVG (Directly modeling reference image) */}
            <div className="bg-[#121c2e] border-2 border-[#C59B27]/40 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0a111c] via-[#121c2e] to-[#1a2942] pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-6 border-b border-slate-700/60 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C59B27] animate-pulse"></span>
                    <span className="text-xs font-mono uppercase tracking-widest text-slate-300">FIG. 1 — The BitStreamfi Precision Engine</span>
                  </div>
                  <div className="text-xs font-mono text-[#C59B27] bg-[#C59B27]/10 px-3 py-1 rounded border border-[#C59B27]/30">
                    Mezo L2 Active Protocol
                  </div>
                </div>

                {/* Interactive Isometric Vault Anatomy Animation */}
                <div className="w-full h-[390px] flex justify-center items-center overflow-hidden my-2">
                  <iframe
                    src="/vault-anatomy/embed.html"
                    className="w-full h-full border-0 bg-transparent"
                    title="BitStreamfi Isometric Collateral Vault Animation"
                  />
                </div>

                <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-700/60 text-xs font-mono text-slate-300">
                  <div className="flex items-center space-x-2">
                    <span className="text-[#C59B27]">●</span>
                    <span>Collateral: <strong className="text-white">{userCollateral ? formatEther(userCollateral as bigint) : '0.0'} tBTC</strong></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#C59B27]">●</span>
                    <span>Active Debt: <strong className="text-white">{userDebt ? formatEther(userDebt as bigint) : '0.0'} MUSD</strong></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#C59B27]">●</span>
                    <span>Vault LTV: <strong className={ltvStatusColor}>{collateralValueUSD > 0 ? `${ltvNumeric.toFixed(1)}%` : '0.0%'} (Max 60%)</strong></span>
                  </div>
                </div>

              </div>
            </div>

            {/* Hierarchy Layout: Vault Health beside MezoFlow Vault Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Left 2 Cols: MezoFlow Vault Actions */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl shadow-sm">
                  <h3 className="text-lg font-bold font-serif-display text-[#171715] mb-2 flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-[#E66C35]" />
                    <span>MezoFlow Vault Operations</span>
                  </h3>
                  <p className="text-xs text-[#77756F] mb-6">Deposit tBTC collateral or manage your MUSD borrowing capacity.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Deposit Form */}
                    <div className="bg-[#F6F4EF] p-5 rounded-xl border border-[#DEDBD3]">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#171715] mb-3">Deposit tBTC</h4>
                      <form onSubmit={handleDepositCollateral} className="space-y-3">
                        <input
                          type="number"
                          step="0.0001"
                          value={collateralAmount}
                          onChange={(e) => setCollateralAmount(e.target.value)}
                          placeholder="0.0 tBTC"
                          className="w-full bg-[#FBFAF7] border border-[#DEDBD3] rounded-lg px-3 py-2.5 text-[#171715] font-mono text-xs focus:outline-none focus:border-[#E66C35]"
                        />
                        <button
                          type="submit"
                          disabled={(vaultPending && activeAction === 'deposit_collateral') || !isReady || !collateralAmount || Number(collateralAmount) <= 0}
                          className="w-full bg-[#171715] hover:bg-[#E66C35] text-white font-semibold py-2.5 rounded-lg text-xs transition-colors disabled:opacity-50"
                        >
                          {(vaultPending || txStatus === 'wallet_confirm') && activeAction === 'deposit_collateral' ? 'Processing...' : 'Deposit Collateral'}
                        </button>
                      </form>
                    </div>

                    {/* Borrow Form */}
                    <div className="bg-[#F6F4EF] p-5 rounded-xl border border-[#DEDBD3]">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#171715] mb-3">Borrow MUSD</h4>
                      <form onSubmit={handleBorrowMUSD} className="space-y-3">
                        <input
                          type="number"
                          step="1"
                          value={borrowAmount}
                          onChange={(e) => setBorrowAmount(e.target.value)}
                          placeholder="0.0 MUSD"
                          className="w-full bg-[#FBFAF7] border border-[#DEDBD3] rounded-lg px-3 py-2.5 text-[#171715] font-mono text-xs focus:outline-none focus:border-[#E66C35]"
                        />
                        <button
                          type="submit"
                          disabled={(vaultPending && activeAction === 'borrow_musd') || !isReady || availableBorrowUSD <= 0 || !borrowAmount || Number(borrowAmount) <= 0}
                          className="w-full bg-[#171715] hover:bg-[#E66C35] text-white font-semibold py-2.5 rounded-lg text-xs transition-colors disabled:opacity-50"
                        >
                          {(vaultPending || txStatus === 'wallet_confirm') && activeAction === 'borrow_musd' ? 'Processing...' : 'Borrow Stablecoins'}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Col: Vault Health Panel */}
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold font-serif-display text-[#171715] mb-4">Vault Health & LTV</h3>

                  <div className="space-y-4 font-mono text-xs">
                    <div className="flex justify-between pb-3 border-b border-[#DEDBD3]">
                      <span className="text-[#77756F]">Collateral Valuation:</span>
                      <span className="font-bold text-[#171715]">$60,000 / tBTC (Model)</span>
                    </div>
                    <div className="flex justify-between pb-3 border-b border-[#DEDBD3]">
                      <span className="text-[#77756F]">Max LTV Threshold:</span>
                      <span className="font-bold text-[#171715]">60.00%</span>
                    </div>
                    <div className="flex justify-between pb-3 border-b border-[#DEDBD3]">
                      <span className="text-[#77756F]">Current LTV Ratio:</span>
                      <span className={`font-bold ${ltvStatusColor}`}>{collateralValueUSD > 0 ? `${ltvNumeric.toFixed(1)}%` : '0.0%'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-[#F6F4EF] rounded-xl border border-[#DEDBD3] text-xs font-mono text-[#77756F]">
                  <p className="font-bold text-[#171715] mb-1">Safety Rule:</p>
                  <p>Maintains strict liquidation buffers on Mezo L2. Keep LTV below 50% for optimal safety.</p>
                </div>
              </div>

            </div>

            {/* Payroll Streamer Section spanning width below */}
            <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#DEDBD3] pb-4 gap-4">
                <div>
                  <h3 className="text-xl font-bold font-serif-display text-[#171715]">Payroll Metering Rail & Streamer</h3>
                  <p className="text-xs text-[#77756F] mt-1">Second-by-second continuous MUSD salary streaming with instant top-up and cancel controls.</p>
                </div>
                <button
                  onClick={() => setActiveTab('payroll')}
                  className="bg-[#171715] hover:bg-[#E66C35] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors self-start md:self-auto"
                >
                  Manage Streams →
                </button>
              </div>

              {/* Metering Rail Graphical Demo */}
              <div className="p-6 bg-[#F6F4EF] rounded-2xl border border-[#DEDBD3] space-y-4">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#77756F]">Stream ID #0 Active Progress</span>
                  <span className="text-[#258454] font-bold">Continuous Vesting (Live)</span>
                </div>
                <div className="w-full bg-[#DEDBD3] h-4 rounded-full overflow-hidden relative">
                  <div className="bg-[#258454] h-full rounded-full transition-all duration-1000" style={{ width: `${(animationPhase + 1) * 25}%` }}></div>
                </div>
                <div className="flex justify-between text-[11px] font-mono text-[#77756F]">
                  <span>Start: Day 0</span>
                  <span>Elapsed: {(animationPhase + 1) * 7} Days</span>
                  <span>Vesting: 30 Days</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: VAULT & CREDIT ENGINE */}
        {activeTab === 'vault' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="border-b border-[#DEDBD3] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-serif-display font-bold text-[#171715]">MezoFlow Vault & Credit Engine</h2>
                <p className="text-xs text-[#77756F] mt-1">Deposit tBTC collateral, mint MUSD stablecoins, and manage your LTV health ratio.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <div className="bg-[#FBFAF7] border border-[#DEDBD3] px-3.5 py-2 rounded-xl">
                  <span className="text-[#77756F]">Gas BTC: </span>
                  <strong className="text-[#171715]">{mounted && nativeBalance ? Number(formatEther(nativeBalance.value)).toFixed(4) : '0.0000'}</strong>
                </div>
                <div className="bg-[#FBFAF7] border border-[#DEDBD3] px-3.5 py-2 rounded-xl">
                  <span className="text-[#77756F]">Wallet MEZO: </span>
                  <strong className="text-[#171715]">{mounted && musdBalance ? Number(formatEther(musdBalance as bigint)).toLocaleString() : '0'}</strong>
                </div>
                <button
                  type="button"
                  onClick={refreshAllData}
                  className="bg-[#FBFAF7] hover:bg-[#DEDBD3]/40 border border-[#DEDBD3] p-2.5 rounded-xl text-[#77756F] hover:text-[#171715] transition-colors"
                  title="Refresh Balances"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Position Health Metrics Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-5 rounded-2xl">
                <p className="text-xs font-mono text-[#77756F]">Deposited Collateral</p>
                <p className="text-xl font-bold font-mono text-[#171715] mt-1">{collateralEth.toFixed(4)} tBTC</p>
                <p className="text-[11px] font-mono text-[#77756F] mt-0.5">${collateralValueUSD.toLocaleString()} USD</p>
              </div>
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-5 rounded-2xl">
                <p className="text-xs font-mono text-[#77756F]">Active MUSD Debt</p>
                <p className="text-xl font-bold font-mono text-[#171715] mt-1">{debtEth.toLocaleString()} MUSD</p>
                <p className={`text-[11px] font-mono mt-0.5 font-semibold ${ltvStatusColor}`}>LTV: {ltvNumeric.toFixed(1)}% / 60%</p>
              </div>
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-5 rounded-2xl">
                <p className="text-xs font-mono text-[#77756F]">Available to Borrow</p>
                <p className="text-xl font-bold font-mono text-[#258454] mt-1">{availableBorrowUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                <p className="text-[11px] font-mono text-[#77756F] mt-0.5">Based on 60% Max LTV</p>
              </div>
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-5 rounded-2xl">
                <p className="text-xs font-mono text-[#77756F]">Max Safe Withdrawal</p>
                <p className="text-xl font-bold font-mono text-[#B7791F] mt-1">{maxWithdrawableEth.toFixed(4)} tBTC</p>
                <p className="text-[11px] font-mono text-[#77756F] mt-0.5">Retains debt solvency</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Collateral Management */}
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl space-y-6">
                <div className="flex items-center space-x-2 border-b border-[#DEDBD3] pb-3">
                  <PlusCircle className="w-4 h-4 text-[#E66C35]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715]">Collateral Operations</h3>
                </div>

                {/* Deposit Collateral Form */}
                <form onSubmit={handleDepositCollateral} className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-mono text-[#77756F]">
                    <label>Deposit Bitcoin (BTC)</label>
                    <span>Gas BTC: {mounted && nativeBalance ? Number(formatEther(nativeBalance.value)).toFixed(4) : '0.0000'}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      value={collateralAmount}
                      onChange={(e) => setCollateralAmount(e.target.value)}
                      placeholder="0.01 BTC"
                      className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#E66C35]"
                    />
                    {nativeBalance && (
                      <button
                        type="button"
                        onClick={() => setCollateralAmount((Math.max(0, Number(formatEther(nativeBalance.value)) - 0.005)).toFixed(4))}
                        className="absolute right-3 top-2.5 text-[11px] font-mono bg-[#DEDBD3]/40 px-2 py-1 rounded text-[#171715] hover:bg-[#DEDBD3]"
                      >
                        SAFE MAX
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={(vaultPending && activeAction === 'deposit_collateral') || !isReady || !collateralAmount || Number(collateralAmount) <= 0}
                    className="w-full bg-[#171715] hover:bg-[#E66C35] disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-xs transition-colors"
                  >
                    {(vaultPending || txStatus === 'wallet_confirm') && activeAction === 'deposit_collateral' ? 'Depositing...' : 'Deposit Bitcoin Collateral'}
                  </button>
                </form>

                {/* Withdraw Collateral Form */}
                <form onSubmit={handleWithdrawCollateral} className="space-y-3 pt-4 border-t border-[#DEDBD3]">
                  <div className="flex justify-between items-center text-xs font-mono text-[#77756F]">
                    <label>Withdraw Bitcoin (BTC)</label>
                    <span>Safe Max: {maxWithdrawableEth.toFixed(4)} BTC</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.01 BTC"
                      className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#B7791F]"
                    />
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(maxWithdrawableEth.toFixed(4))}
                      className="absolute right-3 top-2.5 text-[11px] font-mono bg-[#DEDBD3]/40 px-2 py-1 rounded text-[#171715] hover:bg-[#DEDBD3]"
                    >
                      SAFE MAX
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={(vaultPending && activeAction === 'withdraw_collateral') || !isReady || maxWithdrawableEth <= 0 || !withdrawAmount || Number(withdrawAmount) <= 0}
                    className="w-full bg-[#171715] hover:bg-[#B7791F] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors"
                  >
                    {(vaultPending || txStatus === 'wallet_confirm') && activeAction === 'withdraw_collateral' ? 'Withdrawing...' : 'Withdraw Collateral'}
                  </button>
                </form>
              </div>

              {/* Card 2: Debt & Borrow Operations */}
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl space-y-6">
                <div className="flex items-center space-x-2 border-b border-[#DEDBD3] pb-3">
                  <DollarSign className="w-4 h-4 text-[#B7791F]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715]">Debt & Borrow Operations</h3>
                </div>

                {/* Borrow Form */}
                <form onSubmit={handleBorrowMUSD} className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-mono text-[#77756F]">
                    <label>Borrow MUSD (Mint)</label>
                    <span>Available: {availableBorrowUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })} MUSD</span>
                  </div>
                  {collateralEth <= 0 && (
                    <div className="bg-[#B7791F]/10 border border-[#B7791F]/30 p-2.5 rounded-xl text-[11px] text-[#B7791F] font-mono">
                      Deposit Bitcoin collateral above to unlock borrowing capacity (60% Max LTV).
                    </div>
                  )}
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={borrowAmount}
                      onChange={(e) => setBorrowAmount(e.target.value)}
                      placeholder="0.0 MUSD"
                      className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#B7791F]"
                    />
                    <button
                      type="button"
                      onClick={() => setBorrowAmount(Math.floor(availableBorrowUSD).toString())}
                      className="absolute right-3 top-2.5 text-[11px] font-mono bg-[#DEDBD3]/40 px-2 py-1 rounded text-[#171715] hover:bg-[#DEDBD3]"
                    >
                      MAX
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={(vaultPending && activeAction === 'borrow_musd') || !isReady || availableBorrowUSD <= 0 || !borrowAmount || Number(borrowAmount) <= 0}
                    className="w-full bg-[#171715] hover:bg-[#B7791F] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors"
                  >
                    {(vaultPending || txStatus === 'wallet_confirm') && activeAction === 'borrow_musd' ? 'Minting...' : 'Borrow MUSD'}
                  </button>
                </form>

                {/* Repay Form */}
                <form onSubmit={handleRepayMUSD} className="space-y-3 pt-4 border-t border-[#DEDBD3]">
                  <div className="flex justify-between items-center text-xs font-mono text-[#77756F]">
                    <label>Repay MUSD</label>
                    <span>Active Debt: {debtEth.toLocaleString()} MUSD</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(e.target.value)}
                      placeholder="0.0 MUSD"
                      className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#258454]"
                    />
                    <button
                      type="button"
                      onClick={() => setRepayAmount(Math.min(debtEth, musdBalance ? Number(formatEther(musdBalance as bigint)) : 0).toString())}
                      className="absolute right-3 top-2.5 text-[11px] font-mono bg-[#DEDBD3]/40 px-2 py-1 rounded text-[#171715] hover:bg-[#DEDBD3]"
                    >
                      MAX
                    </button>
                  </div>
                  <div className="bg-[#F6F4EF] p-2.5 rounded-xl border border-[#DEDBD3] text-xs font-mono flex items-center justify-between">
                    <span className="text-[#77756F]">Vault MUSD Allowance:</span>
                    <span className={`font-semibold ${isVaultApproved ? 'text-[#258454]' : 'text-[#E66C35]'}`}>
                      {vaultAllowanceEth >= 1000000 ? 'Unlimited' : `${vaultAllowanceEth.toFixed(2)} MUSD`}
                      {isVaultApproved ? ' (✓ Ready)' : ' (Approval Required)'}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleApprove('musd', 'vault', repayAmount || '10000')}
                      disabled={(genericPending && activeAction === 'approve_repay') || !isReady}
                      className={`flex-1 font-semibold py-2.5 rounded-xl text-xs transition-all ${
                        isVaultApproved
                          ? 'bg-[#258454]/10 border border-[#258454]/40 text-[#258454] hover:bg-[#258454]/20'
                          : 'bg-[#E66C35] text-white hover:bg-[#171715] shadow-sm animate-pulse'
                      } disabled:opacity-50`}
                    >
                      {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'approve_repay'
                        ? 'Approving...'
                        : isVaultApproved
                        ? `✓ MUSD Approved`
                        : '1. Approve MUSD (Required)'}
                    </button>
                    <button
                      type="submit"
                      disabled={
                        (vaultPending && activeAction === 'repay_musd') ||
                        !isReady ||
                        debtEth <= 0 ||
                        !repayAmount ||
                        Number(repayAmount) <= 0 ||
                        !isVaultApproved
                      }
                      className={`flex-1 font-semibold py-2.5 rounded-xl text-xs transition-colors ${
                        isVaultApproved
                          ? 'bg-[#171715] hover:bg-[#258454] text-white'
                          : 'bg-[#DEDBD3] text-[#77756F] cursor-not-allowed opacity-60'
                      } disabled:opacity-50`}
                    >
                      {(vaultPending || txStatus === 'wallet_confirm') && activeAction === 'repay_musd'
                        ? 'Repaying...'
                        : !isVaultApproved
                        ? '2. Repay (Approve First)'
                        : '2. Repay MUSD'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Card 3: Self-Repaying Credit Engine */}
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl lg:col-span-2 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#DEDBD3] pb-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-[#E66C35]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715]">Self-Repaying Credit Engine</h3>
                  </div>
                  <div className="text-xs font-mono text-[#77756F]">
                    Staking Yield Balance: <strong className="text-[#258454]">{mounted && yieldBalance ? Number(formatEther(yieldBalance as bigint)).toLocaleString() : '0'} MUSD</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Deposit Yield */}
                  <form onSubmit={handleDepositYield} className="space-y-3 bg-[#F6F4EF] p-5 rounded-xl border border-[#DEDBD3]">
                    <div className="flex justify-between items-center text-xs font-mono text-[#77756F]">
                      <label className="font-bold text-[#171715]">Channel Yield into Engine</label>
                      <span>MUSD: {mounted && musdBalance ? Number(formatEther(musdBalance as bigint)).toLocaleString() : '0'}</span>
                    </div>
                    <p className="text-[11px] text-[#77756F]">Deposit earned Mezo staking yield to fund automated debt amortization.</p>
                    <input
                      type="number"
                      step="1"
                      value={yieldDepositAmount}
                      onChange={(e) => setYieldDepositAmount(e.target.value)}
                      placeholder="Amount to deposit"
                      className="w-full bg-[#FBFAF7] border border-[#DEDBD3] rounded-xl px-4 py-2.5 text-[#171715] font-mono text-xs focus:outline-none focus:border-[#E66C35]"
                    />
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#77756F]">
                      <span>Allowance:</span>
                      <span className={isCreditEngineApproved ? 'text-[#258454] font-semibold' : 'text-[#E66C35] font-semibold'}>
                        {creditEngineAllowanceEth >= 1000000 ? 'Unlimited' : `${creditEngineAllowanceEth.toFixed(2)} MUSD`}
                        {isCreditEngineApproved ? ' (✓ Ready)' : ' (Approval Required)'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleApprove('musd', 'creditEngine', yieldDepositAmount || '5000')}
                        disabled={(genericPending && activeAction === 'approve_yield') || !isReady}
                        className={`flex-1 font-semibold py-2 rounded-lg text-xs transition-colors ${
                          isCreditEngineApproved
                            ? 'bg-[#258454]/10 border border-[#258454]/40 text-[#258454]'
                            : 'bg-[#E66C35] text-white animate-pulse'
                        } disabled:opacity-50`}
                      >
                        {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'approve_yield'
                          ? 'Approving...'
                          : isCreditEngineApproved
                          ? `✓ Approved`
                          : '1. Approve MUSD'}
                      </button>
                      <button
                        type="submit"
                        disabled={
                          (genericPending && activeAction === 'deposit_yield') ||
                          !isReady ||
                          !yieldDepositAmount ||
                          Number(yieldDepositAmount) <= 0 ||
                          !isCreditEngineApproved
                        }
                        className={`flex-1 font-semibold py-2 rounded-lg text-xs transition-colors ${
                          isCreditEngineApproved
                            ? 'bg-[#171715] hover:bg-[#E66C35] text-white'
                            : 'bg-[#DEDBD3] text-[#77756F] cursor-not-allowed opacity-60'
                        } disabled:opacity-50`}
                      >
                        {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'deposit_yield'
                          ? 'Depositing...'
                          : !isCreditEngineApproved
                          ? '2. Deposit (Approve First)'
                          : '2. Deposit Yield'}
                      </button>
                    </div>
                  </form>

                  {/* Amortize Debt */}
                  <form onSubmit={handleAmortizeDebt} className="space-y-3 bg-[#F6F4EF] p-5 rounded-xl border border-[#DEDBD3]">
                    <div className="flex justify-between items-center text-xs font-mono text-[#77756F]">
                      <label className="font-bold text-[#171715]">Amortize Debt from Yield</label>
                      <span>Active Debt: {debtEth.toLocaleString()} MUSD</span>
                    </div>
                    <p className="text-[11px] text-[#77756F]">Apply available yield balance directly to repay your vault loan without touching principal.</p>
                    <input
                      type="number"
                      step="1"
                      value={amortizeAmount}
                      onChange={(e) => setAmortizeAmount(e.target.value)}
                      placeholder="Amount to amortize"
                      className="w-full bg-[#FBFAF7] border border-[#DEDBD3] rounded-xl px-4 py-2.5 text-[#171715] font-mono text-xs focus:outline-none focus:border-[#258454]"
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

            </div>
          </div>
        )}

        {/* TAB 3: PAYROLL STREAMER */}
        {activeTab === 'payroll' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="border-b border-[#DEDBD3] pb-4">
              <h2 className="text-3xl font-serif-display font-bold text-[#171715]">Payroll Streamer</h2>
              <p className="text-xs text-[#77756F] mt-1">Create and manage second-by-second MEZO salary streams with enterprise revocation controls.</p>
            </div>

            {/* How Salary Streaming Escrow Works */}
            <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-5 rounded-2xl flex items-start space-x-3.5 text-xs font-mono shadow-sm">
              <div className="bg-[#E66C35]/10 p-2 rounded-xl text-[#E66C35] shrink-0 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="font-bold text-[#171715] text-sm">How Second-by-Second Streaming Works</p>
                <p className="text-[#77756F] leading-relaxed">
                  When you create a stream, deposited MEZO is held in the <strong>PayrollStreamer escrow contract</strong> on Mezo L2. 
                  Tokens do <strong>not</strong> transfer to the recipient's wallet all at once. Instead, they unlock second-by-second into their claimable balance. 
                  The recipient can connect their wallet anytime to claim earned funds via the <strong>"Withdraw Funds"</strong> button, while the employer maintains full revocation protection.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Create Stream Form */}
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715] mb-2 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[#E66C35]" />
                    <span>Create Salary Stream</span>
                  </h3>
                  <p className="text-xs text-[#77756F] mb-6">Deposit MEZO for continuous second-by-second vesting.</p>
                  
                  <form onSubmit={handleCreateStream} className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-mono text-[#77756F]">Recipient Address</label>
                        {address && (
                          <button
                            type="button"
                            onClick={() => setRecipient(address)}
                            className="text-[11px] font-mono text-[#E66C35] hover:underline flex items-center space-x-1"
                          >
                            <span>Use My Connected Wallet</span>
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder="0x... (contractor or employee address)"
                        className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-xs focus:outline-none focus:border-[#E66C35]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-[#77756F] block mb-1">Deposit Amount (MEZO)</label>
                      <input
                        type="number"
                        step="1"
                        value={streamDeposit}
                        onChange={(e) => setStreamDeposit(e.target.value)}
                        placeholder="10"
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
                        placeholder="2592000 (30 days)"
                        className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#E66C35]"
                      />
                    </div>

                    {Number(streamDeposit) > 0 && Number(duration) > 0 && (
                      <div className="text-[11px] font-mono text-[#77756F] bg-[#F6F4EF] p-2.5 rounded-xl border border-[#DEDBD3] flex justify-between">
                        <span>Streaming Speed:</span>
                        <span className="text-[#171715] font-semibold">
                          {(Number(streamDeposit) / Number(duration)).toFixed(6)} MEZO / sec
                        </span>
                      </div>
                    )}

                    <div className="bg-[#F6F4EF] p-3 rounded-xl border border-[#DEDBD3] text-xs font-mono flex items-center justify-between">
                      <span className="text-[#77756F]">MEZO Allowance:</span>
                      <span className={`font-semibold ${isStreamerApproved ? 'text-[#258454]' : 'text-[#E66C35]'}`}>
                        {streamerAllowanceEth >= 1000000 ? 'Unlimited' : `${streamerAllowanceEth.toFixed(2)} MEZO`}
                        {isStreamerApproved ? ' (✓ Ready)' : ' (Approval Required)'}
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleApprove('musd', 'streamer', streamDeposit || '10')}
                        disabled={(genericPending && activeAction === 'approve_stream') || !isReady}
                        className={`flex-1 font-semibold py-3 rounded-xl text-xs transition-all ${
                          isStreamerApproved
                            ? 'bg-[#258454]/10 border border-[#258454]/40 text-[#258454] hover:bg-[#258454]/20'
                            : 'bg-[#E66C35] text-white hover:bg-[#171715] shadow-sm animate-pulse'
                        } disabled:opacity-50`}
                      >
                        {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'approve_stream'
                          ? 'Approving...'
                          : isStreamerApproved
                          ? `✓ MEZO Approved`
                          : '1. Approve MEZO (Required)'}
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
                        className={`flex-1 font-semibold py-3 rounded-xl text-xs transition-colors ${
                          isStreamerApproved
                            ? 'bg-[#171715] hover:bg-[#E66C35] text-white shadow-sm'
                            : 'bg-[#DEDBD3] text-[#77756F] cursor-not-allowed opacity-60'
                        } disabled:opacity-50`}
                      >
                        {(streamerPending || txStatus === 'wallet_confirm') && activeAction === 'create_stream'
                          ? 'Processing...'
                          : !isStreamerApproved
                          ? '2. Create Stream (Approve First)'
                          : '2. Create Stream'}
                      </button>
                    </div>
                  </form>
                </div>

                <p className="text-[11px] text-[#77756F] italic mt-4 pt-4 border-t border-[#DEDBD3]">
                  💡 Each stream is automatically assigned a sequential Stream ID starting at #0 on Mezo L2. When created, it will automatically load into Stream Management on the right.
                </p>
              </div>

              {/* Manage Stream */}
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715] flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-[#258454]" />
                      <span>Stream Management</span>
                    </h3>
                    <span className="text-[11px] font-mono bg-[#DEDBD3]/40 px-2 py-0.5 rounded text-[#77756F]">
                      Total on-chain: {totalStreamsCount}
                    </span>
                  </div>
                  <p className="text-xs text-[#77756F] mb-4">Inspect balances, top-up liquidity, withdraw vested funds, or cancel.</p>

                  <div className="space-y-4">
                    {/* On-Chain Stream Selector Pills */}
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs font-mono">
                        <label className="text-[#77756F]">Streams on Mezo L2</label>
                        <span className="text-[11px] text-[#77756F]">
                          {totalStreamsCount === 0 ? 'None yet' : `${totalStreamsCount} created`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5">
                        {totalStreamsCount > 0 ? (
                          Array.from({ length: totalStreamsCount }, (_, i) => i).map(id => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setStreamIdToManage(id.toString())}
                              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                                streamIdToManage === id.toString()
                                  ? 'bg-[#171715] text-white border-[#171715] shadow-sm font-bold'
                                  : 'bg-[#F6F4EF] hover:bg-[#DEDBD3] text-[#171715] border-[#DEDBD3]'
                              }`}
                            >
                              Stream #{id}
                            </button>
                          ))
                        ) : (
                          <span className="text-xs text-[#77756F] font-mono italic">
                            Create your first stream on the left!
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Manual Stream ID Input */}
                    <div>
                      <label className="text-xs font-mono text-[#77756F] block mb-1">Enter / Switch Stream ID</label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          min="0"
                          value={streamIdToManage}
                          onChange={(e) => setStreamIdToManage(e.target.value)}
                          placeholder="0"
                          className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-2.5 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#258454]"
                        />
                        <button
                          type="button"
                          onClick={() => { refetchStream(); refetchClaimable(); }}
                          className="bg-[#DEDBD3]/50 hover:bg-[#DEDBD3] px-3 rounded-xl text-xs font-mono text-[#171715] transition-colors"
                          title="Refresh stream"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Stream Data Card */}
                    {!streamExists ? (
                      <div className="bg-[#F6F4EF] border border-[#DEDBD3] p-5 rounded-xl text-center space-y-2">
                        <AlertTriangle className="w-6 h-6 text-[#B7791F] mx-auto opacity-70" />
                        <p className="text-xs font-mono font-bold text-[#171715]">Stream #{streamIdToManage} Not Found</p>
                        <p className="text-[11px] font-mono text-[#77756F]">
                          {totalStreamsCount === 0
                            ? 'No streams have been created yet on this contract.'
                            : `Valid stream IDs are 0 to ${totalStreamsCount - 1}. Click any stream pill above to inspect.`}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-[#F6F4EF] border border-[#DEDBD3] p-4 rounded-xl space-y-3 text-xs font-mono">
                        <div className="flex justify-between items-center pb-2 border-b border-[#DEDBD3]/60">
                          <span className="font-bold text-sm text-[#171715]">Stream #{streamIdToManage}</span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            streamIsActive ? 'bg-[#258454]/10 text-[#258454] border border-[#258454]/30' : 'bg-[#DEDBD3] text-[#77756F]'
                          }`}>
                            {streamIsActive ? '● Streaming Live' : 'Ended / Inactive'}
                          </span>
                        </div>

                        {/* Roles */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[#77756F]">Employer (Payer):</span>
                            <span className="text-[#171715] font-mono flex items-center space-x-1">
                              <span title={streamEmployer}>{formatAddress(streamEmployer)}</span>
                              {isCurrentUserEmployer && (
                                <span className="bg-[#258454]/15 text-[#258454] px-1.5 py-0.2 rounded text-[10px] font-bold">You</span>
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#77756F]">Recipient (Payee):</span>
                            <span className="text-[#171715] font-mono flex items-center space-x-1">
                              <span title={streamRecipient}>{formatAddress(streamRecipient)}</span>
                              {isCurrentUserRecipient ? (
                                <span className="bg-[#258454]/15 text-[#258454] px-1.5 py-0.2 rounded text-[10px] font-bold">You</span>
                              ) : (
                                <span className="text-[#77756F] text-[10px]">(External)</span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Balances */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#DEDBD3]/60">
                          <div>
                            <span className="text-[11px] text-[#77756F] block">Total Deposited</span>
                            <span className="font-bold text-sm text-[#171715]">{streamDepositAmount} MEZO</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-[#77756F] block">Claimable Now</span>
                            <span className="font-bold text-sm text-[#258454]">{claimableEth.toFixed(4)} MEZO</span>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[10px] text-[#77756F]">
                            <span>Vesting Progress</span>
                            <span>{streamProgressPercent}% ({streamWithdrawn.toFixed(2)} MEZO claimed)</span>
                          </div>
                          <div className="w-full bg-[#DEDBD3] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#258454] h-full transition-all duration-500" style={{ width: `${streamProgressPercent}%` }}></div>
                          </div>
                        </div>

                        {/* Escrow Guidance Note */}
                        <div className="bg-[#FBFAF7] p-2.5 rounded-lg border border-[#DEDBD3] text-[11px] text-[#77756F] leading-relaxed">
                          {isCurrentUserRecipient ? (
                            <span>🎉 <strong>You are the recipient!</strong> Click "Withdraw" below to transfer your <strong>{claimableEth.toFixed(4)} MEZO</strong> directly into your wallet.</span>
                          ) : (
                            <span>ℹ️ <strong>Recipient Wallet Status:</strong> Deposited funds remain in the contract escrow until the recipient ({formatAddress(streamRecipient)}) connects and clicks "Withdraw".</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Top Up Form (Employer only) */}
                    {streamExists && isCurrentUserEmployer && (
                      <form onSubmit={handleTopUpStream} className="space-y-2 pt-1 border-t border-[#DEDBD3]">
                        <label className="text-[11px] font-mono text-[#77756F] block">Top-Up Stream Liquidity</label>
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            placeholder="Amount (MEZO)"
                            value={topUpAmount}
                            onChange={(e) => setTopUpAmount(e.target.value)}
                            className="flex-1 bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-2.5 text-[#171715] font-mono text-xs focus:outline-none focus:border-[#258454]"
                          />
                          <button
                            type="submit"
                            disabled={(streamerPending && activeAction === 'top_up_stream') || !isReady || !topUpAmount || Number(topUpAmount) <= 0}
                            className="bg-[#171715] hover:bg-[#258454] disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors"
                          >
                            {(streamerPending || txStatus === 'wallet_confirm') && activeAction === 'top_up_stream' ? 'Topping up...' : 'Top Up'}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Withdraw & Cancel Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={handleWithdrawStream}
                        disabled={
                          (streamerPending && activeAction === 'withdraw_stream') ||
                          !isReady ||
                          !streamExists ||
                          !isCurrentUserRecipient ||
                          claimableEth <= 0
                        }
                        title={
                          !isCurrentUserRecipient
                            ? `Only recipient (${formatAddress(streamRecipient)}) can withdraw`
                            : claimableEth <= 0
                            ? 'No funds available yet to claim'
                            : undefined
                        }
                        className={`py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                          isCurrentUserRecipient && claimableEth > 0
                            ? 'bg-[#258454] hover:opacity-90 text-white'
                            : 'bg-[#DEDBD3] text-[#77756F] cursor-not-allowed opacity-60'
                        }`}
                      >
                        {(streamerPending || txStatus === 'wallet_confirm') && activeAction === 'withdraw_stream'
                          ? 'Withdrawing...'
                          : isCurrentUserRecipient
                          ? `Withdraw (${claimableEth.toFixed(4)} MEZO)`
                          : `Withdraw (${formatAddress(streamRecipient)} Only)`}
                      </button>

                      <button
                        onClick={handleCancelStream}
                        disabled={
                          (streamerPending && activeAction === 'cancel_stream') ||
                          !isReady ||
                          !streamExists ||
                          (!isCurrentUserEmployer && !isCurrentUserRecipient) ||
                          !streamIsActive
                        }
                        className="bg-[#C7473A] hover:opacity-90 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>
                          {(streamerPending || txStatus === 'wallet_confirm') && activeAction === 'cancel_stream'
                            ? 'Cancelling...'
                            : 'Cancel Stream'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ACTIVITY LOG */}
        {activeTab === 'activity' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="border-b border-[#DEDBD3] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h2 className="text-3xl font-serif-display font-bold text-[#171715]">Transaction Activity</h2>
                <p className="text-xs text-[#77756F] mt-1">Confirmed transactions on Mezo Testnet (Chain 31611) • Persisted across browser sessions.</p>
              </div>
              {transactions.length > 0 && (
                <button
                  type="button"
                  onClick={clearTransactionHistory}
                  className="text-xs font-mono text-[#77756F] hover:text-[#C7473A] px-3 py-1.5 rounded-xl border border-[#DEDBD3] hover:border-[#C7473A]/40 transition-colors self-start sm:self-auto"
                >
                  Clear History
                </button>
              )}
            </div>

            <div className="bg-[#FBFAF7] border border-[#DEDBD3] rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DEDBD3] bg-[#F6F4EF] text-xs font-mono uppercase text-[#77756F]">
                    <th className="p-4 font-medium">Type</th>
                    <th className="p-4 font-medium">Amount / Ref</th>
                    <th className="p-4 font-medium">Tx Hash (Explorer)</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DEDBD3] text-xs font-mono">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-[#77756F]">
                        <Activity className="w-8 h-8 text-[#DEDBD3] mx-auto mb-3" />
                        <p className="text-sm font-semibold text-[#171715]">No Recent Transactions</p>
                        <p className="text-xs text-[#77756F] mt-1">Your on-chain deposits, borrows, approvals, and streams will be logged here and saved.</p>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-[#F6F4EF]/50 transition-colors">
                        <td className="p-4 font-bold text-[#171715]">{tx.type}</td>
                        <td className="p-4 text-[#77756F]">{tx.amount}</td>
                        <td className="p-4">
                          <a
                            href={`https://explorer.test.mezo.org/tx/${tx.hash.replace(/\.+$/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#E66C35] hover:underline flex items-center space-x-1"
                            title={`View ${tx.hash} on Mezo Explorer`}
                          >
                            <span>{tx.hash.length > 20 ? `${tx.hash.slice(0, 10)}...${tx.hash.slice(-6)}` : tx.hash}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full font-semibold ${
                            tx.status === 'success'
                              ? 'bg-[#258454]/10 text-[#258454]'
                              : 'bg-[#C7473A]/10 text-[#C7473A]'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-4 text-[#77756F]">{tx.timestamp}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="border-t border-[#DEDBD3] bg-[#FBFAF7] px-8 py-6 mt-12 text-center text-xs font-mono text-[#77756F]">
        <p>BitStreamfi Protocol • Built on Mezo Network (Testnet Chain ID 31611) • Powered by Anatomy Design Principles</p>
      </footer>

      {/* Connect & Switch Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#FBFAF7] border border-[#DEDBD3] rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#DEDBD3]">
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-[#E66C35]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715]">Select Wallet</h3>
              </div>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-[#77756F] hover:text-[#171715] font-bold text-sm px-1.5 py-0.5 rounded"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#77756F] mb-4">
              Select a provider or switch accounts directly in your browser extension (MetaMask, Rabby, OKX, etc.).
            </p>

            <div className="space-y-2.5">
              {connectors.map((connector) => (
                <button
                  key={connector.uid || connector.id}
                  onClick={() => {
                    connect({ connector });
                    setShowWalletModal(false);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#DEDBD3] bg-[#F6F4EF] hover:bg-[#E66C35] hover:text-white hover:border-[#E66C35] transition-all text-xs font-semibold text-[#171715] group"
                >
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-[#258454] group-hover:bg-white"></span>
                    <span>{connector.name || 'Browser Wallet'}</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase opacity-70 group-hover:opacity-100">Connect →</span>
                </button>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-[#DEDBD3] text-center">
              <p className="text-[11px] text-[#77756F] font-mono">
                Tip: To switch to another account in the same wallet, switch accounts inside your extension and it will update immediately.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
