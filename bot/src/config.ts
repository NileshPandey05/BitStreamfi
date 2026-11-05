import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  mezoRpcUrl: process.env.MEZO_RPC_URL || 'https://rpc.test.mezo.org',
  defaultChatId: process.env.TELEGRAM_ALERT_CHAT_ID || '',
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS) || 12000,
  chainId: 31611,

  // Verified deployed contract addresses on Mezo Testnet
  contracts: {
    vault: '0x669dBAd6F813CDeCa14e1A46AB91c95017603f85' as `0x${string}`,
    streamer: '0xC3C2c3113898b8FF4eeAedC992E6f34A6f7d9b0C' as `0x${string}`,
    creditEngine: '0xE1e310cCd8b1295cBbE9CD76411EaF54879c0A6F' as `0x${string}`,
    tbtc: '0xd82C1e865efD488Fd0C9AA3276D236Eae3fD77Ae' as `0x${string}`,
    musd: '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503' as `0x${string}`,
    mezo: '0x7B7c000000000000000000000000000000000001' as `0x${string}`,
    priceFeed: '0x86bCF0841622a5dAC14A313a15f96A95421b9366' as `0x${string}`,
    borrowerOperations: '0xCdF7028ceAB81fA0C6971208e83fa7872994beE5' as `0x${string}`,
    stakingBoost: '0x92678d0A29a183e194c7496EF9f043b422746EDf' as `0x${string}`,
  },
};
