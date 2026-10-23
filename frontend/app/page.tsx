'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useChainId, useSwitchChain } from 'wagmi';
import { CONTRACT_ADDRESSES, MEZO_TESTNET_CHAIN_ID, VAULT_ABI, STREAMER_ABI, CREDIT_ENGINE_ABI, ERC20_ABI } from './contracts';
import { parseEther, formatEther, isAddress } from 'viem';
import { Shield, Zap, DollarSign, Clock, Wallet, ArrowUpRight, PlusCircle, XCircle, Activity, ChevronRight, CheckCircle2, RefreshCw, AlertTriangle, ExternalLink, Layers } from 'lucide-react';

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

  const [activeTab, setActiveTab] = useState<'overview' | 'vault' | 'payroll' | 'activity'>('overview');
  const [animationPhase, setAnimationPhase] = useState(0);

  // Transaction history log state
  const [transactions, setTransactions] = useState<TransactionRecord[]>([
    { hash: '0x3331...33e9', type: 'Deposit tBTC', amount: '0.5 tBTC', status: 'success', timestamp: '10 mins ago' },
    { hash: '0x81fa...92a1', type: 'Borrow MUSD', amount: '15,000 MUSD', status: 'success', timestamp: '2 hours ago' },
  ]);

  // UI feedback states
  const [txStatus, setTxStatus] = useState<'idle' | 'preparing' | 'wallet_confirm' | 'pending' | 'success' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

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
  useEffect(() => {
    setMounted(true);
  }, []);

  // Payroll form states
  const [recipient, setRecipient] = useState('');
  const [streamDeposit, setStreamDeposit] = useState('');
  const [duration, setDuration] = useState('');
  const [streamIdToManage, setStreamIdToManage] = useState('0');
  const [topUpAmount, setTopUpAmount] = useState('');

  // Wagmi write hooks
  const { writeContract: writeVault, isPending: vaultPending } = useWriteContract();
  const { writeContract: writeStreamer, isPending: streamerPending } = useWriteContract();
  const { writeContract: writeGeneric, isPending: genericPending } = useWriteContract();

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

  const isWrongNetwork = isConnected && chainId !== MEZO_TESTNET_CHAIN_ID;

  // ERC-20 Approval Handler
  const handleApprove = (token: 'tbtc' | 'musd', spender: 'vault' | 'streamer' | 'creditEngine', amountStr: string) => {
    if (isWrongNetwork || !amountStr || Number(amountStr) <= 0) return;
    setTxStatus('wallet_confirm');
    setStatusMessage(`Approving ${token.toUpperCase()} for ${spender}...`);

    const tokenAddress = token === 'tbtc' ? CONTRACT_ADDRESSES.tbtc : CONTRACT_ADDRESSES.musd;
    const spenderAddress = CONTRACT_ADDRESSES[spender];

    writeGeneric(
      {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spenderAddress, parseEther(amountStr)],
      },
      {
        onSuccess: (hash) => {
          setTxStatus('pending');
          setStatusMessage('Approval transaction broadcasted...');
          setTimeout(() => {
            setTxStatus('success');
            setStatusMessage(`Approved ${amountStr} ${token.toUpperCase()}`);
            setTransactions(prev => [{ hash: hash.slice(0, 10) + '...', type: `Approve ${token.toUpperCase()}`, amount: `${amountStr} ${token.toUpperCase()}`, status: 'success', timestamp: 'Just now' }, ...prev]);
          }, 3000);
        },
        onError: (err) => {
          setTxStatus('failed');
          setStatusMessage(err.message || 'Approval failed.');
        }
      }
    );
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
    const tbtcBalNum = tbtcBalance ? Number(formatEther(tbtcBalance as bigint)) : 0;
    if (amountNum > tbtcBalNum) {
      setTxStatus('failed');
      setStatusMessage(`Insufficient tBTC balance (${tbtcBalNum.toFixed(4)} available).`);
      return;
    }
    setTxStatus('wallet_confirm');
    setStatusMessage('Confirm transaction in wallet...');

    writeVault(
      {
        address: CONTRACT_ADDRESSES.vault,
        abi: VAULT_ABI,
        functionName: 'depositCollateral',
        args: [parseEther(collateralAmount)],
      },
      {
        onSuccess: (hash) => {
          setTxStatus('pending');
          setStatusMessage('Transaction broadcasted. Waiting for Mezo L2 confirmation...');
          setTimeout(() => {
            setTxStatus('success');
            setStatusMessage(`Successfully deposited ${collateralAmount} tBTC`);
            setTransactions(prev => [{ hash: hash.slice(0, 10) + '...', type: 'Deposit tBTC', amount: `${collateralAmount} tBTC`, status: 'success', timestamp: 'Just now' }, ...prev]);
            refetchCollateral();
            refetchTbtc();
          }, 3000);
        },
        onError: (err) => {
          setTxStatus('failed');
          setStatusMessage(err.message || 'Transaction rejected or failed.');
        }
      }
    );
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
    if (amountNum > availableBorrowUSD) {
      setTxStatus('failed');
      setStatusMessage(`Borrow exceeds max 60% LTV ($${availableBorrowUSD.toFixed(2)} MUSD available).`);
      return;
    }
    setTxStatus('wallet_confirm');
    setStatusMessage('Confirm borrow request in wallet...');

    writeVault(
      {
        address: CONTRACT_ADDRESSES.vault,
        abi: VAULT_ABI,
        functionName: 'borrowMUSD',
        args: [parseEther(borrowAmount)],
      },
      {
        onSuccess: (hash) => {
          setTxStatus('pending');
          setStatusMessage('Borrow transaction broadcasted to Mezo L2...');
          setTimeout(() => {
            setTxStatus('success');
            setStatusMessage(`Successfully borrowed ${borrowAmount} MUSD`);
            setTransactions(prev => [{ hash: hash.slice(0, 10) + '...', type: 'Borrow MUSD', amount: `${borrowAmount} MUSD`, status: 'success', timestamp: 'Just now' }, ...prev]);
            refetchDebt();
            refetchMusd();
          }, 3000);
        },
        onError: (err) => {
          setTxStatus('failed');
          setStatusMessage(err.message || 'Borrow failed or exceeded Max LTV (60%).');
        }
      }
    );
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
    setTxStatus('wallet_confirm');
    setStatusMessage('Confirm repayment in wallet...');

    writeVault(
      {
        address: CONTRACT_ADDRESSES.vault,
        abi: VAULT_ABI,
        functionName: 'repayMUSD',
        args: [parseEther(repayAmount)],
      },
      {
        onSuccess: (hash) => {
          setTxStatus('pending');
          setStatusMessage('Repayment transaction broadcasted...');
          setTimeout(() => {
            setTxStatus('success');
            setStatusMessage(`Successfully repaid ${repayAmount} MUSD`);
            setTransactions(prev => [{ hash: hash.slice(0, 10) + '...', type: 'Repay MUSD', amount: `${repayAmount} MUSD`, status: 'success', timestamp: 'Just now' }, ...prev]);
            refetchDebt();
            refetchMusd();
          }, 3000);
        },
        onError: (err) => {
          setTxStatus('failed');
          setStatusMessage(err.message || 'Repayment failed.');
        }
      }
    );
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
      setStatusMessage(`Insufficient MUSD balance for stream (${musdBalNum.toLocaleString()} available).`);
      return;
    }
    setTxStatus('wallet_confirm');
    setStatusMessage('Confirm stream creation in wallet...');

    writeStreamer(
      {
        address: CONTRACT_ADDRESSES.streamer,
        abi: STREAMER_ABI,
        functionName: 'createStream',
        args: [recipient as `0x${string}`, parseEther(streamDeposit), BigInt(duration)],
      },
      {
        onSuccess: (hash) => {
          setTxStatus('pending');
          setStatusMessage('Stream creation transaction broadcasted...');
          setTimeout(() => {
            setTxStatus('success');
            setStatusMessage(`Created stream of ${streamDeposit} MUSD`);
            setTransactions(prev => [{ hash: hash.slice(0, 10) + '...', type: 'Create Stream', amount: `${streamDeposit} MUSD`, status: 'success', timestamp: 'Just now' }, ...prev]);
            refetchStream();
          }, 3000);
        },
        onError: (err) => {
          setTxStatus('failed');
          setStatusMessage(err.message || 'Stream creation failed.');
        }
      }
    );
  };

  const handleWithdrawStream = () => {
    if (isWrongNetwork) return;
    setTxStatus('wallet_confirm');
    setStatusMessage('Confirm withdrawal in wallet...');

    writeStreamer(
      {
        address: CONTRACT_ADDRESSES.streamer,
        abi: STREAMER_ABI,
        functionName: 'withdrawFromStream',
        args: [BigInt(streamIdToManage)],
      },
      {
        onSuccess: (hash) => {
          setTxStatus('pending');
          setStatusMessage('Withdrawal transaction broadcasted...');
          setTimeout(() => {
            setTxStatus('success');
            setStatusMessage(`Withdrawn from Stream #${streamIdToManage}`);
            setTransactions(prev => [{ hash: hash.slice(0, 10) + '...', type: 'Withdraw Stream', amount: `Stream #${streamIdToManage}`, status: 'success', timestamp: 'Just now' }, ...prev]);
            refetchStream();
          }, 3000);
        },
        onError: (err) => {
          setTxStatus('failed');
          setStatusMessage(err.message || 'Withdrawal failed.');
        }
      }
    );
  };

  const handleTopUpStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpAmount || isWrongNetwork) return;
    const amountNum = Number(topUpAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTxStatus('failed');
      setStatusMessage('Top up amount must be > 0.');
      return;
    }
    const musdBalNum = musdBalance ? Number(formatEther(musdBalance as bigint)) : 0;
    if (amountNum > musdBalNum) {
      setTxStatus('failed');
      setStatusMessage(`Insufficient MUSD balance for top up (${musdBalNum.toLocaleString()} available).`);
      return;
    }
    setTxStatus('wallet_confirm');
    setStatusMessage('Confirm stream top-up in wallet...');

    writeStreamer(
      {
        address: CONTRACT_ADDRESSES.streamer,
        abi: STREAMER_ABI,
        functionName: 'topUpStream',
        args: [BigInt(streamIdToManage), parseEther(topUpAmount)],
      },
      {
        onSuccess: (hash) => {
          setTxStatus('pending');
          setStatusMessage('Top-up transaction broadcasted...');
          setTimeout(() => {
            setTxStatus('success');
            setStatusMessage(`Topped up Stream #${streamIdToManage} with ${topUpAmount} MUSD`);
            setTransactions(prev => [{ hash: hash.slice(0, 10) + '...', type: 'Top-up Stream', amount: `${topUpAmount} MUSD`, status: 'success', timestamp: 'Just now' }, ...prev]);
            refetchStream();
          }, 3000);
        },
        onError: (err) => {
          setTxStatus('failed');
          setStatusMessage(err.message || 'Top-up failed.');
        }
      }
    );
  };

  const handleCancelStream = () => {
    if (isWrongNetwork) return;
    setTxStatus('wallet_confirm');
    setStatusMessage('Confirm stream cancellation in wallet...');

    writeStreamer(
      {
        address: CONTRACT_ADDRESSES.streamer,
        abi: STREAMER_ABI,
        functionName: 'cancelStream',
        args: [BigInt(streamIdToManage)],
      },
      {
        onSuccess: (hash) => {
          setTxStatus('pending');
          setStatusMessage('Cancellation transaction broadcasted...');
          setTimeout(() => {
            setTxStatus('success');
            setStatusMessage(`Cancelled Stream #${streamIdToManage}`);
            setTransactions(prev => [{ hash: hash.slice(0, 10) + '...', type: 'Cancel Stream', amount: `Stream #${streamIdToManage}`, status: 'success', timestamp: 'Just now' }, ...prev]);
            refetchStream();
          }, 3000);
        },
        onError: (err) => {
          setTxStatus('failed');
          setStatusMessage(err.message || 'Cancellation failed.');
        }
      }
    );
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
    setTxStatus('wallet_confirm');
    setStatusMessage('Confirm collateral withdrawal in wallet...');

    writeVault(
      {
        address: CONTRACT_ADDRESSES.vault,
        abi: VAULT_ABI,
        functionName: 'withdrawCollateral',
        args: [parseEther(withdrawAmount)],
      },
      {
        onSuccess: (hash) => {
          setTxStatus('pending');
          setStatusMessage('Withdrawal transaction broadcasted to Mezo L2...');
          setTimeout(() => {
            setTxStatus('success');
            setStatusMessage(`Successfully withdrawn ${withdrawAmount} tBTC`);
            setTransactions(prev => [{ hash: hash.slice(0, 10) + '...', type: 'Withdraw tBTC', amount: `${withdrawAmount} tBTC`, status: 'success', timestamp: 'Just now' }, ...prev]);
            refetchCollateral();
            refetchTbtc();
          }, 3000);
        },
        onError: (err) => {
          setTxStatus('failed');
          setStatusMessage(err.message || 'Withdrawal failed or position would be undercollateralized.');
        }
      }
    );
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
    setTxStatus('wallet_confirm');
    setStatusMessage('Confirm yield deposit in wallet...');

    writeGeneric(
      {
        address: CONTRACT_ADDRESSES.creditEngine,
        abi: CREDIT_ENGINE_ABI,
        functionName: 'depositYield',
        args: [parseEther(yieldDepositAmount)],
      },
      {
        onSuccess: (hash) => {
          setTxStatus('pending');
          setStatusMessage('Deposit yield broadcasted to Mezo L2...');
          setTimeout(() => {
            setTxStatus('success');
            setStatusMessage(`Deposited ${yieldDepositAmount} MUSD into Credit Engine`);
            setTransactions(prev => [{ hash: hash.slice(0, 10) + '...', type: 'Deposit Yield', amount: `${yieldDepositAmount} MUSD`, status: 'success', timestamp: 'Just now' }, ...prev]);
            refetchYield();
            refetchMusd();
          }, 3000);
        },
        onError: (err) => {
          setTxStatus('failed');
          setStatusMessage(err.message || 'Deposit yield failed.');
        }
      }
    );
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
    setTxStatus('wallet_confirm');
    setStatusMessage('Confirm debt amortization in wallet...');

    writeGeneric(
      {
        address: CONTRACT_ADDRESSES.creditEngine,
        abi: CREDIT_ENGINE_ABI,
        functionName: 'amortizeDebt',
        args: [address, parseEther(amortizeAmount)],
      },
      {
        onSuccess: (hash) => {
          setTxStatus('pending');
          setStatusMessage('Amortization transaction broadcasted to Mezo L2...');
          setTimeout(() => {
            setTxStatus('success');
            setStatusMessage(`Amortized ${amortizeAmount} MUSD of debt from yield`);
            setTransactions(prev => [{ hash: hash.slice(0, 10) + '...', type: 'Amortize Debt', amount: `${amortizeAmount} MUSD`, status: 'success', timestamp: 'Just now' }, ...prev]);
            refetchDebt();
            refetchYield();
          }, 3000);
        },
        onError: (err) => {
          setTxStatus('failed');
          setStatusMessage(err.message || 'Debt amortization failed.');
        }
      }
    );
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
        <div className="fixed bottom-6 right-6 z-50 bg-[#FBFAF7] border border-[#DEDBD3] p-4 rounded-xl shadow-2xl max-w-sm flex items-start space-x-3">
          {txStatus === 'success' && <CheckCircle2 className="w-5 h-5 text-[#258454] shrink-0 mt-0.5" />}
          {txStatus === 'failed' && <XCircle className="w-5 h-5 text-[#C7473A] shrink-0 mt-0.5" />}
          {(txStatus === 'pending' || txStatus === 'wallet_confirm' || txStatus === 'preparing') && (
            <RefreshCw className="w-5 h-5 text-[#E66C35] shrink-0 mt-0.5 animate-spin" />
          )}
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[#77756F]">
              {txStatus === 'success' ? 'Confirmed' : txStatus === 'failed' ? 'Failed' : 'Processing'}
            </p>
            <p className="text-xs font-mono text-[#171715] mt-1">{statusMessage}</p>
          </div>
          <button onClick={() => setTxStatus('idle')} className="text-[#77756F] hover:text-[#171715] text-xs font-bold px-1">×</button>
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

          {isConnected ? (
            <div className="flex items-center space-x-3 bg-[#F6F4EF] px-4 py-2 rounded-xl border border-[#DEDBD3] shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#258454]"></span>
              <span className="text-xs font-mono font-medium text-[#171715]">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button
                onClick={() => {
                  disconnect();
                  setShowWalletModal(true);
                }}
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
                          disabled={vaultPending || !isConnected}
                          className="w-full bg-[#171715] hover:bg-[#E66C35] text-white font-semibold py-2.5 rounded-lg text-xs transition-colors"
                        >
                          {vaultPending ? 'Processing...' : 'Deposit Collateral'}
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
                          disabled={vaultPending || !isConnected}
                          className="w-full bg-[#171715] hover:bg-[#E66C35] text-white font-semibold py-2.5 rounded-lg text-xs transition-colors"
                        >
                          {vaultPending ? 'Processing...' : 'Borrow Stablecoins'}
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
                  <span className="text-[#77756F]">Wallet tBTC: </span>
                  <strong className="text-[#171715]">{mounted && tbtcBalance ? Number(formatEther(tbtcBalance as bigint)).toFixed(4) : '0.0000'}</strong>
                </div>
                <div className="bg-[#FBFAF7] border border-[#DEDBD3] px-3.5 py-2 rounded-xl">
                  <span className="text-[#77756F]">Wallet MUSD: </span>
                  <strong className="text-[#171715]">{mounted && musdBalance ? Number(formatEther(musdBalance as bigint)).toLocaleString() : '0'}</strong>
                </div>
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
                    <label>Deposit tBTC</label>
                    <span>Balance: {mounted && tbtcBalance ? Number(formatEther(tbtcBalance as bigint)).toFixed(4) : '0'} tBTC</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.0001"
                      value={collateralAmount}
                      onChange={(e) => setCollateralAmount(e.target.value)}
                      placeholder="0.0 tBTC"
                      className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#E66C35]"
                    />
                    {tbtcBalance && (
                      <button
                        type="button"
                        onClick={() => setCollateralAmount(formatEther(tbtcBalance as bigint))}
                        className="absolute right-3 top-2.5 text-[11px] font-mono bg-[#DEDBD3]/40 px-2 py-1 rounded text-[#171715] hover:bg-[#DEDBD3]"
                      >
                        MAX
                      </button>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleApprove('tbtc', 'vault', collateralAmount || '10')}
                      disabled={genericPending || !isConnected}
                      className="flex-1 bg-[#FBFAF7] border border-[#DEDBD3] hover:border-[#E66C35] text-[#171715] font-semibold py-2.5 rounded-xl text-xs transition-colors"
                    >
                      {genericPending ? 'Approving...' : '1. Approve tBTC'}
                    </button>
                    <button
                      type="submit"
                      disabled={vaultPending || !isConnected}
                      className="flex-1 bg-[#171715] hover:bg-[#E66C35] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors"
                    >
                      {vaultPending ? 'Depositing...' : '2. Deposit tBTC'}
                    </button>
                  </div>
                </form>

                {/* Withdraw Collateral Form */}
                <form onSubmit={handleWithdrawCollateral} className="space-y-3 pt-4 border-t border-[#DEDBD3]">
                  <div className="flex justify-between items-center text-xs font-mono text-[#77756F]">
                    <label>Withdraw tBTC</label>
                    <span>Safe Max: {maxWithdrawableEth.toFixed(4)} tBTC</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.0001"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.0 tBTC"
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
                    disabled={vaultPending || !isConnected || maxWithdrawableEth <= 0}
                    className="w-full bg-[#171715] hover:bg-[#B7791F] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors"
                  >
                    {vaultPending ? 'Withdrawing...' : 'Withdraw Collateral'}
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
                    disabled={vaultPending || !isConnected || availableBorrowUSD <= 0}
                    className="w-full bg-[#171715] hover:bg-[#B7791F] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors"
                  >
                    {vaultPending ? 'Minting...' : 'Borrow MUSD'}
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
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleApprove('musd', 'vault', repayAmount || '10000')}
                      disabled={genericPending || !isConnected}
                      className="flex-1 bg-[#FBFAF7] border border-[#DEDBD3] hover:border-[#258454] text-[#171715] font-semibold py-2.5 rounded-xl text-xs transition-colors"
                    >
                      {genericPending ? 'Approving...' : '1. Approve MUSD'}
                    </button>
                    <button
                      type="submit"
                      disabled={vaultPending || !isConnected || debtEth <= 0}
                      className="flex-1 bg-[#171715] hover:bg-[#258454] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors"
                    >
                      {vaultPending ? 'Repaying...' : '2. Repay MUSD'}
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
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleApprove('musd', 'creditEngine', yieldDepositAmount || '5000')}
                        disabled={genericPending || !isConnected}
                        className="flex-1 bg-[#FBFAF7] border border-[#DEDBD3] hover:border-[#E66C35] text-[#171715] font-semibold py-2 rounded-lg text-xs transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        type="submit"
                        disabled={genericPending || !isConnected}
                        className="flex-1 bg-[#171715] hover:bg-[#E66C35] text-white font-semibold py-2 rounded-lg text-xs transition-colors"
                      >
                        Deposit Yield
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
                      disabled={genericPending || !isConnected || debtEth <= 0 || !yieldBalance}
                      className="w-full bg-[#258454] hover:opacity-90 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-xs transition-colors"
                    >
                      Amortize Vault Debt
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
              <p className="text-xs text-[#77756F] mt-1">Create and manage second-by-second MUSD salary streams with enterprise revocation controls.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Create Stream Form */}
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715] mb-2 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-[#E66C35]" />
                  <span>Create Salary Stream</span>
                </h3>
                <p className="text-xs text-[#77756F] mb-6">Deposit MUSD for continuous second-by-second vesting.</p>
                <form onSubmit={handleCreateStream} className="space-y-4">
                  <div>
                    <label className="text-xs font-mono text-[#77756F] block mb-1">Recipient Address</label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="0x..."
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
                    <label className="text-xs font-mono text-[#77756F] block mb-1">Duration (Seconds)</label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="2592000 (30 days)"
                      className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#E66C35]"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleApprove('musd', 'streamer', streamDeposit || '1000')}
                      disabled={genericPending || !isConnected}
                      className="flex-1 bg-[#FBFAF7] border border-[#DEDBD3] hover:border-[#E66C35] text-[#171715] font-semibold py-3 rounded-xl text-xs transition-colors"
                    >
                      {genericPending ? 'Approving...' : '1. Approve MUSD'}
                    </button>
                    <button
                      type="submit"
                      disabled={streamerPending || !isConnected}
                      className="flex-1 bg-[#E66C35] hover:bg-[#171715] disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-xs transition-colors"
                    >
                      {streamerPending ? 'Processing...' : '2. Create Stream'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Manage Stream */}
              <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715] mb-2 flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-[#258454]" />
                    <span>Stream Management</span>
                  </h3>
                  <p className="text-xs text-[#77756F] mb-6">Inspect stream balances, top-up liquidity, withdraw, or cancel.</p>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-mono text-[#77756F] block mb-1">Stream ID</label>
                      <input
                        type="number"
                        value={streamIdToManage}
                        onChange={(e) => setStreamIdToManage(e.target.value)}
                        className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#258454]"
                      />
                    </div>

                    {streamData && (
                      <div className="bg-[#F6F4EF] border border-[#DEDBD3] p-4 rounded-xl space-y-2 text-xs font-mono">
                        <div className="flex justify-between"><span className="text-[#77756F]">Employer:</span> <span className="text-[#171715]">{(streamData as any)[0]?.slice(0, 6)}...</span></div>
                        <div className="flex justify-between"><span className="text-[#77756F]">Recipient:</span> <span className="text-[#171715]">{(streamData as any)[1]?.slice(0, 6)}...</span></div>
                        <div className="flex justify-between"><span className="text-[#77756F]">Deposit:</span> <span className="font-bold text-[#171715]">{formatEther((streamData as any)[2] || BigInt(0))} MUSD</span></div>
                        <div className="flex justify-between"><span className="text-[#77756F]">Withdrawn:</span> <span className="font-bold text-[#258454]">{formatEther((streamData as any)[5] || BigInt(0))} MUSD</span></div>
                      </div>
                    )}

                    <form onSubmit={handleTopUpStream} className="space-y-3 pt-2">
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          placeholder="Top up amount (MUSD)"
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                          className="flex-1 bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-2.5 text-[#171715] font-mono text-xs focus:outline-none focus:border-[#258454]"
                        />
                        <button
                          type="submit"
                          disabled={streamerPending || !isConnected}
                          className="bg-[#171715] hover:bg-[#258454] disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors"
                        >
                          Top Up
                        </button>
                      </div>
                    </form>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={handleWithdrawStream}
                        disabled={streamerPending || !isConnected}
                        className="bg-[#258454] hover:opacity-90 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors"
                      >
                        Withdraw Funds
                      </button>
                      <button
                        onClick={handleCancelStream}
                        disabled={streamerPending || !isConnected}
                        className="bg-[#C7473A] hover:opacity-90 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Stream</span>
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
            <div className="border-b border-[#DEDBD3] pb-4">
              <h2 className="text-3xl font-serif-display font-bold text-[#171715]">Transaction Activity</h2>
              <p className="text-xs text-[#77756F] mt-1">Confirmed transactions on Mezo Testnet (Chain 31611).</p>
            </div>

            <div className="bg-[#FBFAF7] border border-[#DEDBD3] rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DEDBD3] bg-[#F6F4EF] text-xs font-mono uppercase text-[#77756F]">
                    <th className="p-4 font-medium">Type</th>
                    <th className="p-4 font-medium">Amount / Ref</th>
                    <th className="p-4 font-medium">Tx Hash</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DEDBD3] text-xs font-mono">
                  {transactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-[#F6F4EF]/50 transition-colors">
                      <td className="p-4 font-bold text-[#171715]">{tx.type}</td>
                      <td className="p-4 text-[#77756F]">{tx.amount}</td>
                      <td className="p-4">
                        <a
                          href={`https://explorer.test.mezo.org/tx/${tx.hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#E66C35] hover:underline flex items-center space-x-1"
                        >
                          <span>{tx.hash}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="p-4">
                        <span className="bg-[#258454]/10 text-[#258454] px-2.5 py-1 rounded-full font-semibold">
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-4 text-[#77756F]">{tx.timestamp}</td>
                    </tr>
                  ))}
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
                    disconnect();
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
