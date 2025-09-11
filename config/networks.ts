import { defineChain } from 'viem';

// 网络配置
export const networks = {
  // 主网
  morph: defineChain({
    id: 2818,
    name: 'Morph',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://rpc.morphl2.io'] },
    },
    blockExplorers: {
      default: { name: 'Morph Explorer', url: 'https://explorer.morphl2.io' },
    },
    testnet: false,
  }),

  xlayer: defineChain({
    id: 196,
    name: 'X Layer',
    nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://rpc.xlayer.tech'] },
    },
    blockExplorers: {
      default: { name: 'X Layer Explorer', url: 'https://www.oklink.com/xlayer' },
    },
    testnet: false,
  }),

  // 测试网
  morphTestnet: defineChain({
    id: 2810,
    name: 'Morph Testnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://rpc-holesky.morphl2.io'] },
    },
    blockExplorers: {
      default: { name: 'Morph Testnet Explorer', url: 'https://explorer-testnet.morphl2.io' },
    },
    testnet: true,
  }),

  bscTestnet: defineChain({
    id: 97,
    name: 'BSC Testnet',
    nativeCurrency: { name: 'BNB', symbol: 'tBNB', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545'] },
    },
    blockExplorers: {
      default: { name: 'BSC Testnet Explorer', url: 'https://testnet.bscscan.com' },
    },
    testnet: true,
  }),
} as const;

// 网络信息配置
export const networkConfig = {
  [networks.morph.id]: {
    name: 'Morph',
    shortName: 'Morph',
    icon: '🔷',
    color: '#3b82f6',
    isTestnet: false,
    faucet: null,
    supportedTokens: ['BGB', 'USDT', 'USDC'],
    apiEndpoint: 'https://gate.game.com',
    supportsSwap: true,
  },
  [networks.xlayer.id]: {
    name: 'X Layer',
    shortName: 'X Layer',
    icon: '⚡',
    color: '#f97316',
    isTestnet: false,
    faucet: null,
    supportedTokens: ['OKB', 'USDT', 'USDC', 'WOKB'],
    apiEndpoint: null,
    supportsSwap: false,
  },
  [networks.morphTestnet.id]: {
    name: 'Morph Testnet',
    shortName: 'Morph Test',
    icon: '🔶',
    color: '#8b5cf6',
    isTestnet: true,
    faucet: 'https://bridge-holesky.morphl2.io',
    supportedTokens: ['ETH', 'USDT', 'USDC'],
    apiEndpoint: 'https://moodfun-api-dev.being.com',
    supportsSwap: true,
  },
  [networks.bscTestnet.id]: {
    name: 'BSC Testnet',
    shortName: 'BSC Test',
    icon: '🟡',
    color: '#f59e0b',
    isTestnet: true,
    faucet: 'https://testnet.bnbchain.org/faucet-smart',
    supportedTokens: ['BNB', 'BUSD', 'USDT'],
    apiEndpoint: null,
    supportsSwap: false,
  },
} as const;

// 代币配置
export const tokenConfig = {
  // Morph 主网代币
  [networks.morph.id]: {
    BGB: {
      symbol: 'BGB',
      name: 'BGB',
      decimals: 18,
      address: '0x55d1f1879969bdbB9960d269974564C58DBc3238',
      icon: '/bgb.png',
      isNative: false,
    },
    USDT: {
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      address: '0x...', // 需要实际合约地址
      icon: '💚',
      isNative: false,
    },
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: '0x...', // 需要实际合约地址
      icon: '💙',
      isNative: false,
    },
  },
  
  // X Layer 主网代币
  [networks.xlayer.id]: {
    OKB: {
      symbol: 'OKB',
      name: 'OKB',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000', // 原生代币
      icon: '⚡',
      isNative: true,
    },
    USDT: {
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      address: '0x...', // 需要实际合约地址
      icon: '💚',
      isNative: false,
    },
  },

  // Morph 测试网代币
  [networks.morphTestnet.id]: {
    BGB: {
      symbol: 'BGB',
      name: 'BGB',
      decimals: 18,
      address: '0x1670F6eb896191C385C5609C78eD8C9fD8514f56',
      icon: '/bgb.png',
      isNative: false,
    },
  },

  // BSC 测试网代币
  [networks.bscTestnet.id]: {
    BNB: {
      symbol: 'BNB',
      name: 'BNB',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
      icon: '🟡',
      isNative: true,
    },
  },
} as const;

// 获取支持的链
export const getSupportedChains = () => {
  const mainnetChains = [networks.morph, networks.xlayer];
  const testnetChains = [networks.morphTestnet, networks.bscTestnet];
  
  // 生产环境也显示所有链
  return [...mainnetChains, ...testnetChains];
};

// 获取网络信息
export const getNetworkInfo = (chainId: number) => {
  return networkConfig[chainId as keyof typeof networkConfig];
};

// 获取网络代币
export const getNetworkTokens = (chainId: number) => {
  return tokenConfig[chainId as keyof typeof tokenConfig] || {};
};

// 检查是否为测试网
export const isTestnet = (chainId: number) => {
  const info = getNetworkInfo(chainId);
  return info?.isTestnet || false;
};

// 获取水龙头链接
export const getFaucetUrl = (chainId: number) => {
  const info = getNetworkInfo(chainId);
  return info?.faucet;
};

// 获取API端点
export const getApiEndpoint = (chainId: number) => {
  const info = getNetworkInfo(chainId);
  return info?.apiEndpoint;
};

// 检查网络是否支持交换
export const supportsSwap = (chainId: number) => {
  const info = getNetworkInfo(chainId);
  return info?.supportsSwap || false;
};