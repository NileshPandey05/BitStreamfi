export const MEZO_TESTNET_CHAIN_ID = 31611;

export const CONTRACT_ADDRESSES = {
  vault: "0x34623FB11C65E2Cab4d252460AF1DC0F36ba9D20" as const,
  streamer: "0x0486bbfC22AA66F61A9fa1c35e221DfB19de6d93" as const,
  creditEngine: "0x625Cf421C9D7B58E747cf7D6301bdb3f235524f0" as const,
};

export const VAULT_ABI = [
  {
    type: "function",
    name: "depositCollateral",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "borrowMUSD",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "repayMUSD",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "collateralBalances",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "debtBalances",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCurrentLTV",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export const STREAMER_ABI = [
  {
    type: "function",
    name: "createStream",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "depositAmount", type: "uint256" },
      { name: "duration", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawFromStream",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "topUpStream",
    inputs: [
      { name: "streamId", type: "uint256" },
      { name: "additionalAmount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelStream",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [
      { name: "streamId", type: "uint256" },
      { name: "account", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "streams",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "employer", type: "address" },
      { name: "recipient", type: "address" },
      { name: "deposit", type: "uint256" },
      { name: "withdrawn", type: "uint256" },
      { name: "startTime", type: "uint256" },
      { name: "stopTime", type: "uint256" },
      { name: "isCancelled", type: "bool" },
    ],
    stateMutability: "view",
  },
] as const;

export const CREDIT_ENGINE_ABI = [
  {
    type: "function",
    name: "stakingYieldBalances",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "depositYield",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;
