import { createPublicClient, http, defineChain, parseAbi } from 'viem';
import { CONFIG } from './config.js';
export { CONFIG };

// Define Mezo Testnet chain
export const mezoTestnet = defineChain({
  id: CONFIG.chainId,
  name: 'Mezo Testnet',
  nativeCurrency: {
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [CONFIG.mezoRpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mezo Explorer',
      url: 'https://explorer.test.mezo.org',
    },
  },
});

export const publicClient = createPublicClient({
  chain: mezoTestnet,
  transport: http(CONFIG.mezoRpcUrl),
});

// ABIs aligned with deployed Mezo contracts
export const VAULT_ABI = parseAbi([
  'function tbtcCollateralBalances(address) external view returns (uint256)',
  'function nativeCollateralBalances(address) external view returns (uint256)',
  'function borrowedMUSD(address) external view returns (uint256)',
  'function getCollateralValueUSD(address user) external view returns (uint256)',
  'function getHealthFactor(address user) external view returns (uint256)',
  'function isLiquidatable(address user) external view returns (bool)',
  'function isAutoHealEligible(address employer) external view returns (bool eligible, uint256 currentICR)',
  'function calculateDebtToRestoreICR(address employer, uint256 targetICR) external view returns (uint256)',
  'function owner() external view returns (address)',
  'event CollateralDeposited(address indexed user, uint256 amount, bool isNative)',
  'event CollateralWithdrawn(address indexed user, uint256 amount, bool isNative)',
  'event MUSDBorrowed(address indexed user, uint256 amount)',
  'event MUSARepaid(address indexed user, uint256 amount)',
  'event TroveAutoHealed(address indexed employer, uint256 indexed streamId, uint256 musdRepaid, uint256 preICR, uint256 postICR)',
  'event PositionLiquidated(address indexed user, address indexed liquidator, uint256 debtRepaid, uint256 collateralSeized, bool isNative)',
]);

export const STREAMER_ABI = parseAbi([
  'function streams(uint256) external view returns (address employer, address recipient, uint256 depositAmount, uint256 startTime, uint256 stopTime, uint256 withdrawnAmount, bool active)',
  'function balanceOf(uint256 streamId) external view returns (uint256 balance)',
  'function nextStreamId() external view returns (uint256)',
  'event StreamCreated(uint256 indexed streamId, address indexed employer, address indexed recipient, uint256 depositAmount, uint256 startTime, uint256 stopTime)',
  'event TokensClaimed(uint256 indexed streamId, address indexed recipient, uint256 amount)',
  'event StreamCancelled(uint256 indexed streamId, address indexed employer, address indexed recipient, uint256 returnedToEmployer, uint256 recipientEarnings)',
]);

export const PRICEFEED_ABI = parseAbi([
  'function fetchPrice() external view returns (uint256)',
  'function lastGoodPrice() external view returns (uint256)',
]);

export const STAKING_BOOST_ABI = parseAbi([
  'function stakedBalance(address) external view returns (uint256)',
  'function getTier(address user) external view returns (uint8)',
  'function getFeeDiscountBps(address user) external view returns (uint256)',
  'function getKeeperBonusBoostBps(address user) external view returns (uint256)',
  'function earned(address account) external view returns (uint256)',
  'function totalStaked() external view returns (uint256)',
  'event Staked(address indexed user, uint256 amount)',
  'event RewardsClaimed(address indexed user, uint256 reward)',
]);

export const ERC20_ABI = parseAbi([
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
]);

