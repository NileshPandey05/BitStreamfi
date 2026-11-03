export interface TransactionRecord {
  hash: string;
  type: string;
  amount: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
}

export type ActiveAction =
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

export interface ArenaTrove {
  id: string;
  name: string;
  borrower: string;
  collateralBtc: number;
  debtMusd: number;
  escrowBuffer: number;
  isNative: boolean;
}

export type TabType = 'overview' | 'vault' | 'payroll' | 'staking' | 'simulator' | 'activity';

export type TxStatus = 'idle' | 'preparing' | 'wallet_confirm' | 'pending' | 'success' | 'failed';
